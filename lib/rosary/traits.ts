import type { MessageKey } from '@/lib/i18n/dictionary';

/**
 * How a rosary grows.
 *
 * Every visible property is a function of what has actually been prayed. The
 * curve is always the same saturating one,
 *
 *     value(D) = from + (to - from) · D / (D + k)
 *
 * which has three properties this needs. It rises fastest at the beginning, so
 * the first weeks feel alive. It never finishes, so there is always something
 * further on. And it inverts in closed form, so the app can always say exactly
 * how many decades remain before the next visible change.
 *
 * `k` is the half-life: at D = k the trait is halfway to its limit. Giving each
 * trait its own k is what staggers them — the colour deepens in the first
 * month, the stone is still growing after a thousand rosaries.
 */

export type TraitId =
  | 'aveRadius'
  | 'paterRadius'
  | 'stone'
  | 'stoneFacets'
  | 'crossHeight'
  | 'chroma'
  | 'gold'
  | 'cut'
  | 'dew'
  | 'patina'
  | 'engraving'
  | 'palette'
  | 'roses'
  | 'leaves'
  | 'filigree'
  | 'rays'
  | 'haloRings'
  | 'dove'
  | 'crown'
  | 'roseWindow'
  | 'lilies';

export type TraitKind =
  /** A measurement that grows: a radius, a saturation, an amount of gold. */
  | 'continuous'
  /** A number of things: roses, rays, rings. Each one is its own event. */
  | 'counted'
  /** Appears once, at a threshold, and stays. */
  | 'milestone';

export type Trait = {
  id: TraitId;
  kind: TraitKind;
  from: number;
  to: number;
  /** Half-life in decades. Ignored by milestones. */
  k: number;
  /** Perceptible steps across the range. Continuous traits only. */
  notches: number;
  /** Decades needed. Milestones only. */
  at?: number;
  label: MessageKey;
  /** Announced when the trait advances. */
  change: MessageKey;
  /** Ordering when several things change at once: bigger news first. */
  weight: number;
};

