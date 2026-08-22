import { describe, expect, it } from 'vitest';
import {
  NOVENA_DAYS,
  NOVENA_KEYS,
  daysBetween,
  easter,
  novenaByKey,
  novenaProgress,
  novenaState,
  novenasIn,
  runWindow,
  shiftDays,
} from '@/lib/rosary/novenas';

describe('Easter, which everything moveable hangs off', () => {
  it('lands on the days the Church actually keeps', () => {
    // Checked against the published dates, across a century boundary.
    expect(easter(2024)).toBe('2024-03-31');
    expect(easter(2025)).toBe('2025-04-20');
    expect(easter(2026)).toBe('2026-04-05');
    expect(easter(2027)).toBe('2027-03-28');
    expect(easter(2038)).toBe('2038-04-25');
    expect(easter(1961)).toBe('1961-04-02');
    expect(easter(2100)).toBe('2100-03-28');
  });

  it('always falls on a Sunday, between 22 March and 25 April', () => {
    for (let year = 1900; year <= 2200; year++) {
      const day = easter(year);
      expect(new Date(`${day}T00:00:00Z`).getUTCDay(), day).toBe(0);
      expect(day.slice(5) >= '03-22' && day.slice(5) <= '04-25', day).toBe(true);
    }
  });
});

describe('the novenas', () => {
  it('all run nine days and end the day before the feast', () => {
    for (const year of [2025, 2026, 2027]) {
      for (const novena of novenasIn(year)) {
        expect(daysBetween(novena.start, novena.end), novena.key).toBe(NOVENA_DAYS - 1);
        expect(shiftDays(novena.end, 1), novena.key).toBe(novena.feast);
      }
    }
  });

  it('puts the fixed ones on their proper feasts', () => {
    const of = (key: string) => novenaByKey(key, 2026)!;
    expect(of('christmas').feast).toBe('2026-12-25');
    expect(of('christmas').start).toBe('2026-12-16');
    expect(of('immaculate').feast).toBe('2026-12-08');
    expect(of('assumption').start).toBe('2026-08-06');
    expect(of('rosary').feast).toBe('2026-10-07');
    expect(of('lourdes').feast).toBe('2026-02-11');
  });

  it('moves the moveable ones with Easter', () => {
    // Easter 2026 is 5 April.
    const of = (key: string) => novenaByKey(key, 2026)!;
    // Divine Mercy Sunday is the octave of Easter; its novena opens on Good Friday.
    expect(of('mercy').feast).toBe('2026-04-12');
    expect(of('mercy').start).toBe('2026-04-03');
    // Pentecost is fifty days on; the novena fills Ascension to the vigil.
    expect(of('spirit').feast).toBe('2026-05-24');
    expect(of('spirit').start).toBe('2026-05-15');
    // The Sacred Heart, the Friday after the second Sunday after Pentecost.
    expect(of('sacred-heart').feast).toBe('2026-06-12');
    expect(new Date('2026-06-12T00:00:00Z').getUTCDay()).toBe(5);
  });

  it('names fourteen, each one only once', () => {
    expect(NOVENA_KEYS).toHaveLength(14);
    expect(new Set(NOVENA_KEYS).size).toBe(14);
    expect(novenasIn(2026)).toHaveLength(14);
  });

  it('keeps the octave of the Assumption, which is a feast of its own', () => {
    // The twenty-second of August: Mary crowned, eight days after her
    // Assumption. Its novena runs straight out of the Assumption's.
    const queenship = novenaByKey('queenship', 2026)!;
    expect(queenship.feast).toBe('2026-08-22');
    expect(queenship.start).toBe('2026-08-13');
    expect(queenship.end).toBe('2026-08-21');
  });

  it('lists them in the order they fall', () => {
    const starts = novenasIn(2026).map((n) => n.start);
    expect([...starts].sort()).toEqual(starts);
  });

  it('does overlap, because the calendar does', () => {
    // Saint Joseph is the nineteenth of March and the Annunciation the
    // twenty-fifth: six days apart, so three of their nine are shared. This is
    // the calendar, not a mistake in it.
    const joseph = novenaByKey('joseph', 2026)!;
    const annunciation = novenaByKey('annunciation', 2026)!;
    expect(annunciation.start < joseph.end).toBe(true);
  });

  it('shows the one about to conclude when two run at once', () => {
    // On the seventeenth both are running; Saint Joseph is the nearer feast.
    const state = novenaState('2026-03-17');
    expect(state.active?.key).toBe('joseph');

    // And the other takes over of its own accord the day after Joseph ends.
    expect(novenaState('2026-03-19').active?.key).toBe('annunciation');
  });
});

