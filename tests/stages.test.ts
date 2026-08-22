import { describe, expect, it } from 'vitest';
import {
  DEGREES_PER_STAGE,
  NAMED_STAGES,
  STAGES,
  degreeFor,
  roman,
  stageAt,
  stageFor,
  stageTone,
  formatThreshold,
  stageWindow,
  thresholdAt,
} from '@/lib/rosary/stages';

describe('the ladder', () => {
  it('never moves anyone down a rung when it is re-cut', () => {
    // The thresholds of the ladder as it was shipped. They may come down —
    // that is a promotion, and the whole point of re-cutting them — but the
    // stage a given number of decades falls in must never go backwards, or
    // somebody wakes up demoted from a stage they had reached.
    const SHIPPED = [
      0, 5, 25, 60, 120, 250, 500, 1000, 1750, 2750, 4000, 6000, 9000, 14_000, 22_000, 35_000,
    ];
    for (let index = 0; index < SHIPPED.length; index++) {
      const decades = SHIPPED[index];
      expect(stageFor(decades).stage.index, `${decades} decades`).toBeGreaterThanOrEqual(index);
    }
  });

  it('climbs at the pace of somebody actually praying', () => {
    // A chaplet a day is five decades. The rungs were once so far apart that
    // the eighth stage took two hundred days and the last named one nineteen
    // years; the ladder has to move faster than that to be a ladder at all.
    const dayReaching = (index: number) => Math.ceil(thresholdAt(index) / 5);
    expect(dayReaching(1)).toBeLessThanOrEqual(1);
    expect(dayReaching(5)).toBeLessThanOrEqual(30);
    expect(dayReaching(8)).toBeLessThanOrEqual(100);
    expect(dayReaching(NAMED_STAGES - 1)).toBeLessThanOrEqual(1100);
  });

  it('joins the named ladder to the endless one without a jolt', () => {
    // The step from the last named stage to the first built one should not be
    // wider than the steps either side of it, or the ladder visibly changes
    // gear at the sixteenth rung.
    const step = (index: number) => thresholdAt(index + 1) / thresholdAt(index);
    const before = step(NAMED_STAGES - 2);
    const across = step(NAMED_STAGES - 1);
    expect(across).toBeLessThan(before * 1.25);
    expect(across).toBeGreaterThan(1.2);
  });

  it('names sixteen and then keeps going', () => {
    expect(NAMED_STAGES).toBe(16);
    expect(STAGES).toHaveLength(16);
    expect(stageAt(16).name.fr).toBe('Lumière');
    expect(stageAt(400).name.fr.length).toBeGreaterThan(0);
  });

  it('never runs out, however many decades are prayed', () => {
    for (const decades of [0, 1, 999, 35_000, 1_000_000, 5_000_000]) {
      const { stage, next } = stageFor(decades);
      expect(next.threshold).toBeGreaterThan(stage.threshold);
      expect(decades).toBeGreaterThanOrEqual(stage.threshold);
      expect(decades).toBeLessThan(next.threshold);
    }
  });

  it('climbs, and never twice to the same place', () => {
    let previous = -1;
    const keys = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const stage = stageAt(i);
      expect(stage.threshold).toBeGreaterThan(previous);
      expect(keys.has(stage.key), stage.key).toBe(false);
      keys.add(stage.key);
      previous = stage.threshold;
    }
  });

  it('reaches a stage exactly on its threshold, not one decade later', () => {
    for (const stage of STAGES) {
      expect(stageFor(stage.threshold).stage.key).toBe(stage.key);
      if (stage.threshold > 0) {
        expect(stageFor(stage.threshold - 1).stage.index).toBe(stage.index - 1);
      }
    }
  });

  it('shrugs off nonsense rather than falling off the bottom', () => {
    expect(stageFor(-50).stage.key).toBe('seed');
    expect(stageAt(-3).key).toBe('seed');
    expect(thresholdAt(-1)).toBe(0);
  });

  it('stops deepening the colour once the names run out', () => {
    expect(stageTone(0)).toBe(0);
    expect(stageTone(NAMED_STAGES - 1)).toBe(1);
    expect(stageTone(9999)).toBe(1);
  });
});

