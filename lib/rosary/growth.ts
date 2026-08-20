import type { Lang } from '@/lib/i18n/config';
import { MYSTERY_SETS, MYSTERY_SET_ORDER } from './mysteries';
import type { Stats } from './stats';
import { fit, hexToHsl, hsl, hslToHex, isHexColor, lerp, lerpHue, type Hsl } from './color';
import type { LoopShape } from './shapes';

export type Stage = {
  index: number;
  key: string;
  name: Record<Lang, string>;
  /** Completed decades needed to reach this stage. */
  threshold: number;
  /** One line of encouragement shown under the artwork. */
  note: Record<Lang, string>;
};

/**
 * Eight stages, each reached by praying — never by anything else. The artwork
 * gains an element at every stage, so the picture is literally the record of
 * the prayer behind it.
 */
export const STAGES: Stage[] = [
  {
    index: 0,
    key: 'seed',
    name: { fr: 'Semence', en: 'Seed' },
    threshold: 0,
    note: {
      fr: 'Tout commence par une dizaine. Votre rosaire est encore nu.',
      en: 'Everything begins with one decade. Your rosary is still bare.',
    },
  },
  {
    index: 1,
    key: 'bud',
    name: { fr: 'Éclosion', en: 'Budding' },
    threshold: 5,
    note: {
      fr: 'Un premier chapelet. Les grains prennent leur couleur.',
      en: 'A first chaplet. The beads take on their colour.',
    },
  },
  {
    index: 2,
    key: 'rose',
    name: { fr: 'Rosier', en: 'Rosebush' },
    threshold: 25,
    note: {
      fr: 'Les premières roses s’ouvrent autour de la chaîne.',
      en: 'The first roses open around the chain.',
    },
  },
  {
    index: 3,
    key: 'bloom',
    name: { fr: 'Floraison', en: 'Blossom' },
    threshold: 60,
    note: {
      fr: 'La prière est devenue une habitude. La couronne s’épaissit.',
      en: 'Prayer has become a habit. The crown thickens.',
    },
  },
  {
    index: 4,
    key: 'garden',
    name: { fr: 'Jardin', en: 'Garden' },
    threshold: 120,
    note: {
      fr: 'Un jardin clos, patiemment cultivé, dizaine après dizaine.',
      en: 'An enclosed garden, patiently tended, decade after decade.',
    },
  },
  {
    index: 5,
    key: 'dawn',
    name: { fr: 'Aurore', en: 'Aurora' },
    threshold: 250,
    note: {
      fr: 'La lumière traverse maintenant tout le rosaire.',
      en: 'Light now passes through the whole rosary.',
    },
  },
  {
    index: 6,
    key: 'glass',
    name: { fr: 'Vitrail', en: 'Stained Glass' },
    threshold: 500,
    note: {
      fr: 'Chaque grain est devenu une pièce de verre coloré.',
      en: 'Every bead has become a piece of coloured glass.',
    },
  },
  {
    index: 7,
    key: 'crown',
    name: { fr: 'Couronne', en: 'Crown' },
    threshold: 1000,
    note: {
      fr: 'Mille dizaines. La couronne est achevée — et elle continue.',
      en: 'A thousand decades. The crown is complete — and it goes on.',
    },
  },
];

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
  /** The crucifix. */
  wood: string;
  flesh: string;
  cloth: string;
  outline: string;
  halo: string;
};

export type Bloom = {
  stage: Stage;
  nextStage: Stage | null;
  /** 0 → 1 progress towards the next stage. */
  toNext: number;
  decadesToNext: number;
  /** Deterministic per-user variation. */
  seed: number;
  palette: Palette;
  /** The outline the beads are threaded onto. */
  shape: LoopShape;
  /** Number of roses drawn around the loop. */
  petals: number;
  /** Rays of light behind the loop. */
  rays: number;
  /** Small stars, one per day of the current streak (capped). */
  stars: number;
  /** 0 → 1, how luminous the whole piece is. */
  luminosity: number;
  /** Whether filigree is drawn between the decades. */
  filigree: boolean;
  /** Whether the beads are faceted like stained glass. */
  faceted: boolean;
  /** Whether a halo surrounds the centre medal. */
  halo: boolean;
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

export function stageFor(decades: number): { stage: Stage; next: Stage | null } {
  let stage = STAGES[0];
  for (const candidate of STAGES) {
    if (decades >= candidate.threshold) stage = candidate;
  }
  const next = STAGES[stage.index + 1] ?? null;
  return { stage, next };
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
): Palette {
  const { accent, bead, chain } = colors;
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
    paterBead: hsl({ h: chain.h, s: chain.s + 8, l: chain.l - 8 }),
    beadIdle: hsl({ h: paper, s: 26, l: 78 }),
    accent: hsl(accent),
    onAccent: hsl({ h: paper, s: 62, l: 97 }),
    glow: hsl({ h: accent.h, s: lerp(52, 74, t), l: lerp(74, 68, t) }, 0.07 + luminosity * 0.14),
    wood: hsl({ h: 24, s: lerp(24, 34, t), l: lerp(27, 22, t) }),
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
  const t = stage.index / (STAGES.length - 1);

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

  const span = next ? next.threshold - stage.threshold : 1;
  const toNext = next ? Math.min(1, (stats.totalDecades - stage.threshold) / span) : 1;

  const luminosity = Math.min(1, t + Math.min(stats.currentStreak, 30) / 90);

  return {
    stage,
    nextStage: next,
    toNext,
    decadesToNext: next ? Math.max(0, next.threshold - stats.totalDecades) : 0,
    seed,
    shape: preferences.shape ?? 'round',
    custom: chosen !== null,
    trio: [hslToHex(colors.accent), hslToHex(colors.bead), hslToHex(colors.chain)],
    palette: paletteFor(t, luminosity, colors),
    petals: stage.index === 0 ? 0 : Math.round(lerp(5, 26, t)),
    rays: stage.index >= 5 ? Math.round(lerp(12, 36, toNext)) : stage.index >= 3 ? 8 : 0,
    stars: Math.min(24, stats.currentStreak),
    luminosity,
    filigree: stage.index >= 2,
    faceted: stage.index >= 6,
    halo: stage.index >= 4,
    hue,
    hueAlt,
  };
}
