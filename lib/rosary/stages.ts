import type { Lang } from '@/lib/i18n/config';

/**
 * The ladder of stages, and the degrees inside each one.
 *
 * It does not end. Sixteen stages are named, which covers about twenty years of
 * a chaplet a day; past those the ladder keeps building itself from a rule, so
 * there is always a next name and a next number. Nobody will see the far end,
 * but nobody will hit a wall either — which is the point.
 *
 * Inside every stage are five degrees, so something moves every few decades
 * rather than every few hundred. The stage is what you are; the degree is what
 * you are doing this week.
 */

export type Stage = {
  index: number;
  key: string;
  name: Record<Lang, string>;
  /** Completed decades needed to reach this stage. */
  threshold: number;
  /** One line of encouragement shown under the artwork. */
  note: Record<Lang, string>;
};

/** Degrees in every stage. Five, like the decades of a chaplet. */
export const DEGREES_PER_STAGE = 5;

const NAMED: Omit<Stage, 'index'>[] = [
  {
    key: 'seed',
    name: { fr: 'Semence', en: 'Seed' },
    threshold: 0,
    note: {
      fr: 'Tout commence par une dizaine. Votre rosaire est encore nu.',
      en: 'Everything begins with one decade. Your rosary is still bare.',
    },
  },
  {
    key: 'bud',
    name: { fr: 'Éclosion', en: 'Budding' },
    threshold: 5,
    note: {
      fr: 'Un premier chapelet. Les grains prennent leur couleur.',
      en: 'A first chaplet. The beads take on their colour.',
    },
  },
  {
    key: 'rose',
    name: { fr: 'Rosier', en: 'Rosebush' },
    threshold: 25,
    note: {
      fr: 'Les premières roses s’ouvrent autour de la chaîne.',
      en: 'The first roses open around the chain.',
    },
  },
  {
    key: 'bloom',
    name: { fr: 'Floraison', en: 'Blossom' },
    threshold: 60,
    note: {
      fr: 'La prière est devenue une habitude. La couronne s’épaissit.',
      en: 'Prayer has become a habit. The crown thickens.',
    },
  },
  {
    key: 'garden',
    name: { fr: 'Jardin', en: 'Garden' },
    threshold: 120,
    note: {
      fr: 'Un jardin clos, patiemment cultivé, dizaine après dizaine.',
      en: 'An enclosed garden, patiently tended, decade after decade.',
    },
  },
  {
    key: 'dawn',
    name: { fr: 'Aurore', en: 'Aurora' },
    threshold: 250,
    note: {
      fr: 'La lumière traverse maintenant tout le rosaire.',
      en: 'Light now passes through the whole rosary.',
    },
  },
  {
    key: 'glass',
    name: { fr: 'Vitrail', en: 'Stained Glass' },
    threshold: 500,
    note: {
      fr: 'Chaque grain est devenu une pièce de verre coloré.',
      en: 'Every bead has become a piece of coloured glass.',
    },
  },
  {
    key: 'crown',
    name: { fr: 'Couronne', en: 'Crown' },
    threshold: 1000,
    note: {
      fr: 'Mille dizaines. La couronne est achevée — et elle continue.',
      en: 'A thousand decades. The crown is complete — and it goes on.',
    },
  },
  {
    key: 'psalter',
    name: { fr: 'Psautier', en: 'Psalter' },
    threshold: 1750,
    note: {
      fr: 'Le psautier de Marie, repris et repris, jusqu’à le savoir par cœur.',
      en: 'Mary’s psalter, taken up again and again, until you know it by heart.',
    },
  },
  {
    key: 'litany',
    name: { fr: 'Litanie', en: 'Litany' },
    threshold: 2750,
    note: {
      fr: 'Les titres s’ajoutent aux titres. La prière devient une litanie.',
      en: 'Title upon title. The prayer has become a litany.',
    },
  },
  {
    key: 'chapel',
    name: { fr: 'Chapelle', en: 'Chapel' },
    threshold: 4000,
    note: {
      fr: 'Ce que vous avez prié tient maintenant debout, comme un lieu.',
      en: 'What you have prayed now stands up, like a place.',
    },
  },
  {
    key: 'cloister',
    name: { fr: 'Cloître', en: 'Cloister' },
    threshold: 6000,
    note: {
      fr: 'Un tour, puis un autre. Le cloître se marche sans y penser.',
      en: 'One turn, then another. The cloister is walked without thinking.',
    },
  },
  {
    key: 'cathedral',
    name: { fr: 'Cathédrale', en: 'Cathedral' },
    threshold: 9000,
    note: {
      fr: 'On ne bâtit pas cela en une vie. Vous en êtes pourtant là.',
      en: 'This is not built in one lifetime. You are here all the same.',
    },
  },
  {
    key: 'constellation',
    name: { fr: 'Constellation', en: 'Constellation' },
    threshold: 14000,
    note: {
      fr: 'Chaque dizaine est une étoile ; ensemble elles dessinent une figure.',
      en: 'Every decade a star; together they draw a figure.',
    },
  },
  {
    key: 'firmament',
    name: { fr: 'Firmament', en: 'Firmament' },
    threshold: 22000,
    note: {
      fr: 'Le ciel entier, tenu par une chaîne de grains.',
      en: 'The whole sky, held by a chain of beads.',
    },
  },
  {
    key: 'empyrean',
    name: { fr: 'Empyrée', en: 'Empyrean' },
    threshold: 35000,
    note: {
      fr: 'Au-delà, on ne compte plus. On prie, simplement.',
      en: 'Beyond this, nobody counts. One simply prays.',
    },
  },
];

