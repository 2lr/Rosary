import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, one, run } from './index';
import type { Lang } from '@/lib/i18n/config';

/**
 * Where a reminder is delivered, and what has already been sent.
 *
 * A browser hands out an endpoint and two keys; that is the whole of a push
 * subscription. One person can have several — a phone and a laptop — and each
 * is dropped the moment the push service says it is gone, which is the only
 * honest way to keep the table from filling with dead addresses.
 */

export type PushTarget = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function saveSubscription(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string },
): Promise<void> {
  // The endpoint is the identity. Re-subscribing on the same browser hands back
  // the same one, and it may have moved to another account since.
  await run('DELETE FROM push_subscriptions WHERE endpoint = ?', [subscription.endpoint]);
  await run(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      userId,
      subscription.endpoint,
      subscription.p256dh,
      subscription.auth,
      new Date().toISOString(),
    ],
  );
}

export async function dropSubscription(endpoint: string): Promise<void> {
  await run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
}

export async function subscriptionsOf(userId: string): Promise<PushTarget[]> {
  return all<PushTarget>(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    [userId],
  );
}

export async function subscriptionCount(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    'SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?',
    [userId],
  );
  return Number(row?.n) || 0;
}

/** Somebody who has asked to be reminded, with everything needed to do it. */
export type Listener = {
  id: string;
  lang: Lang;
  /** Hour of their own day, 0–23. Null when they only want the evening word. */
  notifyHour: number | null;
  notifyLineage: boolean;
  timeZone: string;
};

export async function listeners(): Promise<Listener[]> {
  const rows = await all<{
    id: string;
    lang: string;
    notify_hour: number | null;
    notify_lineage: number | null;
    time_zone: string | null;
  }>(
    `SELECT u.id, u.lang, u.notify_hour, u.notify_lineage, u.time_zone
       FROM users u
      WHERE (u.notify_hour IS NOT NULL OR u.notify_lineage = 1)
        AND EXISTS (SELECT 1 FROM push_subscriptions p WHERE p.user_id = u.id)`,
    [],
  );

  return rows.map((row) => ({
    id: row.id,
    lang: row.lang === 'en' ? 'en' : 'fr',
    notifyHour: row.notify_hour === null ? null : Number(row.notify_hour),
    notifyLineage: Number(row.notify_lineage) === 1,
    // A browser that never told us where it is gets Paris, which is where this
    // was written and where most of the people praying it are.
    timeZone: row.time_zone || 'Europe/Paris',
  }));
}

/**
 * Whether this word has already gone out today, marking it as gone if not.
 *
 * The insert is the claim: the primary key on (user, kind, day) means two
 * overlapping runs of the sender cannot both decide they are the one to send.
 */
export async function claimNotification(
  userId: string,
  kind: string,
  day: string,
): Promise<boolean> {
  const existing = await one<{ user_id: string }>(
    'SELECT user_id FROM notifications_sent WHERE user_id = ? AND kind = ? AND day = ?',
    [userId, kind, day],
  );
  if (existing) return false;

  try {
    await run(
      'INSERT INTO notifications_sent (user_id, kind, day, sent_at) VALUES (?, ?, ?, ?)',
      [userId, kind, day, new Date().toISOString()],
    );
    return true;
  } catch {
    // Lost the race to another run. That one is sending it.
    return false;
  }
}

/**
 * Rosaries finished recently, by one person or by everybody below them.
 *
 * Returned as raw timestamps rather than counted here, because "today" is a
 * question about somebody's own clock and only the caller knows what theirs
 * says. Thirty-six hours is enough to cover any timezone's idea of today.
 */
export async function recentCompletions(
  userId: string,
  scope: 'self' | 'lineage',
): Promise<{ completedAt: string; decades: number }[]> {
  const since = new Date(Date.now() - 36 * 3_600_000).toISOString();

  if (scope === 'self') {
    return all<{ completedAt: string; decades: number }>(
      `SELECT completed_at AS "completedAt", decades_completed AS decades
         FROM rosaries
        WHERE user_id = ? AND status = 'completed' AND completed_at >= ?`,
      [userId, since],
    );
  }

  return all<{ completedAt: string; decades: number }>(
    `WITH RECURSIVE tree(id, depth) AS (
       SELECT id, 1 FROM users WHERE invited_by = ?
       UNION ALL
       SELECT u.id, t.depth + 1 FROM users u JOIN tree t ON u.invited_by = t.id
        WHERE t.depth < 20
     )
     SELECT r.completed_at AS "completedAt", r.decades_completed AS decades
       FROM rosaries r
      WHERE r.status = 'completed' AND r.completed_at >= ?
        AND r.user_id IN (SELECT id FROM tree)`,
    [userId, since],
  );
}
