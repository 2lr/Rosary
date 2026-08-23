import { describe, expect, it } from 'vitest';
import {
  EARLIEST_HOUR,
  LATEST_HOUR,
  LINEAGE_HOUR,
  isValidHour,
  localDay,
  localHour,
} from '@/lib/push/clock';
import { dailyReminder, lineageReport } from '@/lib/push/messages';

describe('somebody else’s clock', () => {
  it('reads the hour where the person is, not where the server is', () => {
    // Eight in the evening UTC is ten at night in Paris and three in New York.
    const at = '2026-08-22T20:00:00Z';
    expect(localHour(at, 'Europe/Paris')).toBe(22);
    expect(localHour(at, 'America/New_York')).toBe(16);
    expect(localHour(at, 'UTC')).toBe(20);
  });

  it('reads the day where the person is, which is not always the same day', () => {
    // Late evening UTC is already tomorrow in Tokyo and still today in Paris.
    const at = '2026-08-22T23:30:00Z';
    expect(localDay(at, 'Europe/Paris')).toBe('2026-08-23');
    expect(localDay(at, 'Asia/Tokyo')).toBe('2026-08-23');
    expect(localDay(at, 'America/New_York')).toBe('2026-08-22');
  });

  it('follows daylight time rather than a fixed offset', () => {
    // Paris is two hours ahead of UTC in August and one in January. A reminder
    // set for nine has to arrive at nine in both.
    expect(localHour('2026-08-22T19:00:00Z', 'Europe/Paris')).toBe(21);
    expect(localHour('2026-01-22T20:00:00Z', 'Europe/Paris')).toBe(21);
  });

  it('gives midnight as nought rather than twenty-four', () => {
    expect(localHour('2026-08-22T22:00:00Z', 'Europe/Paris')).toBe(0);
    expect(localDay('2026-08-22T22:00:00Z', 'Europe/Paris')).toBe('2026-08-23');
  });

  it('falls back rather than throwing on a zone it does not know', () => {
    // One bad row must not stop everybody else's reminder.
    expect(localHour('2026-08-22T20:00:00Z', 'Nowhere/Atlantis')).toBe(20);
    expect(localDay('2026-08-22T20:00:00Z', 'Nowhere/Atlantis')).toBe('2026-08-22');
    expect(localDay('not-a-date', 'Europe/Paris')).toBe('not-a-date');
  });

  it('takes an hour of the day, and nothing in the small hours', () => {
    expect(isValidHour(EARLIEST_HOUR)).toBe(true);
    expect(isValidHour(LATEST_HOUR)).toBe(true);
    expect(isValidHour(LINEAGE_HOUR)).toBe(true);
    expect(isValidHour(EARLIEST_HOUR - 1)).toBe(false);
    expect(isValidHour(LATEST_HOUR + 1)).toBe(false);
    expect(isValidHour(8.5)).toBe(false);
    expect(isValidHour('8')).toBe(false);
    expect(isValidHour(null)).toBe(false);
  });
});

describe('what a reminder says', () => {
  it('asks the question in both languages, and lands where it can be answered', () => {
    for (const lang of ['fr', 'en'] as const) {
      const message = dailyReminder(lang);
      expect(message.title.length).toBeGreaterThan(3);
      expect(message.body.length).toBeGreaterThan(10);
      expect(message.url).toBe('/home');
      expect(message.tag).toBe('daily');
    }
    expect(dailyReminder('fr').body).not.toBe(dailyReminder('en').body);
  });

  it('counts one rosary as one, not as “1 rosaires”', () => {
    expect(lineageReport('fr', { rosaries: 1, decades: 5 }).body).toContain('Un rosaire');
    expect(lineageReport('fr', { rosaries: 1, decades: 5 }).body).not.toContain('1 rosaires');
    expect(lineageReport('en', { rosaries: 1, decades: 5 }).body).toContain('One rosary');
    expect(lineageReport('en', { rosaries: 3, decades: 15 }).body).toContain('3 rosaries');
  });

  it('says the decades as well, and lands on the journey', () => {
    const message = lineageReport('fr', { rosaries: 4, decades: 20 });
    expect(message.body).toContain('20');
    expect(message.url).toBe('/journey');
    expect(message.tag).toBe('lineage');
  });

  it('keeps the two apart, so one never replaces the other on a lock screen', () => {
    expect(dailyReminder('fr').tag).not.toBe(lineageReport('fr', { rosaries: 1, decades: 5 }).tag);
  });
});