describe('the degrees inside a stage', () => {
  it('divides every stage into the same number', () => {
    for (const decades of [0, 3, 40, 700, 5000, 120_000]) {
      const degree = degreeFor(decades);
      expect(degree.of).toBe(DEGREES_PER_STAGE);
      expect(degree.index).toBeGreaterThanOrEqual(1);
      expect(degree.index).toBeLessThanOrEqual(DEGREES_PER_STAGE);
    }
  });

  it('starts each stage at its first degree', () => {
    for (const stage of STAGES) {
      expect(degreeFor(stage.threshold).index, stage.key).toBe(1);
    }
  });

  it('walks up one at a time and always moves within the stage', () => {
    // Somewhere in the middle of the ladder, every degree should be visited.
    const seen = new Set<number>();
    for (let d = 250; d < 500; d++) seen.add(degreeFor(d).index);
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('counts down to the next degree honestly', () => {
    for (const decades of [0, 7, 63, 300, 4200]) {
      const degree = degreeFor(decades);
      expect(degree.remaining).toBeGreaterThan(0);
      // Praying exactly that many more decades must move things on.
      const later = degreeFor(decades + degree.remaining);
      expect(later.index === degree.index && later.from === degree.from).toBe(false);
    }
  });

  it('keeps its progress between nothing and everything', () => {
    for (let d = 0; d < 1200; d += 7) {
      const { progress } = degreeFor(d);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });
});

describe('showing where you stand', () => {
  it('gives the same number of rungs wherever you stand', () => {
    // At the bottom there is nothing behind to show, so the window slides
    // forward instead of shrinking.
    const low = stageWindow(0);
    expect(low.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);

    const high = stageWindow(40);
    expect(high.map((s) => s.index)).toEqual([39, 40, 41, 42, 43]);
  });

  it('writes the numerals the degrees are named by', () => {
    expect([1, 2, 3, 4, 5].map(roman)).toEqual(['I', 'II', 'III', 'IV', 'V']);
    expect(roman(9)).toBe('IX');
    expect(roman(2026)).toBe('MMXXVI');
    // Past what Rome could write, plain digits are the honest answer.
    expect(roman(4000)).toBe('4000');
    expect(roman(0)).toBe('');
  });
});

describe('writing the numbers on the rungs', () => {
  it('spells out anything a person could actually pray', () => {
    expect(formatThreshold(0, 'en')).toBe('0');
    expect(formatThreshold(1000, 'en')).toBe('1,000');
    expect(formatThreshold(35_000, 'en')).toBe('35,000');
  });

  it('compacts the merely enormous', () => {
    expect(formatThreshold(2_000_000, 'en')).toBe('2M');
    expect(formatThreshold(3_400_000_000, 'en')).toBe('3.4B');
  });

  it('gives up on digits past what has a name, and says the power instead', () => {
    // Intl runs out of unit names around here and starts printing the whole
    // number with a unit stuck on the end: 2 600 000 …000 Bn, thirty digits
    // wide, straight through the side of the row.
    const huge = formatThreshold(2.6e30, 'en');
    expect(huge).toBe('2.6 × 10³⁰');
    expect(huge.length).toBeLessThan(14);

    for (const value of [1e13, 1e18, 5e42, 9.9e120]) {
      expect(formatThreshold(value, 'fr').length).toBeLessThan(16);
    }
  });

  it('never lets a rung run off the side, however deep the ladder goes', () => {
    for (let i = 0; i < 300; i++) {
      expect(formatThreshold(thresholdAt(i), 'fr').length, `stage ${i}`).toBeLessThan(16);
    }
  });
});
