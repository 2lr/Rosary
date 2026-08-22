import type { Lang } from '@/lib/i18n/config';
import { MYSTERY_SETS, MYSTERY_SET_ORDER } from './mysteries';
import type { Stats } from './stats';
import { fit, hexToHsl, hsl, hslToHex, isHexColor, lerp, lerpHue, type Hsl } from './color';
import type { LoopShape } from './shapes';
import { growthOf, type Growth } from './traits';
import { degreeFor, stageFor, stageTone, type Degree, type Stage } from './stages';

export {
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
  type Degree,
  type Stage,
} from './stages';

export type Palette = {
  /** Page gradient, lightest first. */
  bg: [string, string, string];
  ink: string;
  /** Card background and its hairline. */
  surface: string;
  border: string;
  /** Chain and filigree. */
  chain: string;
  /** Hail Mary beads. */
  bead: string;
  /** Our Father beads. */
  paterBead: string;
  /** Beads not yet prayed. */
  beadIdle: string;
  /** Highlight for the active bead, buttons and accents. */
  accent: string;
  /** Text and icons that sit on the accent. */
  onAccent: string;
  /** Soft light behind the loop. */
  glow: string;
  /** The centre stone, once it is more than a plain medal. */
  stone: string;
  stoneLight: string;
  stoneDark: string;
  /** Roses and their foliage. */
  rose: string;
  leaf: string;
  /** Real gold, blended into the chain as the `gold` trait rises. */
  goldLeaf: string;
  /** The crucifix. */
  wood: string;
  flesh: string;
  cloth: string;
  outline: string;
  halo: string;
};

export type Bloom = {
  stage: Stage;
  /** There is always one: the ladder does not end. */
  nextStage: Stage;
  /** 0 → 1 progress towards the next stage. */
  toNext: number;
  decadesToNext: number;
  /** Where inside the stage — what moves every few decades. */
  degree: Degree;
  /** Deterministic per-user variation. */
  seed: number;
  palette: Palette;
  /** The outline the beads are threaded onto. */
  shape: LoopShape;
  /** Every measurable property of the artwork, and how far each has come. */
  growth: Growth;
  /** 0 → 1, how luminous the whole piece is. */
  luminosity: number;
  /** Dominant hue in degrees. */
  hue: number;
  hueAlt: number;
  /** True when the colours come from the user's own choice. */
  custom: boolean;
  /** Accent, beads and chain as hex, whether chosen or derived. */
  trio: [string, string, string];
};

