import { describe, expect, it } from 'vitest';
import { beadFractions, buildLoop, LOOP_SHAPES, isLoopShape } from '@/lib/rosary/shapes';
import { fit, hexToHsl, isHexColor, normalizeHex } from '@/lib/rosary/color';
import { bloomFrom } from '@/lib/rosary/growth';
import { EMPTY_STATS } from '@/lib/rosary/stats';
import { HARMONIES } from '@/lib/rosary/harmonies';

describe('the loop outline', () => {
  it('offers a shape for every choice the settings expose', () => {
    expect(LOOP_SHAPES).toEqual(['round', 'oval', 'square']);
    expect(isLoopShape('round')).toBe(true);
    expect(isLoopShape('triangle')).toBe(false);
  });

  it('spaces the beads evenly along the outline, whatever its shape', () => {
    for (const shape of LOOP_SHAPES) {
      const loop = buildLoop(shape, 200, 200, 140);
      const fractions = beadFractions(55, 0.055);
      const gaps: number[] = [];
      for (let i = 1; i < fractions.length; i++) {
        const a = loop.at(fractions[i - 1]);
        const b = loop.at(fractions[i]);
        gaps.push(Math.hypot(b.x - a.x, b.y - a.y));
      }
      const min = Math.min(...gaps);
      const max = Math.max(...gaps);
      // Arc-length spacing, so even the squircle's corners must not bunch up.
      expect(max / min).toBeLessThan(1.05);
    }
  });

  it('starts at the bottom, where the pendant hangs', () => {
    const loop = buildLoop('round', 200, 200, 140);
    const bottom = loop.at(0);
    expect(bottom.x).toBeCloseTo(200, 1);
    expect(bottom.y).toBeCloseTo(340, 1);
  });

  it('makes the oval taller than it is wide, and the square wider than a circle at its corner', () => {
    const oval = buildLoop('oval', 200, 200, 140);
    expect(oval.ry).toBeGreaterThan(oval.rx);

    const round = buildLoop('round', 200, 200, 140);
    const square = buildLoop('square', 200, 200, 140);
    // An eighth of the way round sits on the diagonal, where a squircle bulges.
    const cornerRound = round.at(0.125);
    const cornerSquare = square.at(0.125);
    const distance = (p: { x: number; y: number }) => Math.hypot(p.x - 200, p.y - 200);
    expect(distance(cornerSquare)).toBeGreaterThan(distance(cornerRound));
  });

  it('points its normals outwards', () => {
    const loop = buildLoop('round', 200, 200, 140);
    for (const f of [0.1, 0.35, 0.6, 0.9]) {
      const point = loop.at(f);
      const normal = loop.normalAt(f);
      const outward = { x: point.x - 200, y: point.y - 200 };
      const dot = normal.x * outward.x + normal.y * outward.y;
      expect(dot).toBeGreaterThan(0);
    }
  });
});

describe('chosen colours', () => {
  it('accepts the shapes a colour input can produce', () => {
    expect(isHexColor('#a97b32')).toBe(true);
    expect(isHexColor('a97b32')).toBe(true);
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('rgb(1,2,3)')).toBe(false);
    expect(normalizeHex('ABC')).toBe('#aabbcc');
  });

  it('reads a hex colour back as hue, saturation and lightness', () => {
    expect(hexToHsl('#ff0000')).toMatchObject({ h: 0, s: 100, l: 50 });
    expect(hexToHsl('#ffffff').l).toBe(100);
    expect(hexToHsl('#808080').s).toBe(0);
  });

  it('keeps a colour recognisable while forcing it into a usable band', () => {
    const pale = fit(hexToHsl('#fffbe6'), { s: [34, 86], l: [38, 52] });
    expect(pale.l).toBe(52);
    expect(pale.s).toBeGreaterThanOrEqual(34);
    // The hue survives: it is still the yellow that was picked.
    expect(pale.h).toBeGreaterThan(40);
    expect(pale.h).toBeLessThan(70);
  });

  it('is used by the artwork in place of the mystery colours', () => {
    const derived = bloomFrom(EMPTY_STATS, 'user', {});
    const chosen = bloomFrom(EMPTY_STATS, 'user', { colors: ['#3f6fa8', '#8fb3d9', '#6a86a8'] });

    expect(derived.custom).toBe(false);
    expect(chosen.custom).toBe(true);
    // Marian blue, not gold.
    expect(chosen.hue).toBeGreaterThan(180);
    expect(chosen.hue).toBeLessThan(250);
  });

  it('ignores a trio that is not three valid colours', () => {
    expect(bloomFrom(EMPTY_STATS, 'user', { colors: ['#fff', 'nope', '#000'] }).custom).toBe(false);
    expect(bloomFrom(EMPTY_STATS, 'user', { colors: ['#fff', '#000'] }).custom).toBe(false);
  });

  it('offers harmonies that are all valid trios', () => {
    for (const harmony of HARMONIES) {
      expect(harmony.colors).toHaveLength(3);
      expect(harmony.colors.every(isHexColor)).toBe(true);
      expect(bloomFrom(EMPTY_STATS, 'u', { colors: harmony.colors }).custom).toBe(true);
    }
  });

  it('carries the chosen shape through to the artwork', () => {
    expect(bloomFrom(EMPTY_STATS, 'u', { shape: 'oval' }).shape).toBe('oval');
    expect(bloomFrom(EMPTY_STATS, 'u', {}).shape).toBe('round');
  });
});

describe('the resolved trio', () => {
  it('is exposed as hex, so a colour input can start from it', () => {
    const derived = bloomFrom(EMPTY_STATS, 'user', {});
    expect(derived.trio).toHaveLength(3);
    for (const color of derived.trio) expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('round-trips a chosen colour through the clamp without changing its hue', () => {
    const chosen = bloomFrom(EMPTY_STATS, 'user', {
      colors: ['#3f6fa8', '#8fb3d9', '#6a86a8'],
    });
    expect(Math.abs(hexToHsl(chosen.trio[0]).h - hexToHsl('#3f6fa8').h)).toBeLessThan(2);
  });
});