/** How many stages carry a name of their own. */
export const NAMED_STAGES = NAMED.length;

/**
 * Past the named ladder the names come from here, cycled, with the turn of the
 * cycle appended. Eight words that can be said of prayer at any depth, so the
 * hundredth stage reads as a stage rather than as a number.
 */
const ENDLESS: { key: string; name: Record<Lang, string> }[] = [
  { key: 'light', name: { fr: 'Lumière', en: 'Light' } },
  { key: 'silence', name: { fr: 'Silence', en: 'Silence' } },
  { key: 'praise', name: { fr: 'Louange', en: 'Praise' } },
  { key: 'offering', name: { fr: 'Offrande', en: 'Offering' } },
  { key: 'vigil', name: { fr: 'Veille', en: 'Vigil' } },
  { key: 'covenant', name: { fr: 'Alliance', en: 'Covenant' } },
  { key: 'spring', name: { fr: 'Fontaine', en: 'Fountain' } },
  { key: 'daybreak', name: { fr: 'Aube', en: 'Daybreak' } },
];

const ENDLESS_NOTE: Record<Lang, string> = {
  fr: 'Il n’y a plus de dernière étape. Il y a la suivante.',
  en: 'There is no last stage any more. There is the next one.',
};

/** Each stage past the named ones is this much further than the one before. */
const ENDLESS_RATIO = 1.55;

const NUMERALS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** Roman up to 3999, plain digits past it — where Rome itself gave up. */
export function roman(value: number): string {
  if (!Number.isFinite(value) || value < 1) return '';
  if (value > 3999) return String(Math.floor(value));
  let left = Math.floor(value);
  let out = '';
  for (const [amount, symbol] of NUMERALS) {
    while (left >= amount) {
      out += symbol;
      left -= amount;
    }
  }
  return out;
}

