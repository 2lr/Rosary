import type { Lang } from '@/lib/i18n/config';
import { MYSTERY_SETS, MYSTERY_SET_ORDER } from './mysteries';
import type { Stats } from './stats';

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
  /** Background gradient stops, darkest first. */
  bg: [string, string, string];
  /** Chain / filigree colour. */
  chain: string;
  /** Hail Mary beads. */
  bead: string;
  /** Our Father beads. */
  paterBead: string;
  /** Highlight used for the active bead and accents. */
  accent: string;
  /** Soft glow behind the loop. */
  glow: string;
  ink: string;
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
  /** Number of roses drawn around the loop. */
  petals: number;
  /** Rays of light behind the loop. */
  rays: number;
  /** Small stars, one per day of the current streak (capped). */
  stars: number;
  /** 0 → 1, how luminous the whole piece is. */
  luminosity: number;
  /** Whether gold filigree is drawn between the decades. */
  filigree: boolean;
  /** Whether the beads are faceted like stained glass. */
  faceted: boolean;
  /** Whether a halo surrounds the centre medal. */
  halo: boolean;
  /** Dominant hue in degrees, blended from the mysteries actually prayed. */
  hue: number;
  /** Secondary hue, used for the Our Father beads. */
  hueAlt: number;
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

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** The hue a rosary starts from, and the one it returns to when balanced. */
const GOLD_HUE = 36;

/** Interpolates hues the short way around the wheel. */
function mixHue(a: number, b: number, t: number): number {
  const delta = (((b - a) % 360) + 540) % 360 - 180;
  return (a + delta * t + 360) % 360;
}

/**
 * Blends the accent hues of the mystery sets the user has actually prayed.
 * Someone who only prays the glorious mysteries gets a violet rosary; someone
 * who prays all four gets a hue that sits between them.
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
  // How lopsided the devotion is: 1 when a single set dominates, ~0 when the
  // four sets balance and the mean hue becomes meaningless.
  const dominance = Math.hypot(x, y) / total;
  const hue = mixHue(GOLD_HUE, meanHue, dominance);
  const spread = used.length / MYSTERY_SET_ORDER.length;
  return { hue, hueAlt: (hue + 28) % 360, spread };
}

function paletteFor(stageIndex: number, hue: number, hueAlt: number, luminosity: number): Palette {
  const t = stageIndex / (STAGES.length - 1);
  const sat = mix(14, 52, t);
  const light = mix(34, 66, t);

  return {
    bg: [
      `hsl(${(hue + 210) % 360} ${mix(12, 26, t).toFixed(0)}% ${mix(6, 9, t).toFixed(0)}%)`,
      `hsl(${(hue + 250) % 360} ${mix(16, 34, t).toFixed(0)}% ${mix(9, 15, t).toFixed(0)}%)`,
      `hsl(${hue.toFixed(0)} ${mix(10, 40, t).toFixed(0)}% ${mix(11, 21, t).toFixed(0)}%)`,
    ],
    chain: `hsl(${hueAlt.toFixed(0)} ${mix(8, 46, t).toFixed(0)}% ${mix(42, 74, t).toFixed(0)}%)`,
    bead: `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}%)`,
    paterBead: `hsl(${hueAlt.toFixed(0)} ${(sat + 12).toFixed(0)}% ${(light + 10).toFixed(0)}%)`,
    accent: `hsl(${((hue + 6) % 360).toFixed(0)} ${mix(46, 86, t).toFixed(0)}% ${mix(68, 78, t).toFixed(0)}%)`,
    glow: `hsl(${hue.toFixed(0)} ${mix(30, 80, t).toFixed(0)}% ${mix(40, 62, t).toFixed(0)}% / ${(0.1 + luminosity * 0.32).toFixed(3)})`,
    ink: `hsl(${((hue + 40) % 360).toFixed(0)} 24% 92%)`,
  };
}

export function bloomFrom(stats: Stats, userId: string): Bloom {
  const { stage, next } = stageFor(stats.totalDecades);
  const seed = seedFrom(userId);
  const { hue: baseHue, hueAlt, spread } = blendHue(stats.bySet);

  // A small, stable per-user rotation keeps two rosaries from looking identical.
  const hue = (baseHue + (seed - 0.5) * 22 + 360) % 360;

  const span = next ? next.threshold - stage.threshold : 1;
  const toNext = next ? Math.min(1, (stats.totalDecades - stage.threshold) / span) : 1;

  const luminosity = Math.min(
    1,
    stage.index / (STAGES.length - 1) + Math.min(stats.currentStreak, 30) / 90,
  );

  return {
    stage,
    nextStage: next,
    toNext,
    decadesToNext: next ? Math.max(0, next.threshold - stats.totalDecades) : 0,
    seed,
    palette: paletteFor(stage.index, hue, hueAlt, luminosity),
    petals:
      stage.index === 0
        ? 0
        : Math.round(mix(5, 24, stage.index / (STAGES.length - 1)) + spread * 6),
    rays: stage.index >= 5 ? Math.round(mix(12, 36, toNext)) : stage.index >= 3 ? 8 : 0,
    stars: Math.min(24, stats.currentStreak),
    luminosity,
    filigree: stage.index >= 2,
    faceted: stage.index >= 6,
    halo: stage.index >= 4,
    hue,
    hueAlt,
  };
}
