import { describe, expect, it } from 'vitest';
import {
  MAX_BACKDATE_DAYS,
  daysBack,
  instantFor,
  isDayKey,
  localDayKey,
  withinBackdate,
} from '@/lib/rosary/pastDay';
import { dayKey } from '@/lib/rosary/stats';

describe('naming a day', () => {
  it('takes a real day and refuses one that never happened', () => {
    expect(isDayKey('2026-09-09')).toBe(true);
    expect(isDayKey('2024-02-29')).toBe(true); // a leap year has one
    expect(isDayKey('2026-02-29')).toBe(false); // this one does not
    expect(isDayKey('2026-02-31')).toBe(false);
    expect(isDayKey('2026-13-01')).toBe(false);
    expect(isDayKey('2026-9-9')).toBe(false);
    expect(isDayKey('hier')).toBe(false);
    expect(isDayKey(20260909)).toBe(false);
    expect(isDayKey(null)).toBe(false);
  });

  it('reads the day off the clock in the room, not off Greenwich', () => {
    // Local fields, whatever the machine's zone: the date a person would say.
    const date = new Date(2026, 8, 9, 23, 45);
    expect(localDayKey(date)).toBe('2026-09-09');
    expect(localDayKey(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });
});

describe('where a recorded rosary lands', () => {
  it('is read back as the very day it was recorded for', () => {
    // The statistics take the day off the first ten characters of the stored
    // timestamp. That has to come back as the day that was asked for.
    for (const day of ['2026-09-09', '2026-01-01', '2026-12-31', '2024-02-29']) {
      expect(dayKey(instantFor(day))).toBe(day);
    }
  });

  it('reads as the right day everywhere but the far Pacific', () => {
    // No instant is the same date worldwide — the zones span twenty-six hours.
    // Midday is the choice that holds from UTC-12 to UTC+11; past that it reads
    // as the following morning, while the stored day, which is what is counted,
    // stays right.
    const at = new Date(instantFor('2026-09-09'));
    const on = (zone: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(at);

    for (const zone of ['Pacific/Honolulu', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo']) {
      expect(on(zone), zone).toBe('2026-09-09');
    }
    expect(on('Pacific/Auckland')).toBe('2026-09-10');
    expect(dayKey(instantFor('2026-09-09'))).toBe('2026-09-09');
  });
});

describe('how far back one may write', () => {
  const today = '2026-09-11';

  it('takes today and everything inside the window', () => {
    expect(withinBackdate(today, today)).toBe(true);
    expect(withinBackdate('2026-09-10', today)).toBe(true);
    expect(withinBackdate('2026-08-12', today)).toBe(true); // thirty days back
  });

  it('refuses a day older than the window', () => {
    expect(withinBackdate('2026-08-11', today)).toBe(false);
    expect(withinBackdate('2025-09-11', today)).toBe(false);
  });

  it('allows tomorrow, because east of here it is already today', () => {
    // A phone in Auckland says the 12th while the server still says the 11th.
    // Refusing it would tell somebody their own morning is in the future.
    expect(withinBackdate('2026-09-12', today)).toBe(true);
    expect(withinBackdate('2026-09-13', today)).toBe(false);
  });

  it('refuses anything that is not a day at all', () => {
    expect(withinBackdate('2026-02-31', today)).toBe(false);
    expect(withinBackdate('', today)).toBe(false);
    expect(withinBackdate(today, 'not-a-day')).toBe(false);
  });

  it('holds across the turn of a month and of a year', () => {
    expect(withinBackdate('2025-12-31', '2026-01-01')).toBe(true);
    expect(withinBackdate('2026-02-28', '2026-03-01')).toBe(true);
  });
});

describe('the days on offer', () => {
  it('starts at today and runs back over the whole window', () => {
    const days = daysBack('2026-09-11');
    expect(days).toHaveLength(MAX_BACKDATE_DAYS + 1);
    expect(days[0]).toBe('2026-09-11');
    expect(days[1]).toBe('2026-09-10');
    expect(days[days.length - 1]).toBe('2026-08-12');
  });

  it('every one of them may be written to', () => {
    const today = '2026-03-15';
    for (const day of daysBack(today)) {
      expect(withinBackdate(day, today), day).toBe(true);
    }
  });

  it('counts back through a month change without skipping a day', () => {
    const days = daysBack('2026-03-02', 3);
    expect(days).toEqual(['2026-03-02', '2026-03-01', '2026-02-28', '2026-02-27']);
  });

  it('gives nothing rather than nonsense for a day that is not one', () => {
    expect(daysBack('not-a-day')).toEqual([]);
  });
});
