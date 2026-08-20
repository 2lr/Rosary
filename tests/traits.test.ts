import { describe, expect, it } from 'vitest';
import {
  FAMILY_LABEL,
  FAMILY_ORDER,
  HEART_FULL_AT,
  TRAITS,
  TRAIT_BY_ID,
  activeTraits,
  decadesFor,
  describeChanges,
  growthOf,
  nextChange,
  notchOf,
  saturate,
  GOLDEN_ANGLE,
  heartGrain,
  heartGrainSize,
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
    expect(start.heart.grains).toBe(0);
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
    // Crossing the dove's threshold brings it along with smaller advances; the
    // sign is what gets said first.
    const threshold = TRAIT_BY_ID.dove.at!;
    const changes = describeChanges(at(threshold - 12), at(threshold + 12));
    expect(changes.length).toBeGreaterThan(1);
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

describe('the heart of the rose', () => {
  it('lays exactly one grain for every decade, with no exceptions', () => {
    for (const d of [0, 1, 5, 137, 2000, 9999]) {
      expect(at(d).heart.grains).toBe(d);
    }
  });

  it('changes on every single decade, at every point of the climb', () => {
    for (const d of [0, 4, 199, 1000, 5000, 50000]) {
      expect(at(d + 1).heart.grains).toBe(at(d).heart.grains + 1);
    }
  });

  it('never moves a grain once it is laid', () => {
    // Below the point where the field is full, position depends only on index.
    for (const grains of [10, 200, HEART_FULL_AT - 1, HEART_FULL_AT]) {
      for (const i of [0, 3, 9]) {
        expect(heartGrain(i, grains).radius).toBeCloseTo(
          heartGrain(i, HEART_FULL_AT).radius,
          9,
        );
      }
    }
  });

  it('lays each grain at the golden angle from the last', () => {
    const step = heartGrain(1, 100).angle - heartGrain(0, 100).angle;
    expect(step).toBeCloseTo(GOLDEN_ANGLE, 9);
    // No two grains ever share an angle, because the golden angle is irrational.
    const seen = new Set(
      Array.from({ length: 400 }, (_, i) => (heartGrain(i, 400).angle % 360).toFixed(4)),
    );
    expect(seen.size).toBe(400);
  });

  it('stays inside its disc however many grains there are', () => {
    for (const grains of [1, 50, HEART_FULL_AT, 40000]) {
      for (const i of [0, Math.floor(grains / 2), grains - 1]) {
        const { radius } = heartGrain(i, grains);
        expect(radius).toBeGreaterThanOrEqual(0);
        expect(radius).toBeLessThanOrEqual(1.000001);
      }
    }
  });

  it('grows outwards first, then packs tighter, so it never clogs', () => {
    // While it is filling, the outermost grain moves further out each time and
    // a grain keeps the size it was laid at.
    expect(heartGrain(499, 500).radius).toBeGreaterThan(heartGrain(99, 100).radius);
    expect(heartGrainSize(20)).toBeCloseTo(heartGrainSize(HEART_FULL_AT), 9);
    // Once full, grains only get finer, and never vanish altogether.
    expect(heartGrainSize(40000)).toBeLessThan(heartGrainSize(HEART_FULL_AT));
    expect(heartGrainSize(1e9)).toBeGreaterThan(0);
    expect(heartGrainSize(0)).toBe(0);
  });
});

describe('the signs', () => {
  it('are drawn from all four figures', () => {
    const families = new Set(TRAITS.map((t) => t.family));
    expect(families).toContain('father');
    expect(families).toContain('son');
    expect(families).toContain('spirit');
    expect(families).toContain('mary');
    expect(FAMILY_ORDER.every((f) => FAMILY_LABEL[f])).toBe(true);
  });

  it('each carry a name, a change and a meaning', () => {
    for (const trait of TRAITS) {
      expect(trait.label).toBeTruthy();
      expect(trait.change).toBeTruthy();
      expect(trait.meaning).toBeTruthy();
      expect(FAMILY_ORDER).toContain(trait.family);
    }
  });

  it('arrive one at a time, never two at the same threshold', () => {
    const milestones = TRAITS.filter((t) => t.kind === 'milestone').map((t) => t.at!);
    expect(new Set(milestones).size).toBe(milestones.length);
    expect([...milestones].sort((a, b) => a - b)).toEqual(milestones);
  });

  it('give the first sign early and keep some for much later', () => {
    const milestones = TRAITS.filter((t) => t.kind === 'milestone').map((t) => t.at!);
    expect(Math.min(...milestones)).toBeLessThanOrEqual(50);
    expect(Math.max(...milestones)).toBeGreaterThan(3000);
  });

  it('spread the four figures across the whole climb, not all at the end', () => {
    for (const family of ['father', 'son', 'spirit', 'mary'] as const) {
      const first = Math.min(
        ...TRAITS.filter((t) => t.family === family).map((t) =>
          t.kind === 'milestone' ? t.at! : 0,
        ),
      );
      // Every figure is present within the first thousand decades.
      expect(first).toBeLessThan(1000);
    }
  });
});
