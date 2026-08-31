import type { Lang } from '@/lib/i18n/config';

/**
 * Choosing which words never went out and deserve another try.
 *
 * A mail that was never sent because the server had no mailer configured is a
 * promise the app made and did not keep: somebody was told their prayer would
 * be passed on, and nothing left the building. When the mailer is finally set
 * up, those are worth catching up — the prayer happened, only the telling
 * failed.
 *
 * Two statuses are caught up and no others. `unconfigured` and `failed` are
 * accidents of the server. `already_today` and `too_many` are not: the first
 * means that person did hear from you that day, the second is the daily limit
 * doing its job. Re-sending either would use a repair as a way around a rule
 * that exists for the person on the receiving end.
 *
 * Everything here is decided per address rather than per row, because the
 * person is the address. Somebody prayed for three times while the mailer was
 * down has three rows and must still receive one mail.
 *
 * Pure, so what gets picked can be read in a test rather than in an inbox.
 */

export type PendingNotice = {
  id: string;
  email: string;
  lang: Lang;
  status: string;
  createdAt: string;
  retriedAt: string | null;
};

/** The statuses where nothing arrived through no fault of the recipient. */
const CATCHABLE = new Set(['unconfigured', 'failed']);

/**
 * How long an address is left alone after it may have been written to.
 *
 * "May have" is the point. A send the provider accepted has certainly arrived;
 * one it refused or timed out on might have arrived anyway, since the refusal
 * we saw could have come after it took the message. Only a notice that was
 * never attempted at all — no mailer configured, so no request made — is
 * certain to have reached nobody, and that one is not held back: it is what
 * lets somebody fix their settings and press the button straight away.
 */
export const RETRY_QUIET_MS = 6 * 60 * 60 * 1000;

/** How many may go out in one catch-up, however many are waiting. */
export const RETRY_LIMIT = 12;

/** Whether this row means the address may have heard from us lately. */
function heardRecently(row: PendingNotice, quietSince: number): boolean {
  if (row.status === 'unconfigured') return false;
  const when = Date.parse(row.retriedAt ?? row.createdAt);
  return Number.isFinite(when) && when > quietSince;
}

/**
 * The notices to send now, newest first.
 *
 * Takes the whole history, not only the failures: a notice that did go out an
 * hour ago is the very reason not to write to that address again, and it can
 * only say so if it is in the room.
 */
export function noticesToRetry(
  rows: PendingNotice[],
  now: Date,
  limit = RETRY_LIMIT,
): PendingNotice[] {
  const quietSince = now.getTime() - RETRY_QUIET_MS;
  const hushed = new Set<string>();
  const best = new Map<string, PendingNotice>();

  for (const row of rows) {
    const address = row.email.trim().toLowerCase();
    if (heardRecently(row, quietSince)) hushed.add(address);
    if (!CATCHABLE.has(row.status)) continue;

    // One mail per address: praying for the same person three times over a
    // fortnight while the mailer was down should reach them once, today. The
    // most recent stands — its language is the truest of the three.
    const held = best.get(address);
    if (!held || row.createdAt > held.createdAt) best.set(address, row);
  }

  return [...best.entries()]
    .filter(([address]) => !hushed.has(address))
    .map(([, row]) => row)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(0, Math.max(0, limit));
}
