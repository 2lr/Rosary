import { diffDays } from './stats';

/**
 * A rosary prayed some day other than today.
 *
 * People pray on beads and remember the app days later, and a rosary that was
 * said on Tuesday belongs on Tuesday: it is what makes a streak true and a
 * calendar worth looking at. So the day may be chosen, within reason.
 *
 * Everything downstream — the statistics, the streak, the calendar — reads the
 * day off `completed_at` by taking the first ten characters of the timestamp,
 * which is UTC. A recorded day is therefore stored as midday UTC, which makes
 * that reading exact: the day asked for is the day counted.
 *
 * No single instant is the same date the world over — the zones span twenty-six
 * hours — so midday is the choice that agrees with the stored day for every
 * zone from UTC-12 to UTC+11, which is everywhere but the far Pacific, where a
 * recorded rosary reads as the following morning. The count is right regardless;
 * only the printed date can differ, and only there.
 *
 * How far back is a judgement, not a law. Thirty days is long enough to catch
 * up a fortnight away from the phone and short enough that nobody is writing a
 * history they no longer remember.
 */

export const MAX_BACKDATE_DAYS = 30;

/** A day as YYYY-MM-DD, and a real one — the 31st of February is not a day. */
export function isDayKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * The day it is where this clock is, rather than at Greenwich.
 *
 * For the browser: somebody in Auckland tapping "today" at nine in the morning
 * means their today, which is still yesterday in UTC.
 */
export function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Midday UTC on that day: the instant a recorded rosary is stored at. */
export function instantFor(day: string): string {
  return `${day}T12:00:00.000Z`;
}

/**
 * Whether a day may still be written to, judged against the server's own today.
 *
 * A day ahead is allowed, and deliberately: the phone says what day it is where
 * the person is, and east of Greenwich that is tomorrow for part of every day.
 * Refusing it would tell somebody in Auckland that this morning is in the
 * future.
 */
export function withinBackdate(
  day: string,
  todayKey: string,
  span = MAX_BACKDATE_DAYS,
): boolean {
  if (!isDayKey(day) || !isDayKey(todayKey)) return false;
  const distance = diffDays(day, todayKey);
  return distance >= -1 && distance <= span;
}

/** The days that may be chosen, newest first, today included. */
export function daysBack(todayKey: string, span = MAX_BACKDATE_DAYS): string[] {
  if (!isDayKey(todayKey)) return [];
  const midday = Date.parse(instantFor(todayKey));
  return Array.from({ length: span + 1 }, (_, i) =>
    new Date(midday - i * 86_400_000).toISOString().slice(0, 10),
  );
}
