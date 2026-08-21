import type { Lang } from '@/lib/i18n/config';

/**
 * The gospel read at Mass today.
 *
 * French comes from AELF, which publishes the texts actually used in France —
 * the reference, the title the lectionary gives it, and the passage itself.
 * English has no equivalent open source, so the reference is taken from AELF
 * (the Roman lectionary is the same either way) and the passage is fetched from
 * the World English Bible, which is in the public domain.
 *
 * Both are quoted, so both are credited: the card says where the words come
 * from, and the pure parts of this file are separated from the fetching so they
 * can be tested without a network.
 */

export type Gospel = {
  /** The day, as YYYY-MM-DD. */
  date: string;
  /** "Mt 22, 34-40" in French, "Matthew 22:34-40" in English. */
  reference: string;
  /** "Évangile de Jésus Christ selon saint Matthieu". */
  intro: string | null;
  /** The line the lectionary puts above the passage. French only. */
  title: string | null;
  /** The passage, one entry per paragraph, newlines kept inside each. */
  paragraphs: string[];
  /** What the Church celebrates today. French only — AELF names it in French. */
  feast: string | null;
  /** Who the words belong to. */
  credit: string;
};

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&laquo;': '«',
  '&raquo;': '»',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&rsquo;': '’',
  '&lsquo;': '‘',
};

export function decodeEntities(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&[a-z]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);
}

/**
 * AELF sends the passage as HTML: paragraphs, line breaks where the lectionary
 * breaks its lines, and emphasis on the words of scripture being quoted. The
 * line breaks are worth keeping — they are how the text is meant to be read
 * aloud — so they become newlines rather than being flattened away.
 */
export function textFromHtml(html: string): string[] {
  return html
    .split(/<\/p>/i)
    .map((block) =>
      decodeEntities(
        block
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/\r/g, ''),
      )
        .split('\n')
        // The source indents its lines with spaces; the layout is ours to make.
        .map((line) => line.trim())
        // Every break is written `<br />` followed by a real newline, so a
        // naive conversion doubles it and the whole passage comes out
        // double-spaced. Within a paragraph a blank line means nothing anyway —
        // AELF separates its stanzas with `</p>`.
        .filter((line) => line.length > 0)
        .join('\n'),
    )
    .filter((block) => block.length > 0);
}

const GOSPEL_BOOKS: Record<string, string> = {
  Mt: 'Matthew',
  Mc: 'Mark',
  Lc: 'Luke',
  Jn: 'John',
};

/**
 * "Mt 22, 34-40" becomes "Matthew 22:34-40", which is how the English text is
 * addressed. The lectionary also splits a reading across verses — "Mc 7, 1-8.
 * 14-15.21-23" — and marks half-verses with a letter, "Lc 9, 28b-36"; neither
 * survives the trip, so the ranges are joined with commas and the letters
 * dropped, which widens the passage by at most half a verse.
 */
export function toEnglishReference(french: string): string | null {
  const match = /^\s*(Mt|Mc|Lc|Jn)\s+(\d+)\s*,\s*(.+?)\s*$/.exec(french);
  if (!match) return null;

  const book = GOSPEL_BOOKS[match[1]];
  if (!book) return null;

  const verses = match[3]
    .replace(/[a-z]/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, ',')
    .replace(/,+/g, ',')
    .replace(/^,|,$/g, '');

  if (!/^[\d,-]+$/.test(verses) || verses.length === 0) return null;
  return `${book} ${match[2]}:${verses}`;
}

type AelfReading = {
  type?: string;
  ref?: string;
  titre?: string | null;
  contenu?: string;
  intro_lue?: string | null;
};

type AelfResponse = {
  informations?: { ligne2?: string | null; ligne1?: string | null };
  messes?: { lectures?: AelfReading[] }[];
};

/** The gospel among the day's readings, or null if the day carries none. */
export function gospelFromAelf(payload: AelfResponse, date: string): Gospel | null {
  for (const mass of payload.messes ?? []) {
    for (const reading of mass.lectures ?? []) {
      if (reading.type !== 'evangile' || !reading.contenu || !reading.ref) continue;
      const paragraphs = textFromHtml(reading.contenu);
      if (paragraphs.length === 0) continue;
      return {
        date,
        reference: reading.ref,
        intro: reading.intro_lue ?? null,
        title: reading.titre ?? null,
        paragraphs,
        feast: payload.informations?.ligne2 || payload.informations?.ligne1 || null,
        credit: 'AELF',
      };
    }
  }
  return null;
}

type BibleApiResponse = { reference?: string; verses?: { text?: string }[] };

export function gospelFromBibleApi(
  payload: BibleApiResponse,
  source: Gospel,
): Gospel | null {
  const verses = (payload.verses ?? [])
    .map((verse) => (verse.text ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (verses.length === 0) return null;

  return {
    date: source.date,
    reference: payload.reference ?? source.reference,
    // The lectionary's own heading is in French; the reference speaks for itself.
    intro: null,
    title: null,
    paragraphs: [verses.join(' ')],
    feast: null,
    credit: 'World English Bible',
  };
}

const AELF = 'https://api.aelf.org/v1/messes';
const BIBLE = 'https://bible-api.com';

/** Six hours: the readings change at midnight and never within a day. */
const REVALIDATE = 6 * 60 * 60;

async function getJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      // Never let a slow third party hold up a page of prayers.
      signal: AbortSignal.timeout(4000),
      next: { revalidate: REVALIDATE },
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    // Offline, timed out, rate limited — the card simply does not appear.
    return null;
  }
}

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function fetchGospel(date: string, lang: Lang): Promise<Gospel | null> {
  const payload = await getJson(`${AELF}/${date}/france`);
  if (!payload) return null;

  const french = gospelFromAelf(payload as AelfResponse, date);
  if (!french || lang === 'fr') return french;

  const reference = toEnglishReference(french.reference);
  if (!reference) return null;

  const english = await getJson(`${BIBLE}/${encodeURIComponent(reference)}`);
  if (!english) return null;

  return gospelFromBibleApi(english as BibleApiResponse, french);
}