/** Rounded so the number on the card reads as a milestone, not a measurement. */
function tidy(value: number): number {
  if (value < 100) return Math.round(value);
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

/** Decades needed for the stage at this index. Defined for every index. */
export function thresholdAt(index: number): number {
  if (index <= 0) return 0;
  if (index < NAMED_STAGES) return NAMED[index].threshold;
  const last = NAMED[NAMED_STAGES - 1].threshold;
  return tidy(last * ENDLESS_RATIO ** (index - NAMED_STAGES + 1));
}

/** The stage at this index — named while there are names, built after that. */
export function stageAt(index: number): Stage {
  const at = Math.max(0, Math.floor(index));
  if (at < NAMED_STAGES) return { index: at, ...NAMED[at] };

  const beyond = at - NAMED_STAGES;
  const word = ENDLESS[beyond % ENDLESS.length];
  const turn = Math.floor(beyond / ENDLESS.length) + 1;
  const suffix = turn > 1 ? ` ${roman(turn)}` : '';

  return {
    index: at,
    key: `${word.key}-${turn}`,
    name: { fr: `${word.name.fr}${suffix}`, en: `${word.name.en}${suffix}` },
    threshold: thresholdAt(at),
    note: ENDLESS_NOTE,
  };
}

/**
 * The first sixteen, for anything that wants to show the ladder itself. The
 * ladder does not stop here — `stageAt` keeps going — but a list has to.
 */
export const STAGES: Stage[] = Array.from({ length: NAMED_STAGES }, (_, i) => stageAt(i));

/** Which stage a number of decades falls in, and the one after it. */
export function stageFor(decades: number): { stage: Stage; next: Stage } {
  const prayed = Math.max(0, Math.floor(decades));

  // Walk up while the next stage is already reached. Bounded by the ratio:
  // even a million decades is only a few dozen steps past the named ladder.
  let index = 0;
  while (thresholdAt(index + 1) <= prayed) index++;

  return { stage: stageAt(index), next: stageAt(index + 1) };
}

export type Degree = {
  /** 1-based within the stage. */
  index: number;
  /** How many degrees the stage holds. */
  of: number;
  /** Decades at which this degree began. */
  from: number;
  /** Decades at which the next one begins. */
  to: number;
  /** Still to pray before the next degree. */
  remaining: number;
  /** 0 → 1 through this degree. */
  progress: number;
};

/**
 * Where inside the stage this many decades falls. Degrees are spaced evenly
 * across the stage, so the early stages tick over every decade or two and the
 * late ones still move several times before the name changes.
 */
export function degreeFor(decades: number): Degree {
  const prayed = Math.max(0, Math.floor(decades));
  const { stage, next } = stageFor(prayed);

  const span = next.threshold - stage.threshold;
  const each = span / DEGREES_PER_STAGE;

  const into = prayed - stage.threshold;
  const index = Math.min(DEGREES_PER_STAGE, Math.floor(into / each) + 1);
  const from = stage.threshold + (index - 1) * each;
  const to = stage.threshold + index * each;

  return {
    index,
    of: DEGREES_PER_STAGE,
    from: Math.round(from),
    to: Math.round(to),
    remaining: Math.max(0, Math.ceil(to) - prayed),
    progress: to === from ? 1 : Math.min(1, Math.max(0, (prayed - from) / (to - from))),
  };
}

/**
 * How far along the whole ladder, for the colour. It saturates at the last
 * named stage: past there the palette has nowhere richer to go, and a rosary
 * should not keep darkening for ever.
 */
export function stageTone(index: number): number {
  return Math.min(1, index / (NAMED_STAGES - 1));
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/**
 * A threshold as it should be read.
 *
 * Plain up to a million, compact up to a thousand billion, and powers of ten
 * beyond that — because Intl's compact notation runs out of names around there
 * and starts printing the whole number followed by a unit, which is how
 * "2 600 000 000 000 000 000 000 000 000 000 Bn" ends up on a row.
 */
export function formatThreshold(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return '∞';
  if (value < 1_000_000) return new Intl.NumberFormat(lang).format(value);
  if (value < 1e12) {
    return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(
      value,
    );
  }

  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  const digits = String(exponent)
    .split('')
    .map((d) => SUPERSCRIPT[Number(d)] ?? d)
    .join('');
  const lead = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(mantissa);
  return `${lead} × 10${digits}`;
}

/** A slice of the ladder around a stage, for showing where you are on it. */
export function stageWindow(index: number, before = 1, after = 3): Stage[] {
  // Near the bottom there is nothing behind to show, so the window slides
  // forward rather than shrinking: the same number of rungs, always.
  const first = Math.max(0, Math.floor(index) - before);
  return Array.from({ length: before + after + 1 }, (_, i) => stageAt(first + i));
}
