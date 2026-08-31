import { describe, expect, it } from 'vitest';
import { prayerNotice } from '@/lib/mail/prayerNotice';
import { RETRY_LIMIT, noticesToRetry, type PendingNotice } from '@/lib/mail/retry';
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

  it('writes the code out as well as putting it in the link', () => {
    // Somebody who installs the app from a store rather than following the
    // link is asked for a code, and has to be able to read one here.
    for (const lang of LANGS) {
      const notice = made(lang);
      expect(notice.text).toContain('YZC E5X');
      expect(notice.html).toContain('YZC E5X');
    }
  });

  it('says the address itself is enough, since it is', () => {
    for (const lang of LANGS) {
      const notice = made(lang);
      expect(notice.text.toLowerCase()).toMatch(lang === 'fr' ? /cette adresse/ : /this address/);
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

describe('catching up the words that never went out', () => {
  const at = (iso: string, over: Partial<PendingNotice> = {}): PendingNotice => ({
    id: iso,
    email: 'marie@example.com',
    lang: 'fr',
    status: 'unconfigured',
    createdAt: iso,
    retriedAt: null,
    ...over,
  });
  const now = new Date('2026-08-31T12:00:00Z');

  it('takes the ones that failed on our side', () => {
    const rows = [at('2026-08-20T10:00:00Z'), at('2026-08-21T10:00:00Z', { status: 'failed' })];
    expect(noticesToRetry(rows, now)).toHaveLength(1); // one address, one mail
    expect(noticesToRetry([rows[1]], now)).toHaveLength(1);
  });

  it('leaves alone the ones that were refused on purpose', () => {
    // The daily limit and "already written to today" protect the person on the
    // receiving end. A repair must not be a way around them.
    for (const status of ['too_many', 'already_today', 'sent']) {
      expect(noticesToRetry([at('2026-08-20T10:00:00Z', { status })], now)).toEqual([]);
    }
  });

  it('writes once to somebody prayed for three times, with the latest', () => {
    const rows = [
      at('2026-08-10T10:00:00Z', { id: 'old' }),
      at('2026-08-20T10:00:00Z', { id: 'newest' }),
      at('2026-08-15T10:00:00Z', { id: 'middle' }),
    ];
    const picked = noticesToRetry(rows, now);
    expect(picked).toHaveLength(1);
    expect(picked[0].id).toBe('newest');
  });

  it('reads an address the way it was written, however it was typed', () => {
    const rows = [
      at('2026-08-20T10:00:00Z', { email: 'Marie@Example.com ', id: 'a' }),
      at('2026-08-21T10:00:00Z', { email: 'marie@example.com', id: 'b' }),
    ];
    expect(noticesToRetry(rows, now)).toHaveLength(1);
  });

  it('does not write again to somebody the provider may already have reached', () => {
    const justNow = at('2026-08-20T10:00:00Z', {
      status: 'failed',
      retriedAt: '2026-08-31T11:55:00Z',
    });
    expect(noticesToRetry([justNow], now)).toEqual([]);
  });

  it('leaves the address alone, not merely the row that was tried', () => {
    // Praying twice for the same person leaves two rows. Retrying the newer
    // one and then falling back on the older would write to them twice for
    // one press of the button.
    const rows = [
      at('2026-08-25T10:00:00Z', { id: 'tried', status: 'failed', retriedAt: '2026-08-31T11:55:00Z' }),
      at('2026-08-20T10:00:00Z', { id: 'older' }),
    ];
    expect(noticesToRetry(rows, now)).toEqual([]);
  });

  it('does not follow a mail that has just gone out with a second one', () => {
    // A rosary finished this morning already told them. The backlog behind it
    // must wait rather than arrive on top.
    const rows = [
      at('2026-08-31T09:00:00Z', { id: 'fresh', status: 'sent' }),
      at('2026-08-20T10:00:00Z', { id: 'backlog' }),
    ];
    expect(noticesToRetry(rows, now)).toEqual([]);
  });

  it('still catches up an address whose last mail is long past', () => {
    const rows = [
      at('2026-08-01T09:00:00Z', { id: 'ancient', status: 'sent' }),
      at('2026-08-20T10:00:00Z', { id: 'backlog' }),
    ];
    expect(noticesToRetry(rows, now).map((r) => r.id)).toEqual(['backlog']);
  });

  it('tries again at once when nothing was ever attempted', () => {
    // Somebody who has just fixed their mail settings presses the button, sees
    // it fail because they got one variable wrong, fixes that, and presses
    // again. Nothing left the building either time; nothing may be held back.
    const justNow = at('2026-08-20T10:00:00Z', {
      status: 'unconfigured',
      retriedAt: '2026-08-31T11:55:00Z',
    });
    expect(noticesToRetry([justNow], now)).toHaveLength(1);
  });

  it('lets a failure be tried again once the quiet hours have passed', () => {
    const yesterday = at('2026-08-20T10:00:00Z', {
      status: 'failed',
      retriedAt: '2026-08-30T10:00:00Z',
    });
    expect(noticesToRetry([yesterday], now)).toHaveLength(1);
  });

  it('sends a nonsense retry date rather than sitting on it forever', () => {
    const broken = at('2026-08-20T10:00:00Z', { status: 'failed', retriedAt: 'not-a-date' });
    expect(noticesToRetry([broken], now)).toHaveLength(1);
  });

  it('never empties a whole backlog into somebody’s evening at once', () => {
    const rows = Array.from({ length: 40 }, (_, i) =>
      at(`2026-08-${String(10 + (i % 20)).padStart(2, '0')}T10:00:00Z`, {
        id: `n${i}`,
        email: `p${i}@example.com`,
      }),
    );
    expect(noticesToRetry(rows, now).length).toBeLessThanOrEqual(RETRY_LIMIT);
    expect(noticesToRetry(rows, now, 3)).toHaveLength(3);
  });

  it('sends the most recent prayers first, so the oldest wait', () => {
    const rows = [
      at('2026-08-10T10:00:00Z', { id: 'old', email: 'a@example.com' }),
      at('2026-08-25T10:00:00Z', { id: 'recent', email: 'b@example.com' }),
    ];
    expect(noticesToRetry(rows, now, 1)[0].id).toBe('recent');
  });
});
