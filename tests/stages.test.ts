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
  stageWindow,
  thresholdAt,
} from '@/lib/rosary/stages';

describe('the ladder', () => {
  it('keeps the stages people are already standing on', () => {
    // Nobody should wake up demoted because the ladder grew.
    expect(STAGES.slice(0, 8).map((s) => [s.key, s.threshold])).toEqual([
      ['seed', 0],
      ['bud', 5],
      ['rose', 25],
      ['bloom', 60],
      ['garden', 120],
      ['dawn', 250],
      ['glass', 500],
      ['crown', 1000],
    ]);
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
