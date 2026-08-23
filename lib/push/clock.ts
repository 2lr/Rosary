/**
 * What time it is where somebody actually is.
 *
 * A reminder set for nine in the evening means nine in the evening where the
 * person lives, so every decision the sender makes is taken in their own zone
 * rather than the server's. Both of these go through Intl instead of offset
 * arithmetic, which is what keeps them right across a change of daylight time.
 *
 * An unknown or malformed zone falls back to UTC rather than throwing: a bad
 * string in one row must not stop everybody else's reminder.
 */

function parts(iso: string, timeZone: string): Intl.DateTimeFormatPart[] {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return [];
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
    }).formatToParts(at);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
    }).formatToParts(at);
  }
}

const find = (bits: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
  bits.find((part) => part.type === type)?.value ?? '';

/** The day key, YYYY-MM-DD, as that person's calendar has it. */
export function localDay(iso: string, timeZone: string): string {
  const bits = parts(iso, timeZone);
  if (bits.length === 0) return iso.slice(0, 10);
  return `${find(bits, 'year')}-${find(bits, 'month')}-${find(bits, 'day')}`;
}

/** The hour of their day, 0–23. Midnight comes back as 0, not 24. */
export function localHour(iso: string, timeZone: string): number {
  const bits = parts(iso, timeZone);
  const hour = Number(find(bits, 'hour'));
  if (!Number.isFinite(hour)) return 0;
  return hour % 24;
}

/** The hour a reminder may be set to. Nothing in the small hours. */
export const EARLIEST_HOUR = 5;
export const LATEST_HOUR = 23;

/** The evening word about other people's prayer goes out at the same hour for all. */
export const LINEAGE_HOUR = 21;

export function isValidHour(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= EARLIEST_HOUR &&
    value <= LATEST_HOUR
  );
}