export const TRAITS: Trait[] = [
  // --- Appear once, and are the loudest news when they do -------------------
  { id: 'dove', kind: 'milestone', from: 0, to: 1, k: 0, notches: 1, at: 150,
    label: 'trait.dove', change: 'trait.dove.change', weight: 100 },
  { id: 'crown', kind: 'milestone', from: 0, to: 1, k: 0, notches: 1, at: 600,
    label: 'trait.crown', change: 'trait.crown.change', weight: 100 },
  { id: 'roseWindow', kind: 'milestone', from: 0, to: 1, k: 0, notches: 1, at: 1600,
    label: 'trait.roseWindow', change: 'trait.roseWindow.change', weight: 100 },
  { id: 'lilies', kind: 'milestone', from: 0, to: 1, k: 0, notches: 1, at: 3600,
    label: 'trait.lilies', change: 'trait.lilies.change', weight: 100 },

  // --- Things you can count -------------------------------------------------
  { id: 'roses', kind: 'counted', from: 0, to: 34, k: 380, notches: 34,
    label: 'trait.roses', change: 'trait.roses.change', weight: 60 },
  { id: 'palette', kind: 'counted', from: 0, to: 3, k: 300, notches: 3,
    label: 'trait.palette', change: 'trait.palette.change', weight: 70 },
  { id: 'haloRings', kind: 'counted', from: 0, to: 5, k: 1500, notches: 5,
    label: 'trait.haloRings', change: 'trait.haloRings.change', weight: 55 },
  { id: 'filigree', kind: 'counted', from: 0, to: 10, k: 260, notches: 10,
    label: 'trait.filigree', change: 'trait.filigree.change', weight: 50 },
  { id: 'leaves', kind: 'counted', from: 0, to: 26, k: 900, notches: 26,
    label: 'trait.leaves', change: 'trait.leaves.change', weight: 45 },
  { id: 'rays', kind: 'counted', from: 0, to: 40, k: 1400, notches: 40,
    label: 'trait.rays', change: 'trait.rays.change', weight: 40 },
  { id: 'stoneFacets', kind: 'counted', from: 0, to: 8, k: 700, notches: 8,
    label: 'trait.stoneFacets', change: 'trait.stoneFacets.change', weight: 58 },

  // --- Measurements ---------------------------------------------------------
  { id: 'stone', kind: 'continuous', from: 10, to: 30, k: 900, notches: 14,
    label: 'trait.stone', change: 'trait.stone.change', weight: 65 },
  { id: 'chroma', kind: 'continuous', from: 0.2, to: 1, k: 110, notches: 12,
    label: 'trait.chroma', change: 'trait.chroma.change', weight: 35 },
  { id: 'gold', kind: 'continuous', from: 0, to: 1, k: 320, notches: 10,
    label: 'trait.gold', change: 'trait.gold.change', weight: 48 },
  { id: 'paterRadius', kind: 'continuous', from: 6.8, to: 10.4, k: 620, notches: 12,
    label: 'trait.paterRadius', change: 'trait.paterRadius.change', weight: 30 },
  { id: 'aveRadius', kind: 'continuous', from: 4.6, to: 6.6, k: 420, notches: 10,
    label: 'trait.aveRadius', change: 'trait.aveRadius.change', weight: 28 },
  { id: 'cut', kind: 'continuous', from: 0, to: 1, k: 800, notches: 8,
    label: 'trait.cut', change: 'trait.cut.change', weight: 42 },
  { id: 'dew', kind: 'continuous', from: 0, to: 1, k: 520, notches: 8,
    label: 'trait.dew', change: 'trait.dew.change', weight: 26 },
  { id: 'crossHeight', kind: 'continuous', from: 132, to: 196, k: 1100, notches: 9,
    label: 'trait.crossHeight', change: 'trait.crossHeight.change', weight: 52 },
  { id: 'engraving', kind: 'continuous', from: 0, to: 1, k: 1200, notches: 6,
    label: 'trait.engraving', change: 'trait.engraving.change', weight: 38 },
  { id: 'patina', kind: 'continuous', from: 0, to: 1, k: 1800, notches: 6,
    label: 'trait.patina', change: 'trait.patina.change', weight: 24 },
];

export const TRAIT_BY_ID = Object.fromEntries(TRAITS.map((t) => [t.id, t])) as Record<
  TraitId,
  Trait
>;

/** How many completed rosaries fit in one ring of the band of memory. */
export const MEMORY_RING_CAPACITY = 240;
export const MEMORY_MAX_RINGS = 6;

export type GrowthInput = {
  /** Decades prayed. The currency of the whole model. */
  decades: number;
  /** Completed rosaries, which the band of memory counts one by one. */
  rosaries: number;
  /** Days in a row, which sets the stars. */
  streak: number;
  /** How many of the four sets of mysteries have been prayed at least once. */
  sets: number;
};

export type Growth = {
  input: GrowthInput;
  value: Record<TraitId, number>;
  /** The integer step a trait is on. A change in this is what gets announced. */
  notch: Record<TraitId, number>;
  /** Decades still to pray before this trait next changes; null when finished. */
  remaining: Record<TraitId, number | null>;
  /** One tick per completed rosary, wrapped into concentric rings. */
  memory: { ticks: number; rings: number; lastRingTicks: number };
  stars: number;
};

/** value(D) = from + (to − from) · D / (D + k) */
export function saturate(decades: number, trait: Trait): number {
  if (trait.kind === 'milestone') return decades >= (trait.at ?? 0) ? 1 : 0;
  const d = Math.max(0, decades);
  return trait.from + (trait.to - trait.from) * (d / (d + trait.k));
}

