import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, one, run } from './index';
import type { Lang } from '@/lib/i18n/config';
import type { MailStatus } from '@/lib/mail/send';

/**
 * The word sent to somebody a rosary was prayed for.
 *
 * One per rosary, and the row is written whatever happens to the mail — sent,
 * refused by the provider, or never attempted because none is configured. A
 * mail nobody can account for afterwards is worse than no mail.
 *
 * The address is stored because a person who was written to once should not be
 * written to again the same day, and because somebody has to be able to answer
 * "did that actually go out?". The intention never comes near this table.
 */

/** How many of these one account may send in a day. */
export const NOTICES_PER_DAY = 12;

/**
 * What became of one notice. Beyond the three the mailer knows about, two
 * reasons of our own for not sending — both recorded rather than silent.
 */
export type NoticeStatus = MailStatus | 'too_many' | 'already_today';

export type NoticeRecord = {
  userId: string;
  rosaryId: string;
  email: string;
  lang: Lang;
  /** The reference of the verse that went with it. */
  verse: string;
  status: NoticeStatus;
  error?: string | null;
};

export async function recordNotice(notice: NoticeRecord): Promise<void> {
  await run(
    `INSERT INTO prayer_notices
       (id, user_id, rosary_id, email, lang, verse, status, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      notice.userId,
      notice.rosaryId,
      notice.email.trim().toLowerCase(),
      notice.lang,
      notice.verse,
      notice.status,
      notice.error ?? null,
      new Date().toISOString(),
    ],
  );
}

/** Whether this rosary has already had its word sent. */
export async function noticeSentFor(rosaryId: string): Promise<boolean> {
  const row = await one<{ id: string }>('SELECT id FROM prayer_notices WHERE rosary_id = ?', [
    rosaryId,
  ]);
  return row !== null && row !== undefined;
}

/**
 * Why a notice should not go out, or null when it may.
 *
 * Two guards, both about the person on the receiving end rather than about us:
 * nobody hears from the same account twice in one day, and no account may turn
 * the app into a way of mailing a list.
 */
export async function noticeRefusal(
  userId: string,
  email: string,
): Promise<'too_many' | 'already_today' | null> {
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const sent = await all<{ email: string }>(
    'SELECT email FROM prayer_notices WHERE user_id = ? AND created_at >= ?',
    [userId, since],
  );
  if (sent.length >= NOTICES_PER_DAY) return 'too_many';

  const address = email.trim().toLowerCase();
  return sent.some((row) => row.email === address) ? 'already_today' : null;
}

/**
 * Who prayed for this address, if anybody has.
 *
 * An address that was given while somebody prayed is an invitation in itself:
 * the person typed it deliberately, and what they got back was a message
 * telling them so. Signing up with that same address is therefore enough to
 * come in, and it comes in under them.
 *
 * The most recent stands, not the first: it is the message sitting in their
 * inbox that brought them here. Whether the mail actually left the building is
 * not the test — somebody naming the address is what makes the invitation, and
 * on a server with no mailer configured that is still true.
 */
export async function sponsorForEmail(email: string): Promise<string | null> {
  const address = email.trim().toLowerCase();
  if (!address) return null;

  const row = await one<{ user_id: string }>(
    `SELECT user_id FROM prayer_notices
       WHERE email = ? ORDER BY created_at DESC`,
    [address],
  );
  return row?.user_id ?? null;
}
