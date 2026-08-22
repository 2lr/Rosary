import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DICT } from '@/lib/i18n/dictionary';

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
