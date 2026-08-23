import { timingSafeEqual } from 'node:crypto';
import { handle, json } from '@/lib/api';
import {
  claimNotification,
  dropSubscription,
  listeners,
  recentCompletions,
  subscriptionsOf,
} from '@/lib/db/push';
import { LINEAGE_HOUR, localDay, localHour } from '@/lib/push/clock';
import { dailyReminder, lineageReport } from '@/lib/push/messages';
import { sendPush } from '@/lib/push/send';

/**
 * The one thing in this app that runs without anybody opening it.
 *
 * Something outside has to call this — a scheduler every quarter of an hour —
 * because a web app has no clock of its own. Each call asks, for everybody who
 * wants reminding: is it their hour where they are, and has today's word
 * already gone? Both questions are answered in their zone, never the server's.
 *
 * Two words may go out. The reminder, at the hour they chose, and only if they
 * have not prayed today — a reminder to do what you have already done is worse
 * than none. And in the evening, what the people below them prayed today, only
 * when there is something to tell.
 *
 * Sending is claimed before it is attempted, so two overlapping runs cannot
 * both decide they are the one. A failed send is not retried within the day:
 * better a missed reminder than a phone buzzing every fifteen minutes.
 */

export const dynamic = 'force-dynamic';

function allowed(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const offered = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(offered);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  return handle(async () => {
    if (!allowed(request)) return json({ error: 'forbidden' }, { status: 403 });

    const now = new Date().toISOString();
    const report = { considered: 0, daily: 0, lineage: 0, dropped: 0 };

    for (const person of await listeners()) {
      report.considered += 1;
      const hour = localHour(now, person.timeZone);
      const day = localDay(now, person.timeZone);

      const wantsDaily = person.notifyHour !== null && person.notifyHour === hour;
      const wantsLineage = person.notifyLineage && hour === LINEAGE_HOUR;
      if (!wantsDaily && !wantsLineage) continue;

      if (wantsDaily) {
        const prayed = (await recentCompletions(person.id, 'self')).some(
          (row) => localDay(row.completedAt, person.timeZone) === day,
        );
        if (!prayed && (await claimNotification(person.id, 'daily', day))) {
          await deliver(person.id, dailyReminder(person.lang), report);
          report.daily += 1;
        }
      }

      if (wantsLineage) {
        const today = (await recentCompletions(person.id, 'lineage')).filter(
          (row) => localDay(row.completedAt, person.timeZone) === day,
        );
        if (today.length === 0) continue;
        if (!(await claimNotification(person.id, 'lineage', day))) continue;

        const decades = today.reduce((sum, row) => sum + (Number(row.decades) || 0), 0);
        await deliver(
          person.id,
          lineageReport(person.lang, { rosaries: today.length, decades }),
          report,
        );
        report.lineage += 1;
      }
    }

    return json(report);
  });
}

async function deliver(
  userId: string,
  message: ReturnType<typeof dailyReminder>,
  report: { dropped: number },
): Promise<void> {
  for (const target of await subscriptionsOf(userId)) {
    const outcome = await sendPush(target, message);
    // A push service saying the browser is gone is the only reliable signal
    // that a subscription is dead. Anything else may work tomorrow.
    if (outcome === 'gone') {
      await dropSubscription(target.endpoint);
      report.dropped += 1;
    }
  }
}
