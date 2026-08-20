import { describe, expect, it } from 'vitest';
import { growthOf, nextChange, nextMilestone, TRAITS } from '@/lib/rosary/traits';

const growthFor = (decades: number) =>
  growthOf({ decades, rosaries: Math.floor(decades / 5), streak: 0, sets: 1 });

describe('the next sign', () => {
  it('names a milestone, not one of the traits that drift every decade', () => {
    const sign = nextMilestone(growthFor(0));
    expect(sign).not.toBeNull();
    expect(sign!.trait.kind).toBe('milestone');
  });

  it('is the monogram at the very beginning, forty decades away', () => {
    const sign = nextMilestone(growthFor(0))!;
    expect(sign.trait.id).toBe('monogram');
    expect(sign.remaining).toBe(40);
  });

  it('counts down and then moves on to the next sign', () => {
    expect(nextMilestone(growthFor(39))!.remaining).toBe(1);
    const after = nextMilestone(growthFor(40))!;
    expect(after.trait.id).not.toBe('monogram');
    expect(after.remaining).toBeGreaterThan(0);
  });

  it('always looks further ahead than the nearest ordinary change', () => {
    // The point of the distinction: something shifts almost every decade, so
    // the nearest change is never the thing anyone is actually waiting for.
    for (const decades of [1, 7, 25, 100, 500]) {
      const growth = growthFor(decades);
      const soon = nextChange(growth);
      const sign = nextMilestone(growth);
      if (!soon || !sign) continue;
      expect(sign.remaining).toBeGreaterThanOrEqual(soon.remaining);
    }
  });

  it('runs out once every sign has been given', () => {
    const last = Math.max(...TRAITS.filter((t) => t.kind === 'milestone').map((t) => t.at ?? 0));
    expect(nextMilestone(growthFor(last))).toBeNull();
    expect(nextMilestone(growthFor(last + 1000))).toBeNull();
  });
});
