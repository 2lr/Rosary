import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DICT, translate } from '@/lib/i18n/dictionary';

describe('the two languages', () => {
  it('say the same things', () => {
    const fr = Object.keys(DICT.fr).sort();
    const en = Object.keys(DICT.en).sort();
    expect(en.filter((k) => !fr.includes(k))).toEqual([]);
    expect(fr.filter((k) => !en.includes(k))).toEqual([]);
  });

  it('leaves nothing blank', () => {
    for (const [lang, entries] of Object.entries(DICT)) {
      for (const [key, value] of Object.entries(entries)) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect((value as string).trim().length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('declares each key once', () => {
    // A repeated key is silently won by the last one, so a stray addition can
    // quietly rewrite a sentence somewhere else entirely. The object itself
    // cannot show this — only the source can.
    const source = readFileSync('lib/i18n/dictionary.ts', 'utf8');
    const blocks = source.split(/^\s{2}(fr|en): \{$/m).filter((b) => b.includes("':"));

    for (const block of blocks) {
      const seen = new Map<string, number>();
      for (const [, key] of block.matchAll(/^\s{4}'([a-zA-Z0-9._]+)':/gm)) {
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      expect([...seen].filter(([, count]) => count > 1)).toEqual([]);
    }
  });

  it('keeps the placeholders of a phrase in both languages', () => {
    const holders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(DICT.fr)) {
      const french = DICT.fr[key as keyof typeof DICT.fr] as string;
      const english = DICT.en[key as keyof typeof DICT.en] as string;
      expect(holders(english), key).toEqual(holders(french));
    }
  });
});

describe('one of a thing', () => {
  it('uses the singular phrasing when the count is one', () => {
    // French and English both say "1 jour" and "2 jours"; the sibling key
    // ending in .one is what carries the singular.
    expect(translate('fr', 'novena.decades', { n: 1 })).toBe('1 dizaine');
    expect(translate('fr', 'novena.decades', { n: 3 })).toBe('3 dizaines');
    expect(translate('en', 'novena.decades', { n: 1 })).toBe('1 decade');
    expect(translate('en', 'novena.decades', { n: 4 })).toBe('4 decades');
  });

  it('falls back to the plural phrasing when there is no singular', () => {
    expect(translate('fr', 'novena.day', { n: 1, of: 9 })).toBe('Jour 1 sur 9');
  });

  it('leaves phrases without a count alone', () => {
    expect(translate('fr', 'novena.title')).toBe('Neuvaines');
  });

  it('gives every singular a plural to sit beside', () => {
    // A .one on its own would never be reached for any other count.
    for (const lang of ['fr', 'en'] as const) {
      for (const key of Object.keys(DICT[lang])) {
        if (!key.endsWith('.one')) continue;
        expect(Object.keys(DICT[lang]), key).toContain(key.slice(0, -4));
      }
    }
  });
});
