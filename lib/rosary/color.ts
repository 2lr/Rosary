/**
 * A tiny colour model, just enough to keep a user's chosen colours inside the
 * band where the design still reads: a pale yellow picked for a button must not
 * end up as pale yellow text on cream.
 */

export type Hsl = { h: number; s: number; l: number };

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value.trim());
}

export function normalizeHex(value: string): string {
  const raw = value.trim().replace('#', '').toLowerCase();
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw;
  return `#${full}`;
}

export function hexToHsl(hex: string): Hsl {
  const value = normalizeHex(hex).slice(1);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l: l * 100 };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return { h: ((h * 60) % 360 + 360) % 360, s: s * 100, l: l * 100 };
}

export function hsl({ h, s, l }: Hsl, alpha?: number): string {
  const base = `${h.toFixed(0)} ${clamp(s, 0, 100).toFixed(0)}% ${clamp(l, 0, 100).toFixed(0)}%`;
  return alpha === undefined ? `hsl(${base})` : `hsl(${base} / ${alpha.toFixed(3)})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Interpolates hues the short way around the wheel. */
export function lerpHue(a: number, b: number, t: number): number {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + delta * clamp(t, 0, 1) + 360) % 360;
}

/**
 * Keeps a chosen colour recognisable while forcing it into the lightness and
 * saturation a role can actually carry.
 */
export function fit(
  color: Hsl,
  bounds: { s: [number, number]; l: [number, number] },
): Hsl {
  return {
    h: color.h,
    s: clamp(color.s, bounds.s[0], bounds.s[1]),
    l: clamp(color.l, bounds.l[0], bounds.l[1]),
  };
}

/** The same colour as a hex string, which is all `<input type="color">` takes. */
export function hslToHex({ h, s, l }: Hsl): string {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];

  const m = light - c / 2;
  const channel = (v: number) =>
    Math.round(clamp((v + m) * 255, 0, 255))
      .toString(16)
      .padStart(2, '0');

  return `#${channel(r1)}${channel(g1)}${channel(b1)}`;
}
