import { describe, expect, it } from 'vitest';
import { dayKeyOf, monthCells, monthKey, weekdayLabels } from '@/lib/rosary/calendar';
import type { DayCount } from '@/lib/rosary/stats';

const none = new Map<string, DayCount>();

describe('the weekday headings', () => {
  it('starts the French week on Monday and the English week on Sunday', () => {
    expect(weekdayLabels('fr')).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D']);
    expect(weekdayLabels('en')[0]).toBe('S');
  });

  it('gives seven distinct days in order, not the same one twice', () => {
    // The epoch anchor is easy to get wrong by a day, which shifts every
    // heading and still looks like a plausible week.
    for (const lang of ['fr', 'en'] as const) {
      const labels = weekdayLabels(lang);
      expect(labels).toHaveLength(7);
      const full = new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' });
      const days = Array.from({ length: 7 }, (_, i) =>
        full.format(new Date(Date.UTC(2026, 7, 3 + i))),
      );
      expect(new Set(days).size).toBe(7);
    }
  });
});

describe('the month grid', () => {
  const grid = (year: number, month: number, lang: 'fr' | 'en' = 'fr') =>
    monthCells({ year, month, lang, byDate: none, todayKey: '2026-08-20' });

  it('pads to the right weekday: 1 August 2026 is a Saturday', () => {
    const cells = grid(2026, 7);
    const blanks = cells.filter((c) => c.day === 0).length;
    // Monday-first, so Saturday is the sixth column: five blanks before it.
    expect(blanks).toBe(5);
    expect(cells[5].day).toBe(1);
  });

  it('pads differently when the week starts on Sunday', () => {
    expect(grid(2026, 7, 'en').filter((c) => c.day === 0).length).toBe(6);
  });

  it('counts the days of the month, leap years included', () => {
    const days = (y: number, m: number) => grid(y, m).filter((c) => c.day > 0).length;
    expect(days(2026, 7)).toBe(31);
    expect(days(2026, 1)).toBe(28);
    expect(days(2024, 1)).toBe(29);
    expect(days(2026, 3)).toBe(30);
  });

  it('marks today, and dims what has not happened yet', () => {
    const cells = grid(2026, 7).filter((c) => c.day > 0);
    expect(cells.filter((c) => c.today)).toHaveLength(1);
    expect(cells.find((c) => c.today)!.day).toBe(20);
    expect(cells.find((c) => c.day === 19)!.ahead).toBe(false);
    expect(cells.find((c) => c.day === 21)!.ahead).toBe(true);
  });

  it('carries the decades prayed onto the right square', () => {
    const byDate = new Map<string, DayCount>([
      ['2026-08-09', { date: '2026-08-09', count: 2, decades: 10 }],
    ]);
    const cells = monthCells({
      year: 2026, month: 7, lang: 'fr', byDate, todayKey: '2026-08-20',
    });
    expect(cells.find((c) => c.day === 9)!.decades).toBe(10);
    expect(cells.find((c) => c.day === 9)!.rosaries).toBe(2);
    expect(cells.find((c) => c.day === 10)!.decades).toBe(0);
  });

  it('builds keys that match the ones the statistics use', () => {
    expect(dayKeyOf(2026, 7, 9)).toBe('2026-08-09');
    expect(monthKey(2026, 0)).toBe('2026-01');
  });
});