describe('where the year stands', () => {
  it('reports the one running, and which day it is', () => {
    const state = novenaState('2026-12-20');
    expect(state.active?.key).toBe('christmas');
    expect(state.day).toBe(5);
  });

  it('counts the first and the ninth day correctly', () => {
    expect(novenaState('2026-12-16').day).toBe(1);
    expect(novenaState('2026-12-24').day).toBe(9);
    expect(novenaState('2026-12-25').active).toBeNull();
  });

  it('always points at a next one, even from the far end of December', () => {
    const state = novenaState('2026-12-31');
    expect(state.active).toBeNull();
    expect(state.next).not.toBeNull();
    expect(state.next!.start > '2026-12-31').toBe(true);
    expect(state.until).toBeGreaterThan(0);
  });

  it('finds a next one on every day of a year', () => {
    let day = '2026-01-01';
    while (day <= '2026-12-31') {
      const state = novenaState(day);
      expect(state.active || state.next, day).toBeTruthy();
      day = shiftDays(day, 1);
    }
  });
});

describe('keeping a novena', () => {
  const novena = novenaByKey('christmas', 2026)!;

  it('counts the days actually prayed on', () => {
    const prayed = ['2026-12-16', '2026-12-17', '2026-12-19'];
    const { kept, days } = novenaProgress(novena.start, prayed, '2026-12-20');
    expect(kept).toBe(3);
    expect(days).toHaveLength(9);
    expect(days[0].prayed).toBe(true);
    expect(days[2].prayed).toBe(false);
  });

  it('marks the days that have not happened yet as ahead, not as missed', () => {
    const { days } = novenaProgress(novena.start, [], '2026-12-18');
    expect(days.filter((d) => d.ahead).map((d) => d.key)).toEqual([
      '2026-12-19', '2026-12-20', '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24',
    ]);
  });

  it('ignores prayer outside the nine days', () => {
    const { kept } = novenaProgress(novena.start, ['2026-12-01', '2026-12-25'], '2026-12-25');
    expect(kept).toBe(0);
  });
});

describe('a novena begun on any day', () => {
  it('runs nine days from the day it was started', () => {
    const run = runWindow('christmas', '2026-07-02', '2026-07-02');
    expect(run.startedOn).toBe('2026-07-02');
    expect(run.end).toBe('2026-07-10');
    expect(run.day).toBe(1);
    expect(run.over).toBe(false);
  });

  it('counts the day, and knows when the nine are behind', () => {
    expect(runWindow('rosary', '2026-07-02', '2026-07-06').day).toBe(5);
    expect(runWindow('rosary', '2026-07-02', '2026-07-10').day).toBe(9);
    expect(runWindow('rosary', '2026-07-02', '2026-07-10').over).toBe(false);
    expect(runWindow('rosary', '2026-07-02', '2026-07-11').over).toBe(true);
  });

  it('handles one begun for a day still to come', () => {
    const run = runWindow('fatima', '2026-09-01', '2026-08-25');
    expect(run.over).toBe(false);
    expect(run.day).toBe(0);
  });

  it('is kept by the same rosaries as any other', () => {
    const prayed = ['2026-07-02', '2026-07-03', '2026-07-04'];
    expect(novenaProgress('2026-07-02', prayed, '2026-07-05').kept).toBe(3);
  });
});

describe('days marked by hand', () => {
  it('counts a day marked even when no rosary was recorded on it', () => {
    // The case this exists for: six days prayed on paper before the app was
    // ever opened on them.
    const { kept, days } = novenaProgress(
      '2026-08-14',
      [],
      '2026-08-22',
      ['2026-08-14', '2026-08-15', '2026-08-16'],
    );
    expect(kept).toBe(3);
    expect(days.filter((d) => d.prayed).map((d) => d.key)).toEqual([
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
    // None of them came from a rosary, so all three can be taken back.
    expect(days.filter((d) => d.fromRosary)).toHaveLength(0);
  });

  it('does not count a day twice when it was both prayed and marked', () => {
    const { kept, days } = novenaProgress(
      '2026-08-14',
      ['2026-08-14'],
      '2026-08-22',
      ['2026-08-14', '2026-08-15'],
    );
    expect(kept).toBe(2);
    expect(days.find((d) => d.key === '2026-08-14')!.fromRosary).toBe(true);
    expect(days.find((d) => d.key === '2026-08-15')!.fromRosary).toBe(false);
  });

  it('ignores a mark that falls outside the nine days', () => {
    const { kept } = novenaProgress('2026-08-14', [], '2026-08-30', ['2026-09-01']);
    expect(kept).toBe(0);
  });
});
