import type { Lang } from '@/lib/i18n/config';

/**
 * The novenas, and when each one begins.
 *
 * A novena is nine days of prayer in preparation for a feast, ending the day
 * before it. That single rule fixes every one of them, so none of this is a
 * hand-kept calendar that goes stale: give it a year and it works out the days,
 * including the ones that move with Easter — Divine Mercy, the Holy Spirit
 * between Ascension and Pentecost, the Sacred Heart.
 *
 * Dates are UTC day keys, YYYY-MM-DD, which is how a day of prayer is recorded
 * everywhere else in the app.
 */

export const NOVENA_DAYS = 9;

const DAY = 86_400_000;

export type Novena = {
  key: string;
  name: Record<Lang, string>;
  /** What it is for, in one line. */
  about: Record<Lang, string>;
  /** The feast it prepares for, as a day key. */
  feast: string;
  /** First of the nine days. */
  start: string;
  /** Ninth day — the day before the feast. */
  end: string;
  /** The year the feast falls in, which is what makes an occurrence unique. */
  year: number;
};

function keyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fixed(year: number, month: number, day: number): string {
  return keyOf(new Date(Date.UTC(year, month - 1, day)));
}

export function shiftDays(key: string, days: number): string {
  return keyOf(new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

/**
 * Easter Sunday, by the Gregorian computus (Meeus/Jones/Butcher). Everything
 * that moves in the year hangs off this one date.
 */
export function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return fixed(year, month, day);
}

type Spec = {
  key: string;
  name: Record<Lang, string>;
  about: Record<Lang, string>;
  /** The feast, given the year. */
  feast: (year: number) => string;
};

/**
 * The thirteen that are actually prayed, spread across the year. Marian ones
 * first, since this is a rosary, then the others the Church keeps.
 */
const SPECS: Spec[] = [
  {
    key: 'lourdes',
    name: { fr: 'Notre-Dame de Lourdes', en: 'Our Lady of Lourdes' },
    about: {
      fr: 'Pour les malades, avec celle qui s’est montrée à Bernadette.',
      en: 'For the sick, with the one who appeared to Bernadette.',
    },
    feast: (y) => fixed(y, 2, 11),
  },
  {
    key: 'joseph',
    name: { fr: 'Saint Joseph', en: 'Saint Joseph' },
    about: {
      fr: 'Pour le travail, la famille, et les choses qu’on porte en silence.',
      en: 'For work, for family, and for what is carried in silence.',
    },
    feast: (y) => fixed(y, 3, 19),
  },
  {
    key: 'annunciation',
    name: { fr: 'L’Annonciation', en: 'The Annunciation' },
    about: {
      fr: 'Neuf jours pour apprendre à dire oui.',
      en: 'Nine days to learn how to say yes.',
    },
    feast: (y) => fixed(y, 3, 25),
  },
  {
    key: 'mercy',
    name: { fr: 'La Divine Miséricorde', en: 'Divine Mercy' },
    about: {
      fr: 'Du Vendredi saint au dimanche de la Miséricorde, comme il fut demandé.',
      en: 'From Good Friday to Divine Mercy Sunday, as it was asked for.',
    },
    feast: (y) => shiftDays(easter(y), 7),
  },
  {
    key: 'fatima',
    name: { fr: 'Notre-Dame de Fatima', en: 'Our Lady of Fátima' },
    about: {
      fr: 'Pour la paix — c’est ce qu’elle a demandé, le rosaire à la main.',
      en: 'For peace — what she asked for, rosary in hand.',
    },
    feast: (y) => fixed(y, 5, 13),
  },
  {
    key: 'spirit',
    name: { fr: 'L’Esprit Saint', en: 'The Holy Spirit' },
    about: {
      fr: 'La plus ancienne : les neuf jours entre l’Ascension et la Pentecôte.',
      en: 'The oldest of them: the nine days between Ascension and Pentecost.',
    },
    feast: (y) => shiftDays(easter(y), 49),
  },
  {
    key: 'sacred-heart',
    name: { fr: 'Le Sacré-Cœur', en: 'The Sacred Heart' },
    about: {
      fr: 'Neuf jours auprès d’un cœur qui n’a rien gardé pour lui.',
      en: 'Nine days beside a heart that kept nothing back.',
    },
    feast: (y) => shiftDays(easter(y), 68),
  },
  {
    key: 'carmel',
    name: { fr: 'Notre-Dame du Mont-Carmel', en: 'Our Lady of Mount Carmel' },
    about: {
      fr: 'La neuvaine du scapulaire, portée par les carmes depuis huit siècles.',
      en: 'The scapular novena, carried by the Carmelites for eight centuries.',
    },
    feast: (y) => fixed(y, 7, 16),
  },
  {
    key: 'assumption',
    name: { fr: 'L’Assomption', en: 'The Assumption' },
    about: {
      fr: 'Neuf jours d’été vers le 15 août, la grande fête de Marie.',
      en: 'Nine summer days towards the fifteenth of August, Mary’s great feast.',
    },
    feast: (y) => fixed(y, 8, 15),
  },
  {
    key: 'sorrows',
    name: { fr: 'Notre-Dame des Douleurs', en: 'Our Lady of Sorrows' },
    about: {
      fr: 'Pour ce qui fait mal et qu’on ne sait pas dire.',
      en: 'For what hurts and cannot be put into words.',
    },
    feast: (y) => fixed(y, 9, 15),
  },
  {
    key: 'rosary',
    name: { fr: 'Notre-Dame du Rosaire', en: 'Our Lady of the Rosary' },
    about: {
      fr: 'La fête du rosaire lui-même. Neuf jours pour la préparer.',
      en: 'The feast of the rosary itself. Nine days to make ready for it.',
    },
    feast: (y) => fixed(y, 10, 7),
  },
  {
    key: 'immaculate',
    name: { fr: 'L’Immaculée Conception', en: 'The Immaculate Conception' },
    about: {
      fr: 'Neuf jours vers le 8 décembre, dans les lumières de Lyon.',
      en: 'Nine days towards the eighth of December.',
    },
    feast: (y) => fixed(y, 12, 8),
  },
  {
    key: 'christmas',
    name: { fr: 'Noël', en: 'Christmas' },
    about: {
      fr: 'Du 16 au 24 décembre, la neuvaine que tout le monde connaît.',
      en: 'The sixteenth to the twenty-fourth of December — the one everybody knows.',
    },
    feast: (y) => fixed(y, 12, 25),
  },
];

export const NOVENA_KEYS: string[] = SPECS.map((spec) => spec.key);

function occurrence(spec: Spec, year: number): Novena {
  const feast = spec.feast(year);
  // Nine days ending the day before the feast. That one rule fixes them all,
  // the moveable ones included.
  const start = shiftDays(feast, -NOVENA_DAYS);
  return {
    key: spec.key,
    name: spec.name,
    about: spec.about,
    feast,
    start,
    end: shiftDays(feast, -1),
    year,
  };
}

/** Every novena of a given year, in the order they fall. */
export function novenasIn(year: number): Novena[] {
  return SPECS.map((spec) => occurrence(spec, year)).sort((a, b) => a.start.localeCompare(b.start));
}

export function novenaByKey(key: string, year: number): Novena | null {
  const spec = SPECS.find((s) => s.key === key);
  return spec ? occurrence(spec, year) : null;
}

export type NovenaState = {
  /** Running today, if one is. */
  active: Novena | null;
  /** The next one to begin, whenever that is. */
  next: Novena | null;
  /** 1 → 9 on an active novena, otherwise 0. */
  day: number;
  /** Days until the next one opens. */
  until: number;
};

/**
 * Where the year stands today. Two years either side are considered, because a
 * novena that runs through the turn of the year still belongs to its feast.
 */
export function novenaState(today: string): NovenaState {
  const year = Number(today.slice(0, 4));
  const all = [year - 1, year, year + 1]
    .flatMap((y) => novenasIn(y))
    .sort((a, b) => a.start.localeCompare(b.start));

  // Some genuinely overlap — Saint Joseph on the nineteenth of March and the
  // Annunciation on the twenty-fifth leave only six days between them, so
  // three of their nine are shared. When that happens the one shown is the one
  // whose feast comes first: it is the one about to conclude. The other takes
  // over of its own accord once this one ends.
  const running = all.filter((n) => n.start <= today && today <= n.end);
  const active = running.sort((a, b) => a.feast.localeCompare(b.feast))[0] ?? null;
  const next = all.find((n) => n.start > today) ?? null;

  return {
    active,
    next,
    day: active ? daysBetween(active.start, today) + 1 : 0,
    until: next ? daysBetween(today, next.start) : 0,
  };
}

/**
 * How many of the nine days were prayed on. A day counts when a rosary was
 * finished on it — the novena is not a separate thing to keep up with, it is
 * the rosary you already pray, nine days running.
 */
export function novenaProgress(
  novena: Novena,
  prayedDays: Iterable<string>,
  today: string,
): { kept: number; days: { key: string; prayed: boolean; ahead: boolean }[] } {
  const prayed = prayedDays instanceof Set ? prayedDays : new Set(prayedDays);
  const days = Array.from({ length: NOVENA_DAYS }, (_, i) => {
    const key = shiftDays(novena.start, i);
    return { key, prayed: prayed.has(key), ahead: key > today };
  });
  return { kept: days.filter((d) => d.prayed).length, days };
}
