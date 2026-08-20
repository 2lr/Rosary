import { describe, expect, it } from 'vitest';
import {
  MEMORY_RING_CAPACITY,
  TRAITS,
  TRAIT_BY_ID,
  activeTraits,
  decadesFor,
  describeChanges,
  growthOf,
  nextChange,
  notchOf,
  saturate,
  type GrowthInput,
} from '@/lib/rosary/traits';

const at = (decades: number, extra: Partial<GrowthInput> = {}) =>
  growthOf({ decades, rosaries: Math.floor(decades / 5), streak: 0, sets: 1, ...extra });

describe('the curve', () => {
  it('starts at `from` and approaches `to` without ever arriving', () => {
    const trait = TRAIT_BY_ID.stone;
    expect(saturate(0, trait)).toBe(trait.from);
    expect(saturate(trait.k, trait)).toBeCloseTo((trait.from + trait.to) / 2, 6);
    expect(saturate(1e9, trait)).toBeLessThan(trait.to);
    expect(saturate(1e9, trait)).toBeGreaterThan(trait.to - 0.001);
  });

  it('rises fastest at the beginning', () => {
    const trait = TRAIT_BY_ID.chroma;
    const early = saturate(20, trait) - saturate(10, trait);
    const late = saturate(1020, trait) - saturate(1010, trait);
    expect(early).toBeGreaterThan(late * 10);
  });

  it('never goes backwards, for any trait', () => {
    for (const trait of TRAITS) {
      let previous = -Infinity;
      for (const d of [0, 1, 5, 20, 100, 400, 1600, 5000, 20000]) {
        const value = saturate(d, trait);
        expect(value).toBeGreaterThanOrEqual(previous);
        previous = value;
      }
    }
  });

  it('inverts exactly', () => {
    for (const trait of TRAITS) {
      if (trait.kind === 'milestone') continue;
      for (const d of [7, 63, 480, 2400]) {
        expect(decadesFor(saturate(d, trait), trait)).toBeCloseTo(d, 4);
      }
    }
  });
});

describe('milestones', () => {
  it('appear at their threshold and stay', () => {
    for (const trait of TRAITS.filter((t) => t.kind === 'milestone')) {
      const threshold = trait.at!;
      expect(notchOf(threshold - 1, trait)).toBe(0);
      expect(notchOf(threshold, trait)).toBe(1);
      expect(notchOf(threshold * 10, trait)).toBe(1);
    }
  });
});

describe('a rosary that keeps growing', () => {
  it('shows nothing at all on the first day', () => {
    const start = at(0);
    expect(activeTraits(start)).toHaveLength(0);
    expect(start.memory.rings).toBe(0);
  });

  it('changes something almost every chaplet for the first months', () => {
    let moved = 0;
    for (let d = 0; d < 200; d += 5) {
      if (describeChanges(at(d), at(d + 5)).length > 0) moved++;
    }
    // Forty chaplets in the first two hundred decades.
    expect(moved).toBeGreaterThan(24);
  });

  it('still has something left to give after a thousand rosaries', () => {
    const veteran = at(5000, { rosaries: 1000 });
    const next = nextChange(veteran);
    expect(next).not.toBeNull();
    expect(next!.remaining).toBeGreaterThan(0);
    expect(Number.isFinite(next!.remaining)).toBe(true);

    // And the picture is still visibly different a hundred rosaries later.
    expect(describeChanges(veteran, at(5500, { rosaries: 1100 })).length).toBeGreaterThan(0);
  });

  it('is monotonic in every notch', () => {
    const points = [0, 5, 25, 60, 150, 400, 1000, 2500, 6000, 15000];
    for (let i = 1; i < points.length; i++) {
      const before = at(points[i - 1]);
      const after = at(points[i]);
      for (const trait of TRAITS) {
        expect(after.notch[trait.id]).toBeGreaterThanOrEqual(before.notch[trait.id]);
      }
    }
  });

  it('always knows how far the next change is', () => {
    for (const d of [0, 3, 40, 700, 4000]) {
      const growth = at(d);
      const next = nextChange(growth);
      expect(next).not.toBeNull();
      // Praying exactly that many decades must actually move it.
      const later = at(d + next!.remaining);
      expect(later.notch[next!.trait.id]).toBeGreaterThan(growth.notch[next!.trait.id]);
    }
  });
});

describe('what changed', () => {
  it('reports the biggest news first', () => {
    // Crossing 150 decades brings the dove, along with smaller advances.
    const changes = describeChanges(at(140), at(160));
    expect(changes[0].trait.id).toBe('dove');
  });

  it('reports nothing when nothing moved', () => {
    expect(describeChanges(at(1000), at(1000))).toEqual([]);
  });

  it('counts how many steps a trait moved', () => {
    const changes = describeChanges(at(0), at(120));
    const roses = changes.find((c) => c.trait.id === 'roses');
    expect(roses).toBeDefined();
    expect(roses!.steps).toBe(roses!.to - roses!.from);
    expect(roses!.from).toBe(0);
  });
});

describe('the band of memory', () => {
  it('cuts one stroke per completed rosary', () => {
    expect(at(0, { rosaries: 0 }).memory).toMatchObject({ ticks: 0, rings: 0 });
    expect(at(5, { rosaries: 1 }).memory).toMatchObject({ ticks: 1, rings: 1, lastRingTicks: 1 });
    expect(at(500, { rosaries: 100 }).memory.lastRingTicks).toBe(100);
  });

  it('wraps into a new ring once one is full', () => {
    const full = at(0, { rosaries: MEMORY_RING_CAPACITY });
    expect(full.memory.rings).toBe(1);
    expect(full.memory.lastRingTicks).toBe(MEMORY_RING_CAPACITY);

    const over = at(0, { rosaries: MEMORY_RING_CAPACITY + 3 });
    expect(over.memory.rings).toBe(2);
    expect(over.memory.lastRingTicks).toBe(3);
  });

  it('stops adding rings rather than growing without bound', () => {
    const many = at(0, { rosaries: 100_000 });
    expect(many.memory.rings).toBeLessThanOrEqual(6);
    expect(many.memory.lastRingTicks).toBe(MEMORY_RING_CAPACITY);
  });
});
