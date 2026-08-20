import { describe, expect, it } from 'vitest';
import {
  MYSTERY_SETS,
  MYSTERY_SET_ORDER,
  mysterySetForDate,
} from '@/lib/rosary/mysteries';
import {
  HAIL_MARY,
  HAIL_MARY_VARIANTS,
  isHailMaryVariant,
  prayerWith,
  PRAYERS,
} from '@/lib/rosary/prayers';
import { LANGS } from '@/lib/i18n/config';

describe('the cycle of mysteries', () => {
  // Monday & Saturday joyful, Tuesday & Friday sorrowful,
  // Wednesday & Sunday glorious, Thursday luminous.
  const expected: Record<number, string> = {
    0: 'glorious',
    1: 'joyful',
    2: 'sorrowful',
    3: 'glorious',
    4: 'luminous',
    5: 'sorrowful',
    6: 'joyful',
  };

  it('assigns every day of the week', () => {
    // 2026-08-16 is a Sunday.
    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(2026, 7, 16 + offset, 12);
      expect(mysterySetForDate(date)).toBe(expected[date.getDay()]);
    }
  });

  it('covers the seven days exactly once', () => {
    const days = MYSTERY_SET_ORDER.flatMap((id) => MYSTERY_SETS[id].days).sort();
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('has five mysteries in each set, numbered in order', () => {
    for (const id of MYSTERY_SET_ORDER) {
      const set = MYSTERY_SETS[id];
      expect(set.mysteries).toHaveLength(5);
      expect(set.mysteries.map((m) => m.index)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('is translated into every supported language', () => {
    for (const id of MYSTERY_SET_ORDER) {
      for (const lang of LANGS) {
        expect(MYSTERY_SETS[id].name[lang]).toBeTruthy();
        for (const mystery of MYSTERY_SETS[id].mysteries) {
          expect(mystery.title[lang]).toBeTruthy();
          expect(mystery.scripture[lang]).toBeTruthy();
          expect(mystery.meditation[lang].length).toBeGreaterThan(40);
          expect(mystery.fruit[lang]).toBeTruthy();
        }
      }
    }
  });
});

describe('prayers', () => {
  it('carries a title and a body in every language', () => {
    for (const prayer of Object.values(PRAYERS)) {
      for (const lang of LANGS) {
        expect(prayer.title[lang]).toBeTruthy();
        expect(prayer.text[lang].length).toBeGreaterThan(0);
        for (const paragraph of prayer.text[lang]) expect(paragraph.trim()).toBeTruthy();
      }
    }
  });

  it('uses the 2017 French translation of the Our Father', () => {
    expect(PRAYERS.ourFather.text.fr.join(' ')).toContain(
      'ne nous laisse pas entrer en tentation',
    );
  });
});

describe('the wordings of the Hail Mary', () => {
  it('offers every variant in both languages, in two parts', () => {
    for (const variant of HAIL_MARY_VARIANTS) {
      const wording = HAIL_MARY[variant];
      for (const lang of ['fr', 'en'] as const) {
        expect(wording.text[lang]).toHaveLength(2);
        expect(wording.title[lang].length).toBeGreaterThan(0);
        expect(wording.name[lang].length).toBeGreaterThan(0);
        for (const paragraph of wording.text[lang]) {
          expect(paragraph.trim()).toBe(paragraph);
          expect(paragraph.length).toBeGreaterThan(20);
        }
      }
    }
  });

  it('keeps the salutation and the petition in every wording', () => {
    // Whatever the words, both halves of the prayer have to be there: the
    // greeting of Luke 1, and the asking of the Church.
    for (const variant of HAIL_MARY_VARIANTS) {
      const fr = HAIL_MARY[variant].text.fr;
      expect(fr[0]).toMatch(/Marie|Maria/);
      expect(fr[1]).toMatch(/mort|mortis/);
    }
  });

  it('says vous in the traditional French and tu in the contemporary', () => {
    expect(HAIL_MARY.traditional.text.fr[0]).toContain('Je vous salue');
    expect(HAIL_MARY.traditional.text.fr[1]).toContain('priez pour nous');
    expect(HAIL_MARY.contemporary.text.fr[0]).toContain('Je te salue');
    expect(HAIL_MARY.contemporary.text.fr[1]).toContain('prie pour nous');
  });

  it('gives the same Latin whichever language is set', () => {
    expect(HAIL_MARY.latin.text.fr).toEqual(HAIL_MARY.latin.text.en);
    expect(HAIL_MARY.latin.text.fr[0]).toContain('Ave Maria, gratia plena');
  });

  it('applies the choice to the Hail Mary and to nothing else', () => {
    expect(prayerWith('hailMary', 'latin').text.fr[0]).toContain('Ave Maria');
    expect(prayerWith('hailMary', 'contemporary').text.fr[0]).toContain('Je te salue');
    expect(prayerWith('ourFather', 'latin')).toBe(PRAYERS.ourFather);
    expect(prayerWith('creed', 'contemporary')).toBe(PRAYERS.creed);
  });

  it('falls back to the traditional wording when asked for nonsense', () => {
    const rogue = 'gibberish' as unknown as Parameters<typeof prayerWith>[1];
    expect(prayerWith('hailMary', rogue).text.fr).toEqual(HAIL_MARY.traditional.text.fr);
    expect(isHailMaryVariant('gibberish')).toBe(false);
    expect(isHailMaryVariant('latin')).toBe(true);
  });
});
