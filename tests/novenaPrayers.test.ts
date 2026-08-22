import { describe, expect, it } from 'vitest';
import { NOVENA_PRAYERS, novenaOrder, novenaPrayer } from '@/lib/rosary/novenaPrayers';
import { PRAYERS } from '@/lib/rosary/prayers';
import { NOVENA_DAYS, NOVENA_KEYS } from '@/lib/rosary/novenas';

describe('the words of each novena', () => {
  it('gives one to every novena offered, in both languages', () => {
    // A novena without its prayer cannot be prayed, which is the whole point.
    for (const key of NOVENA_KEYS) {
      const prayer = novenaPrayer(key);
      expect(prayer, key).not.toBeNull();
      for (const lang of ['fr', 'en'] as const) {
        expect(prayer!.daily[lang].length, `${key}.${lang}`).toBeGreaterThan(0);
        for (const paragraph of prayer!.daily[lang]) {
          expect(paragraph.trim()).toBe(paragraph);
          expect(paragraph.length, `${key}.${lang}`).toBeGreaterThan(40);
        }
      }
    }
  });

  it('carries no prayer for a novena that does not exist', () => {
    expect(Object.keys(NOVENA_PRAYERS).sort()).toEqual([...NOVENA_KEYS].sort());
    expect(novenaPrayer('gibberish')).toBeNull();
  });

  it('closes each one properly', () => {
    for (const key of NOVENA_KEYS) {
      const prayer = novenaPrayer(key)!;
      expect(prayer.daily.fr.join(' '), key).toContain('Amen');
      expect(prayer.daily.en.join(' '), key).toContain('Amen');
    }
  });

  it('gives the Divine Mercy novena nine intentions, one per day', () => {
    // Christ asked St Faustina for a different company of souls each day; it
    // is the one novena whose shape changes as it goes.
    const mercy = novenaPrayer('mercy')!;
    expect(mercy.eachDay).toBeDefined();
    for (const lang of ['fr', 'en'] as const) {
      expect(mercy.eachDay![lang]).toHaveLength(NOVENA_DAYS);
      expect(new Set(mercy.eachDay![lang]).size).toBe(NOVENA_DAYS);
    }
  });

  it('gives every set of daily intentions exactly nine, never eight or ten', () => {
    for (const [key, prayer] of Object.entries(NOVENA_PRAYERS)) {
      if (!prayer.eachDay) continue;
      for (const lang of ['fr', 'en'] as const) {
        expect(prayer.eachDay[lang], `${key}.${lang}`).toHaveLength(NOVENA_DAYS);
      }
    }
  });

  it('says something different in each language', () => {
    for (const key of NOVENA_KEYS) {
      const prayer = novenaPrayer(key)!;
      expect(prayer.daily.fr.join(' '), key).not.toBe(prayer.daily.en.join(' '));
    }
  });
});

const LABELS = {
  opening: 'Ouverture',
  intention: 'Intention',
  prayer: 'Prière',
  closing: 'Pour finir',
};

describe('a day of a novena, in order', () => {
  it('opens and closes every one of them, in both languages', () => {
    for (const key of NOVENA_KEYS) {
      const prayer = novenaPrayer(key)!;
      for (const lang of ['fr', 'en'] as const) {
        for (const part of [prayer.opening[lang], prayer.closing[lang]]) {
          expect(part.length, `${key}.${lang}`).toBeGreaterThan(0);
          for (const line of part) {
            expect(line.trim()).toBe(line);
            expect(line.length, `${key}.${lang}`).toBeGreaterThan(20);
          }
        }
      }
    }
  });

  it('writes the common prayers out where they are said, rather than naming them', () => {
    // A novena that says "then an Our Father" cannot be prayed from the screen,
    // which is the one thing this page is for.
    for (const key of NOVENA_KEYS) {
      for (const lang of ['fr', 'en'] as const) {
        const said = novenaOrder(key, lang, 1, LABELS)
          .flatMap((step) => step.lines)
          .join(' ');
        for (const common of ['ourFather', 'hailMary', 'gloryBe'] as const) {
          for (const paragraph of PRAYERS[common].text[lang]) {
            expect(said, `${key}.${lang}.${common}`).toContain(paragraph);
          }
        }
      }
    }
  });

  it('runs from the sign of the cross to the novena\'s own last word', () => {
    const steps = novenaOrder('carmel', 'fr', 1, LABELS);
    expect(steps.map((step) => step.id)).toEqual([
      'signOfTheCross',
      'opening',
      'daily',
      'ourFather',
      'hailMary',
      'gloryBe',
      'closing',
    ]);
  });

  it('slots the day\'s intention in before the prayer, and changes it daily', () => {
    const third = novenaOrder('mercy', 'fr', 3, LABELS);
    const ids = third.map((step) => step.id);
    expect(ids.indexOf('intention')).toBeGreaterThan(ids.indexOf('opening'));
    expect(ids.indexOf('intention')).toBeLessThan(ids.indexOf('daily'));

    const eighth = novenaOrder('mercy', 'fr', 8, LABELS);
    const intentionOf = (steps: typeof third) =>
      steps.find((step) => step.id === 'intention')!.lines[0];
    expect(intentionOf(third)).not.toBe(intentionOf(eighth));
  });

  it('holds a day outside the nine to one of them, rather than losing the words', () => {
    // A novena is looked at the day after it ends as often as during it.
    const first = novenaOrder('mercy', 'fr', 1, LABELS);
    expect(novenaOrder('mercy', 'fr', 0, LABELS)).toEqual(first);
    const ninth = novenaOrder('mercy', 'fr', NOVENA_DAYS, LABELS);
    expect(novenaOrder('mercy', 'fr', NOVENA_DAYS + 1, LABELS)).toEqual(ninth);
  });

  it('has nothing to say for a novena that does not exist', () => {
    expect(novenaOrder('gibberish', 'fr', 1, LABELS)).toEqual([]);
  });
});
