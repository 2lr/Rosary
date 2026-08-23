import { describe, expect, it } from 'vitest';
import { prayerNotice } from '@/lib/mail/prayerNotice';
import { VERSES, verseFor } from '@/lib/mail/verses';

const LANGS = ['fr', 'en'] as const;

describe('the verse that goes with a prayer', () => {
  it('says something in both languages, with its reference', () => {
    for (const verse of VERSES) {
      for (const lang of LANGS) {
        expect(verse.text[lang].length, verse.ref.en).toBeGreaterThan(20);
        expect(verse.text[lang].trim()).toBe(verse.text[lang]);
        expect(verse.ref[lang].length, verse.ref.en).toBeGreaterThan(4);
      }
      // A line to be read once on a phone, not a paragraph.
      expect(verse.text.fr.length, verse.ref.en).toBeLessThan(140);
      expect(verse.text.en.length, verse.ref.en).toBeLessThan(140);
    }
  });

  it('quotes no reference twice', () => {
    expect(new Set(VERSES.map((v) => v.ref.en)).size).toBe(VERSES.length);
  });

  it('gives the same person a different line each day', () => {
    // Two mornings running should not open the same words.
    const seen = VERSES.map((_, i) => {
      const day = new Date(Date.UTC(2026, 7, 10 + i)).toISOString().slice(0, 10);
      return verseFor('marie@example.com', day).ref.en;
    });
    expect(new Set(seen).size).toBe(VERSES.length);
  });

  it('does not hand the same line to everybody on the same day', () => {
    const day = '2026-08-22';
    const refs = ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com'].map(
      (email) => verseFor(email, day).ref.en,
    );
    expect(new Set(refs).size).toBeGreaterThan(1);
  });

  it('reads an address the way it was written, however it was typed', () => {
    const day = '2026-08-22';
    expect(verseFor(' Marie@Example.com ', day)).toEqual(verseFor('marie@example.com', day));
  });

  it('still gives a verse when the day makes no sense', () => {
    expect(VERSES).toContain(verseFor('marie@example.com', 'not-a-day'));
  });
});

describe('the word sent to somebody prayed for', () => {
  const verse = VERSES[0];
  const made = (lang: 'fr' | 'en') =>
    prayerNotice({ lang, verse, code: 'YZCE5X', appUrl: 'https://rosaire.example.com/' });

  it('carries the link with the code in it, trailing slash or not', () => {
    for (const lang of LANGS) {
      const notice = made(lang);
      expect(notice.text).toContain('https://rosaire.example.com/?code=YZCE5X');
      expect(notice.html).toContain('https://rosaire.example.com/?code=YZCE5X');
      expect(notice.text).not.toContain('.com//');
    }
  });

  it('says the verse and its reference, in the language it was prayed in', () => {
    expect(made('fr').text).toContain(verse.text.fr);
    expect(made('fr').text).toContain(verse.ref.fr);
    expect(made('en').text).toContain(verse.text.en);
    expect(made('en').subject).not.toBe(made('fr').subject);
  });

  it('tells nobody who prayed, or what for', () => {
    // The two things this feature must never leak. The word "anonymous" is not
    // enough — there must be no name-shaped hole to fill in either.
    for (const lang of LANGS) {
      const notice = made(lang);
      const whole = `${notice.subject} ${notice.text} ${notice.html}`;
      expect(whole).not.toMatch(/\{[a-z]+\}/i);
      for (const forbidden of ['intention', 'de la part de', 'sent by', 'from:']) {
        expect(whole.toLowerCase()).not.toContain(forbidden);
      }
    }
  });

  it('escapes what goes into the html rather than pasting it in', () => {
    // A code is six letters and digits and can be none of this, but the mail
    // goes to strangers: nothing reaches the markup unencoded.
    const notice = prayerNotice({
      lang: 'fr',
      verse,
      code: 'A"><script>B',
      appUrl: 'https://rosaire.example.com',
    });
    expect(notice.html).not.toContain('<script>');
    expect(notice.html).toContain('code=A%22%3E%3Cscript%3EB');
  });

  it('gives a plain-text part that can be read on its own', () => {
    const notice = made('fr');
    expect(notice.text).not.toContain('<');
    expect(notice.text.split('\n').filter(Boolean).length).toBeGreaterThan(4);
  });
});
