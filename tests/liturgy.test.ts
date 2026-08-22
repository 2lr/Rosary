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
  const wordings = HAIL_MARY_VARIANTS.flatMap((v) => HAIL_MARY[v].wordings);

  it('offers every wording in both languages, in two parts', () => {
    for (const variant of HAIL_MARY_VARIANTS) {
      const choice = HAIL_MARY[variant];
      expect(choice.wordings.length).toBeGreaterThan(0);
      for (const lang of ['fr', 'en'] as const) {
        expect(choice.name[lang].length).toBeGreaterThan(0);
        expect(choice.note[lang].length).toBeGreaterThan(0);
      }
    }

    for (const wording of wordings) {
      for (const lang of ['fr', 'en'] as const) {
        expect(wording.text[lang]).toHaveLength(2);
        expect(wording.title[lang].length).toBeGreaterThan(0);
        for (const paragraph of wording.text[lang]) {
          expect(paragraph.trim()).toBe(paragraph);
          expect(paragraph.length).toBeGreaterThan(20);
        }
      }
    }
  });

  it('keeps the salutation and the petition in every wording', () => {
    // Whatever the words, both halves have to be there: the greeting of
    // Luke 1, and the asking of the Church.
    for (const wording of wordings) {
      expect(wording.text.fr[0]).toMatch(/Marie/);
      expect(wording.text.fr[1]).toMatch(/mort/);
      expect(wording.text.en[0]).toMatch(/Mary|grace/);
      expect(wording.text.en[1]).toMatch(/death/);
    }
  });

  it('says vous in the traditional French and tu in every contemporary one', () => {
    expect(HAIL_MARY.traditional.wordings).toHaveLength(1);
    expect(HAIL_MARY.traditional.wordings[0].text.fr[0]).toContain('Je vous salue');
    expect(HAIL_MARY.traditional.wordings[0].text.fr[1]).toContain('priez pour nous');

    for (const wording of HAIL_MARY.contemporary.wordings) {
      expect(wording.text.fr[0]).toMatch(/\btoi\b/);
      expect(wording.text.fr[1]).toContain('prie pour nous');
    }
  });

  it('offers several contemporary renderings, all different', () => {
    const contemporary = HAIL_MARY.contemporary.wordings;
    expect(contemporary.length).toBeGreaterThan(1);
    const french = contemporary.map((w) => w.text.fr.join(' '));
    expect(new Set(french).size).toBe(contemporary.length);
  });

  it('carries no Latin, which cannot be prayed from on a phone', () => {
    expect(isHailMaryVariant('latin')).toBe(false);
    expect(HAIL_MARY_VARIANTS).toEqual(['traditional', 'contemporary']);
    for (const wording of wordings) {
      expect(wording.text.fr.join(' ')).not.toContain('Ave Maria');
      expect(wording.text.en.join(' ')).not.toContain('gratia plena');
    }
  });

  it('changes the contemporary wording from one decade to the next', () => {
    const seen = new Set<string>();
    for (let decade = 1; decade <= 6; decade++) {
      seen.add(prayerWith('hailMary', 'contemporary', decade).text.fr.join(' '));
    }
    expect(seen.size).toBe(HAIL_MARY.contemporary.wordings.length);
  });

  it('keeps the words steady for a given decade, however often it is asked', () => {
    // Re-rendering the same bead must not reshuffle the prayer under the eye.
    for (const decade of [1, 2, 3, 4, 5]) {
      const first = prayerWith('hailMary', 'contemporary', decade);
      expect(prayerWith('hailMary', 'contemporary', decade)).toEqual(first);
    }
  });

  it('wraps rather than falling off the end of the renderings', () => {
    const count = HAIL_MARY.contemporary.wordings.length;
    expect(prayerWith('hailMary', 'contemporary', count).text.fr).toEqual(
      prayerWith('hailMary', 'contemporary', 0).text.fr,
    );
    expect(prayerWith('hailMary', 'contemporary', -1).text.fr).toEqual(
      prayerWith('hailMary', 'contemporary', count - 1).text.fr,
    );
  });

  it('ignores the pick for the traditional wording, which has only one', () => {
    for (const decade of [0, 1, 7, 99]) {
      expect(prayerWith('hailMary', 'traditional', decade).text.fr).toEqual(
        HAIL_MARY.traditional.wordings[0].text.fr,
      );
    }
  });

  it('applies the choice to the Hail Mary and to nothing else', () => {
    expect(prayerWith('hailMary', 'contemporary', 0).text.fr[0]).toContain('Je te salue');
    expect(prayerWith('ourFather', 'contemporary', 3)).toBe(PRAYERS.ourFather);
    expect(prayerWith('creed', 'contemporary', 1)).toBe(PRAYERS.creed);
  });

  it('falls back to the traditional wording when asked for nonsense', () => {
    // Anyone who had chosen Latin before it was removed lands here.
    const rogue = 'latin' as unknown as Parameters<typeof prayerWith>[1];
    expect(prayerWith('hailMary', rogue).text.fr).toEqual(
      HAIL_MARY.traditional.wordings[0].text.fr,
    );
    expect(isHailMaryVariant('gibberish')).toBe(false);
    expect(isHailMaryVariant('contemporary')).toBe(true);
  });
});
