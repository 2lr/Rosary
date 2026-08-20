import type { Lang } from '@/lib/i18n/config';
import type { DayCount } from './stats';

/**
 * The month grid behind the calendar.
 *
 * Everything is computed in UTC, because that is how a day is recorded: the
 * statistics key each rosary by the first ten characters of its ISO timestamp.
 * Building the grid in local time would slide the whole month by one square for
 * anyone west of Greenwich.
 */

const DAY = 86_400_000;

/**
 * The Thursday the epoch begins on, offset to the first Sunday. `Date(0)` is
 * Thursday 1 January 1970, so Sunday the 4th is three days along — not four,
 * which is the sort of arithmetic that silently shifts every weekday heading
 * by one and still looks plausible.
 */
const FIRST_SUNDAY = 3 * DAY;

/** Monday in France, Sunday in the English-speaking world. */
export const WEEK_START: Record<Lang, number> = { fr: 1, en: 0 };

/** One square. Blanks pad the row before the first of the month. */
export type Cell = {
  key: string;
  /** Zero for the padding squares. */
  day: number;
  decades: number;
  rosaries: number;
  today: boolean;
  ahead: boolean;
};

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function dayKeyOf(year: number, month: number, day: number): string {
  return `${monthKey(year, month)}-${String(day).padStart(2, '0')}`;
}

/** The seven headings, starting on whichever day the language starts its week. */
export function weekdayLabels(lang: Lang): string[] {
  const format = new Intl.DateTimeFormat(lang, { weekday: 'narrow', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) =>
    format.format(new Date(FIRST_SUNDAY + ((WEEK_START[lang] + i) % 7) * DAY)),
  );
}

export function monthCells({
  year,
  month,
  lang,
  byDate,
  todayKey,
}: {
  year: number;
  month: number;
  lang: Lang;
  byDate: Map<string, DayCount>;
  todayKey: string;
}): Cell[] {
  const first = new Date(Date.UTC(year, month, 1));
  // Day zero of the next month is the last day of this one.
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const blanks = (first.getUTCDay() - WEEK_START[lang] + 7) % 7;

  return [
    ...Array.from(
      { length: blanks },
      (_, i): Cell => ({
        key: `blank-${i}`,
        day: 0,
        decades: 0,
        rosaries: 0,
        today: false,
        ahead: false,
      }),
    ),
    ...Array.from({ length: days }, (_, i): Cell => {
      const key = dayKeyOf(year, month, i + 1);
      const entry = byDate.get(key);
      return {
        key,
        day: i + 1,
        decades: entry?.decades ?? 0,
        rosaries: entry?.count ?? 0,
        today: key === todayKey,
        ahead: key > todayKey,
      };
    }),
  ];
}
