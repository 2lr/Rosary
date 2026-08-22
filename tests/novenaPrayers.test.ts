import { describe, expect, it } from 'vitest';
import { NOVENA_PRAYERS, novenaPrayer } from '@/lib/rosary/novenaPrayers';
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
