import { describe, expect, it } from 'vitest';
import {
  RESET_TTL_MS,
  expiryFrom,
  hashResetToken,
  newResetToken,
  sameHash,
  stillValid,
} from '@/lib/auth/reset';
import { resetNotice } from '@/lib/mail/resetNotice';

describe('the word that lets somebody back in', () => {
  it('is long, random, and survives being put in a URL', () => {
    const a = newResetToken();
    const b = newResetToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(a)).toBe(a);
  });

  it('is stored as a hash, never as itself', () => {
    // A database that leaks must not hand over live accounts.
    const token = newResetToken();
    const hash = hashResetToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashResetToken(token)).toBe(hash);
    expect(hashResetToken(newResetToken())).not.toBe(hash);
  });

  it('shrugs off the whitespace a mail client adds', () => {
    const token = newResetToken();
    expect(hashResetToken(` ${token}\n`)).toBe(hashResetToken(token));
  });

  it('compares hashes without letting the clock say how far it got', () => {
    const hash = hashResetToken('a');
    expect(sameHash(hash, hash)).toBe(true);
    expect(sameHash(hash, hashResetToken('b'))).toBe(false);
    expect(sameHash(hash, hash.slice(0, 10))).toBe(false);
  });

  it('lives an hour, and not a moment past it', () => {
    const now = new Date('2026-08-31T10:00:00Z');
    const expiresAt = expiryFrom(now);
    expect(Date.parse(expiresAt) - now.getTime()).toBe(RESET_TTL_MS);

    expect(stillValid({ usedAt: null, expiresAt }, now)).toBe(true);
    expect(stillValid({ usedAt: null, expiresAt }, new Date(Date.parse(expiresAt) - 1))).toBe(true);
    expect(stillValid({ usedAt: null, expiresAt }, new Date(Date.parse(expiresAt) + 1))).toBe(false);
  });

  it('is spent once and refused after', () => {
    const now = new Date('2026-08-31T10:00:00Z');
    const expiresAt = expiryFrom(now);
    expect(stillValid({ usedAt: '2026-08-31T10:00:30Z', expiresAt }, now)).toBe(false);
  });

  it('refuses a nonsense expiry rather than treating it as forever', () => {
    expect(stillValid({ usedAt: null, expiresAt: 'not-a-date' }, new Date())).toBe(false);
  });
});

describe('the mail that carries it', () => {
  const made = (lang: 'fr' | 'en') =>
    resetNotice({ lang, token: 'tok_EN-abc_123', appUrl: 'https://infiniterosary.com/' });

  it('carries the token in the link, encoded, in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      const notice = made(lang);
      expect(notice.text).toContain('https://infiniterosary.com/reset?token=tok_EN-abc_123');
      expect(notice.html).toContain('/reset?token=tok_EN-abc_123');
      expect(notice.text).not.toContain('.com//');
    }
    expect(made('fr').subject).not.toBe(made('en').subject);
  });

  it('says what to do if it was not you, since that is the frightening case', () => {
    expect(made('fr').text.toLowerCase()).toContain('rien à faire');
    expect(made('en').text.toLowerCase()).toContain('nothing to do');
  });

  it('carries nothing else — no invitation, no artwork, no sales pitch', () => {
    // A mail about an account is what people are phished with, so it stays
    // plain: what was asked for, one link, and what to do if it was not you.
    // The link's own host is excluded from the search, since the domain is
    // called what the app is called.
    for (const lang of ['fr', 'en'] as const) {
      const whole = `${made(lang).subject} ${made(lang).text}`
        .replace(/https:\/\/\S+/g, '')
        .toLowerCase();
      for (const forbidden of ['chapelet', 'rosary', 'invitation', 'og.png', 'neuvaine']) {
        expect(whole, forbidden).not.toContain(forbidden);
      }
      // Short enough to be read in full on a lock screen preview.
      expect(made(lang).text.length).toBeLessThan(500);
    }
  });
});