/** The inverse: the decades at which the trait first reaches `value`. */
export function decadesFor(value: number, trait: Trait): number {
  if (trait.kind === 'milestone') return trait.at ?? 0;
  const span = trait.to - trait.from;
  if (span === 0) return 0;
  const p = (value - trait.from) / span;
  if (p <= 0) return 0;
  if (p >= 1) return Number.POSITIVE_INFINITY;
  return (trait.k * p) / (1 - p);
}

export function notchOf(decades: number, trait: Trait): number {
  if (trait.kind === 'milestone') return decades >= (trait.at ?? 0) ? 1 : 0;
  const value = saturate(decades, trait);
  if (trait.kind === 'counted') return Math.round(value);
  const span = trait.to - trait.from;
  const p = span === 0 ? 0 : (value - trait.from) / span;
  return Math.min(trait.notches, Math.floor(p * trait.notches));
}

/** Decades left before this trait next changes, or null once it is spent. */
export function remainingFor(decades: number, trait: Trait): number | null {
  if (trait.kind === 'milestone') {
    const at = trait.at ?? 0;
    return decades >= at ? null : at - decades;
  }

  const current = notchOf(decades, trait);
  if (current >= trait.notches) return null;

  const span = trait.to - trait.from;
  // Counted traits round, so the next one arrives half a step early.
  const target =
    trait.kind === 'counted'
      ? trait.from + (current + 0.5) * (span / trait.to || 1)
      : trait.from + ((current + 1) / trait.notches) * span;

  const at = decadesFor(target, trait);
  if (!Number.isFinite(at)) return null;
  return Math.max(1, Math.ceil(at - decades));
}

export function growthOf(input: GrowthInput): Growth {
  const decades = Math.max(0, input.decades);

  const value = {} as Record<TraitId, number>;
  const notch = {} as Record<TraitId, number>;
  const remaining = {} as Record<TraitId, number | null>;

  for (const trait of TRAITS) {
    value[trait.id] = saturate(decades, trait);
    notch[trait.id] = notchOf(decades, trait);
    remaining[trait.id] = remainingFor(decades, trait);
  }

  const ticks = Math.max(0, Math.floor(input.rosaries));
  const rings = Math.min(MEMORY_MAX_RINGS, Math.ceil(ticks / MEMORY_RING_CAPACITY));
  const lastRingTicks =
    rings === 0
      ? 0
      : rings >= MEMORY_MAX_RINGS
        ? MEMORY_RING_CAPACITY
        : ticks - (rings - 1) * MEMORY_RING_CAPACITY;

  return {
    input: { ...input, decades },
    value,
    notch,
    remaining,
    memory: { ticks, rings, lastRingTicks },
    stars: Math.min(24, Math.max(0, input.streak)),
  };
}

export type Change = {
  trait: Trait;
  from: number;
  to: number;
  /** How many steps it moved. */
  steps: number;
};

/**
 * What is visibly different between two states. Sorted so the biggest news
 * comes first, which is what the completion screen shows.
 */
export function describeChanges(before: Growth, after: Growth): Change[] {
  const changes: Change[] = [];

  for (const trait of TRAITS) {
    const from = before.notch[trait.id];
    const to = after.notch[trait.id];
    if (to > from) changes.push({ trait, from, to, steps: to - from });
  }

  return changes.sort((a, b) => b.trait.weight - a.trait.weight || b.steps - a.steps);
}

/**
 * The trait that will change next, and how far off it is. Used when a rosary
 * moved nothing yet: there is always a true thing to say about what is coming.
 */
export function nextChange(growth: Growth): { trait: Trait; remaining: number } | null {
  let best: { trait: Trait; remaining: number } | null = null;
  for (const trait of TRAITS) {
    const left = growth.remaining[trait.id];
    if (left === null) continue;
    if (!best || left < best.remaining) best = { trait, remaining: left };
  }
  return best;
}

/** Traits already showing, for the panel behind the artwork. */
export function activeTraits(growth: Growth): Trait[] {
  return TRAITS.filter((trait) => growth.notch[trait.id] > 0);
}