/** Small deterministic string hash, so a user's artwork is always their own. */
export function seedFrom(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** The hue a rosary starts from, and the one it returns to when balanced. */
const GOLD_HUE = 36;

/**
 * Blends the accent hues of the mystery sets the user has actually prayed.
 * Someone who only prays the glorious mysteries gets a violet rosary; someone
 * who prays all four evenly comes back to gold, because an average of hues that
 * cancel out carries no meaning.
 */
function blendHue(bySet: Stats['bySet']): { hue: number; hueAlt: number; spread: number } {
  let x = 0;
  let y = 0;
  let total = 0;
  const used: number[] = [];

  for (const id of MYSTERY_SET_ORDER) {
    const weight = bySet[id];
    if (weight <= 0) continue;
    used.push(MYSTERY_SETS[id].hue);
    const rad = (MYSTERY_SETS[id].hue * Math.PI) / 180;
    x += Math.cos(rad) * weight;
    y += Math.sin(rad) * weight;
    total += weight;
  }

  if (total === 0) return { hue: GOLD_HUE, hueAlt: 24, spread: 0 };

  const meanHue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dominance = Math.hypot(x, y) / total;
  const hue = lerpHue(GOLD_HUE, meanHue, dominance);
  return { hue, hueAlt: (hue + 28) % 360, spread: used.length / MYSTERY_SET_ORDER.length };
}

/**
 * The palette is written in a light key: a warm cream page with the rosary
 * drawn on it, the way a rosary is actually seen — in daylight, on cloth.
 * Stage only deepens the colour; it never darkens the paper.
 */
function paletteFor(
  t: number,
  luminosity: number,
  colors: { accent: Hsl; bead: Hsl; chain: Hsl },
  growth: Growth,
): Palette {
  const base = colors;
  // Depth of colour is a trait like any other: it starts nearly washed out and
  // deepens with every decade, so the same three chosen colours look different
  // on day one and after a year.
  const chroma = growth.value.chroma;
  const withChroma = (c: Hsl): Hsl => ({ ...c, s: c.s * chroma });

  const accent = withChroma(base.accent);
  const bead = withChroma(base.bead);
  const chainBase = withChroma(base.chain);

  // Gold is worked into the chain rather than replacing it.
  const gold = growth.value.gold;
  const chain: Hsl = {
    h: lerpHue(chainBase.h, GOLD_HUE + 6, gold * 0.85),
    s: lerp(chainBase.s, 58, gold * 0.8),
    l: lerp(chainBase.l, 52, gold * 0.6),
  };

  // New colours arrive one at a time, mildest first: the roses warm away from
  // the accent, then the foliage becomes a true green, and only at the end does
  // the stone take the split complement — the boldest note, saved for a piece
  // rich enough to carry it.
  const extra = growth.notch.palette;
  const roseHue = extra >= 1 ? (accent.h + 332) % 360 : accent.h;
  const leafHue = lerpHue(accent.h, 104, extra >= 2 ? 0.7 : 0.2);
  const stoneHue = extra >= 3 ? (accent.h + 156) % 360 : accent.h;

  // The paper stays warm whatever colours are chosen: interpolating its hue
  // towards a blue accent would swing the cream to green.
  const paper = GOLD_HUE;

  return {
    bg: [
      hsl({ h: paper, s: 44, l: 97 }),
      hsl({ h: paper, s: 38, l: 94 }),
      // Only a hint of the chosen colour: the page should stay cream.
      hsl({ h: accent.h, s: lerp(12, 22, t), l: lerp(95, 92, t) }),
    ],
    ink: hsl({ h: 26, s: 22, l: 17 }),
    surface: hsl({ h: paper, s: 60, l: 99 }, 0.66),
    border: hsl({ h: paper, s: 26, l: 38 }, 0.15),
    chain: hsl(chain),
    bead: hsl(bead),
    paterBead: hsl({ h: chain.h, s: chain.s + 10, l: chain.l - 9 }),
    stone: hsl({ h: stoneHue, s: lerp(16, 52, chroma), l: lerp(62, 44, chroma) }),
    stoneLight: hsl({ h: stoneHue, s: lerp(18, 48, chroma), l: lerp(80, 70, chroma) }),
    stoneDark: hsl({ h: stoneHue, s: lerp(20, 56, chroma), l: lerp(48, 30, chroma) }),
    rose: hsl({ h: roseHue, s: lerp(20, 64, chroma), l: lerp(72, 58, chroma) }),
    leaf: hsl({ h: leafHue, s: lerp(14, 40, chroma), l: lerp(62, 44, chroma) }),
    goldLeaf: hsl({ h: GOLD_HUE + 6, s: lerp(30, 66, chroma), l: 52 }),
    beadIdle: hsl({ h: paper, s: 26, l: 78 }),
    accent: hsl(accent),
    onAccent: hsl({ h: paper, s: 62, l: 97 }),
    glow: hsl({ h: accent.h, s: lerp(52, 74, t), l: lerp(74, 68, t) }, 0.07 + luminosity * 0.14),
    wood: hsl({ h: 24, s: lerp(22, 36, growth.value.patina), l: lerp(29, 20, growth.value.patina) }),
    flesh: hsl({ h: 36, s: lerp(30, 44, t), l: 86 }),
    cloth: hsl({ h: 34, s: lerp(28, 42, t), l: 71 }),
    outline: hsl({ h: 28, s: 30, l: lerp(48, 41, t) }),
    halo: hsl({ h: accent.h, s: lerp(50, 84, t), l: lerp(56, 50, t) }),
  };
}

/** Bounds that keep each role legible whatever colour is chosen for it. */
const ROLE_BOUNDS = {
  accent: { s: [34, 86] as [number, number], l: [38, 52] as [number, number] },
  bead: { s: [18, 74] as [number, number], l: [44, 66] as [number, number] },
  chain: { s: [14, 64] as [number, number], l: [40, 62] as [number, number] },
};

export type BloomPreferences = {
  /** Accent, beads and chain, in that order. */
  colors?: readonly string[] | null;
  shape?: LoopShape | null;
};

export function bloomFrom(
  stats: Stats,
  userId: string,
  preferences: BloomPreferences = {},
): Bloom {
  const { stage, next } = stageFor(stats.totalDecades);
  const seed = seedFrom(userId);
  const t = stageTone(stage.index);

  const chosen =
    preferences.colors && preferences.colors.length === 3 && preferences.colors.every(isHexColor)
      ? (preferences.colors.map(hexToHsl) as [Hsl, Hsl, Hsl])
      : null;

  const { hue: baseHue, hueAlt: derivedAlt } = blendHue(stats.bySet);
  // A small, stable per-user rotation keeps two rosaries from looking identical.
  const derivedHue = (baseHue + (seed - 0.5) * 22 + 360) % 360;

  const colors = chosen
    ? {
        accent: fit(chosen[0], ROLE_BOUNDS.accent),
        bead: fit(chosen[1], ROLE_BOUNDS.bead),
        chain: fit(chosen[2], ROLE_BOUNDS.chain),
      }
    : {
        accent: { h: (derivedHue + 4) % 360, s: lerp(48, 82, t), l: lerp(47, 41, t) },
        bead: { h: derivedHue, s: lerp(18, 66, t), l: lerp(64, 54, t) },
        chain: { h: derivedAlt, s: lerp(16, 46, t), l: lerp(54, 46, t) },
      };

  const hue = colors.accent.h;
  const hueAlt = colors.chain.h;

  const span = Math.max(1, next.threshold - stage.threshold);
  const toNext = Math.min(1, Math.max(0, (stats.totalDecades - stage.threshold) / span));
  const degree = degreeFor(stats.totalDecades);

  const growth = growthOf({
    decades: stats.totalDecades,
    rosaries: stats.totalCompleted,
    streak: stats.currentStreak,
    sets: MYSTERY_SET_ORDER.filter((id) => stats.bySet[id] > 0).length,
  });

  const luminosity = Math.min(
    1,
    growth.value.chroma * 0.7 + Math.min(stats.currentStreak, 30) / 100,
  );

  return {
    stage,
    nextStage: next,
    toNext,
    decadesToNext: Math.max(0, next.threshold - stats.totalDecades),
    degree,
    seed,
    shape: preferences.shape ?? 'round',
    custom: chosen !== null,
    trio: [hslToHex(colors.accent), hslToHex(colors.bead), hslToHex(colors.chain)],
    growth,
    palette: paletteFor(t, luminosity, colors, growth),
    luminosity,
    hue,
    hueAlt,
  };
}
