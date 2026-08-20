/**
 * The outline the beads are threaded onto.
 *
 * All three shapes are superellipses, so one parametric function covers them:
 * a circle, a taller ellipse, and a rounded square are the same curve with
 * different radii and a different exponent.
 */

export const LOOP_SHAPES = ['round', 'oval', 'square'] as const;
export type LoopShape = (typeof LOOP_SHAPES)[number];

export function isLoopShape(value: unknown): value is LoopShape {
  return typeof value === 'string' && (LOOP_SHAPES as readonly string[]).includes(value);
}

type ShapeSpec = { rx: number; ry: number; exponent: number };

/** Radii as a fraction of the nominal loop radius. */
const SPECS: Record<LoopShape, ShapeSpec> = {
  round: { rx: 1, ry: 1, exponent: 2 },
  oval: { rx: 0.84, ry: 1.1, exponent: 2 },
  square: { rx: 0.97, ry: 0.97, exponent: 3.6 },
};

export type Point = { x: number; y: number };

export type Loop = {
  shape: LoopShape;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Total outline length, in user units. */
  length: number;
  /** Point at a fraction of the outline, measured clockwise from the bottom. */
  at: (fraction: number) => Point;
  /** Outward unit normal at a fraction of the outline. */
  normalAt: (fraction: number) => Point;
};

const SAMPLES = 1440;

function superellipse(spec: ShapeSpec, cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = 2 / spec.exponent;
  return {
    x: cx + Math.sign(cos) * Math.abs(cos) ** p * spec.rx * r,
    y: cy + Math.sign(sin) * Math.abs(sin) ** p * spec.ry * r,
  };
}

/**
 * Builds an arc-length parameterisation so beads sit evenly however the outline
 * is stretched — an ellipse spaced by angle alone would bunch them at the ends.
 */
export function buildLoop(shape: LoopShape, cx: number, cy: number, r: number): Loop {
  const spec = SPECS[shape];
  const points: Point[] = [];
  const cumulative: number[] = [0];

  // Start at the bottom of the outline and walk clockwise, so fraction 0 is the
  // gap where the pendant hangs.
  for (let i = 0; i <= SAMPLES; i++) {
    const angle = 90 + (360 * i) / SAMPLES;
    const point = superellipse(spec, cx, cy, r, angle);
    points.push(point);
    if (i > 0) {
      const previous = points[i - 1];
      cumulative.push(cumulative[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
    }
  }

  const length = cumulative[cumulative.length - 1];

  const at = (fraction: number): Point => {
    const target = ((fraction % 1) + 1) % 1 * length;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] <= target) lo = mid;
      else hi = mid;
    }
    const span = cumulative[hi] - cumulative[lo] || 1;
    const t = (target - cumulative[lo]) / span;
    return {
      x: points[lo].x + (points[hi].x - points[lo].x) * t,
      y: points[lo].y + (points[hi].y - points[lo].y) * t,
    };
  };

  const normalAt = (fraction: number): Point => {
    const step = 0.0015;
    const a = at(fraction - step);
    const b = at(fraction + step);
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const norm = Math.hypot(tx, ty) || 1;
    // Clockwise travel means the outward normal is the tangent turned left.
    return { x: ty / norm, y: -tx / norm };
  };

  return { shape, cx, cy, rx: spec.rx * r, ry: spec.ry * r, length, at, normalAt };
}

/** The outline as an SVG path, with a gap left at the bottom for the pendant. */
export function loopPath(loop: Loop, gap: number, steps = 320): string {
  const from = gap / 2;
  const to = 1 - gap / 2;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const point = loop.at(from + ((to - from) * i) / steps);
    parts.push(`${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
  }
  return parts.join(' ');
}

/** Evenly spaced positions for the beads of the loop, skipping the gap. */
export function beadFractions(count: number, gap: number): number[] {
  const span = 1 - gap;
  return Array.from({ length: count }, (_, i) => gap / 2 + (span * (i + 0.5)) / count);
}
