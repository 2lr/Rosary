import { describe, expect, it } from 'vitest';
import { STAGES, bloomFrom, seedFrom, stageFor } from '@/lib/rosary/growth';
import { EMPTY_STATS, streaks, diffDays } from '@/lib/rosary/stats';
import { MYSTERY_SETS } from '@/lib/rosary/mysteries';
import type { Stats } from '@/lib/rosary/stats';

const withStats = (patch: Partial<Stats>): Stats => ({ ...EMPTY_STATS, ...patch });

describe('stages', () => {
  it('rise only with decades prayed', () => {
    // Read off the ladder rather than written down, so that re-cutting the
    // thresholds — which is a promotion for everybody — does not need this
    // test rewritten to say the same thing about different numbers.
    expect(stageFor(0).stage.key).toBe('seed');
    for (const stage of STAGES.slice(1)) {
      expect(stageFor(stage.threshold - 1).stage.index).toBe(stage.index - 1);
      expect(stageFor(stage.threshold).stage.key).toBe(stage.key);
    }
  });

  it('are ordered by an increasing threshold', () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].threshold).toBeGreaterThan(STAGES[i - 1].threshold);
      expect(STAGES[i].index).toBe(i);
    }
  });

  it('always offer a next one, however far along', () => {
    // The ladder used to stop at a thousand decades and hand back nothing.
    // It no longer ends, so there is always somewhere to be going.
    for (const decades of [5000, 50_000, 5_000_000]) {
      const { stage, next } = stageFor(decades);
      expect(next.threshold).toBeGreaterThan(stage.threshold);

      const bloom = bloomFrom(withStats({ totalDecades: decades }), 'u');
      expect(bloom.decadesToNext).toBeGreaterThan(0);
      expect(bloom.toNext).toBeLessThan(1);
      expect(bloom.degree.index).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('the artwork', () => {
  it('starts bare and gains ornament as the rosary is prayed', () => {
    const day1 = bloomFrom(EMPTY_STATS, 'user-1');
    const later = bloomFrom(withStats({ totalDecades: 300, currentStreak: 12 }), 'user-1');

    expect(day1.growth.notch.roses).toBe(0);
    expect(day1.growth.notch.filigree).toBe(0);
    expect(later.growth.notch.roses).toBeGreaterThan(0);
    expect(later.growth.notch.filigree).toBeGreaterThan(0);
    expect(later.luminosity).toBeGreaterThan(day1.luminosity);
    expect(later.growth.stars).toBe(12);
  });

  it('is stable for a given user and different between users', () => {
    expect(seedFrom('a')).toBe(seedFrom('a'));
    expect(seedFrom('a')).not.toBe(seedFrom('b'));
    expect(bloomFrom(EMPTY_STATS, 'a').hue).not.toBeCloseTo(
      bloomFrom(EMPTY_STATS, 'b').hue,
      3,
    );
  });

  it('takes its colour from the mysteries actually prayed', () => {
    const glorious = bloomFrom(
      withStats({ totalDecades: 60, bySet: { ...EMPTY_STATS.bySet, glorious: 12 } }),
      'steady',
    );
    // Within the per-user rotation of the set's own hue.
    expect(Math.abs(glorious.hue - MYSTERY_SETS.glorious.hue)).toBeLessThan(12);
  });

  it('settles back towards gold when the four sets are prayed evenly', () => {
    const balanced = bloomFrom(
      withStats({
        totalDecades: 120,
        bySet: { joyful: 6, luminous: 6, sorrowful: 6, glorious: 6, free: 0 },
      }),
      'balanced',
    );
    // Nothing dominates, so the hue must not chase a meaningless average.
    expect(Math.min(balanced.hue, 360 - balanced.hue)).toBeLessThan(40);
  });

  it('counts stars up to the current streak but no further', () => {
    expect(bloomFrom(withStats({ currentStreak: 200 }), 'u').growth.stars).toBe(24);
  });
});

describe('streaks', () => {
  it('is zero without any day prayed', () => {
    expect(streaks([], '2026-08-20')).toEqual({ current: 0, longest: 0 });
  });

  it('counts consecutive days ending today', () => {
    const days = ['2026-08-18', '2026-08-19', '2026-08-20'];
    expect(streaks(days, '2026-08-20')).toEqual({ current: 3, longest: 3 });
  });

  it('survives a day that is not over yet', () => {
    const days = ['2026-08-18', '2026-08-19'];
    expect(streaks(days, '2026-08-20').current).toBe(2);
  });

  it('breaks once a whole day has been missed', () => {
    const days = ['2026-08-17', '2026-08-18'];
    expect(streaks(days, '2026-08-20').current).toBe(0);
  });

  it('remembers the longest run even after it breaks', () => {
    const days = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-10'];
    expect(streaks(days, '2026-08-20')).toEqual({ current: 0, longest: 3 });
  });

  it('measures days across a month boundary', () => {
    expect(diffDays('2026-07-31', '2026-08-01')).toBe(1);
    expect(diffDays('2026-02-28', '2026-03-01')).toBe(1);
  });
});
