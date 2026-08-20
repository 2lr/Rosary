import { describe, expect, it } from 'vitest';
import {
  MYSTERY_SETS,
  MYSTERY_SET_ORDER,
  mysterySetForDate,
} from '@/lib/rosary/mysteries';
import { PRAYERS } from '@/lib/rosary/prayers';
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
