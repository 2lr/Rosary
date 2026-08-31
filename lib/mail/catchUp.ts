import 'server-only';
import { markNoticeRetried, noticeHistory } from '@/lib/db/notices';
import { inviteCodeOf } from '@/lib/db/users';
import { prayerNotice } from '@/lib/mail/prayerNotice';
import { noticesToRetry } from '@/lib/mail/retry';
import { appUrl, sendMail } from '@/lib/mail/send';
import { verseFor } from '@/lib/mail/verses';

/**
 * Sending the words that never went out.
 *
 * A server without a mailer configured still records every notice it could not
 * send, which means the backlog is sitting there the day the mailer is set up.
 * This walks it: one mail per address, the most recent prayer for each, and the
 * row updated in place with whatever the provider says this time.
 *
 * It says nothing about when the prayer was said. Somebody receiving this a
 * week later is being told a true thing — a rosary was prayed for them — and
 * the date it happened is not theirs to be given: it would point at who.
 *
 * Like the first attempt, it never throws. The caller is a person tapping a
 * button, and the answer they need is how many went, not a stack trace.
 */
export type CatchUp = { sent: number; failed: number; error: string | null };

export async function catchUpNotices(
  userId: string,
  /** The origin the button was pressed from, used for the link. */
  origin?: string | null,
): Promise<CatchUp> {
  const result: CatchUp = { sent: 0, failed: 0, error: null };

  const base = appUrl(origin);
  const code = await inviteCodeOf(userId);
  if (!base || !code) {
    result.error = base ? 'no invite code' : 'no address for the app';
    return result;
  }

  const waiting = noticesToRetry(await noticeHistory(userId), new Date());
  const today = new Date().toISOString().slice(0, 10);

  for (const row of waiting) {
    const lang = row.lang === 'en' ? 'en' : 'fr';
    const verse = verseFor(row.email, today);
    const notice = prayerNotice({ lang, verse, code, appUrl: base });

    const outcome = await sendMail({ to: row.email, ...notice }).catch(() => ({
      status: 'failed' as const,
      error: 'the mailer could not be reached',
    }));

    await markNoticeRetried(row.id, {
      status: outcome.status,
      error: outcome.error ?? null,
      verse: verse.ref.en,
    });

    if (outcome.status === 'sent') result.sent += 1;
    else {
      result.failed += 1;
      result.error = result.error ?? outcome.error ?? outcome.status;
    }
  }

  return result;
}
