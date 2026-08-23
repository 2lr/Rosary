import { describe, expect, it } from 'vitest';
import {
  INVITE_ALPHABET,
  INVITE_LENGTH,
  formatInviteCode,
  newInviteCode,
  normalizeInviteCode,
} from '@/lib/invite';

/** A deterministic stand-in for the server's randomness. */
const counting = () => {
  let n = 0;
  return () => n++;
};

describe('invitation codes', () => {
  it('leaves out every character people mistype off a screen', () => {
    // I and 1, O and 0. A code nobody can read back is a code nobody uses.
    for (const character of 'IO01') {
      expect(INVITE_ALPHABET.includes(character), character).toBe(false);
    }
    expect(new Set(INVITE_ALPHABET).size).toBe(INVITE_ALPHABET.length);
  });

  it('makes codes of the stated length, out of the stated alphabet', () => {
    const code = newInviteCode(counting());
    expect(code).toHaveLength(INVITE_LENGTH);
    for (const character of code) expect(INVITE_ALPHABET.includes(character)).toBe(true);
  });

  it('takes a code however it was typed back in', () => {
    const code = newInviteCode(counting());
    expect(normalizeInviteCode(code.toLowerCase())).toBe(code);
    expect(normalizeInviteCode(formatInviteCode(code))).toBe(code);
    expect(normalizeInviteCode(` ${code.slice(0, 3)}-${code.slice(3)} `)).toBe(code);
  });

  it('refuses what cannot be a code, rather than guessing at it', () => {
    const code = newInviteCode(counting());
    expect(normalizeInviteCode(code.slice(0, 5))).toBeNull();
    expect(normalizeInviteCode(`${code}X`)).toBeNull();
    // Characters the alphabet deliberately does not contain.
    expect(normalizeInviteCode('ABC0DE')).toBeNull();
    expect(normalizeInviteCode('ABCIDE')).toBeNull();
    expect(normalizeInviteCode('')).toBeNull();
    expect(normalizeInviteCode(null)).toBeNull();
    expect(normalizeInviteCode(42)).toBeNull();
  });

  it('shows a code in two halves, which is how it gets read aloud', () => {
    expect(formatInviteCode('ABC234')).toBe('ABC 234');
    expect(normalizeInviteCode(formatInviteCode('ABC234'))).toBe('ABC234');
  });

  it('draws on the whole alphabet rather than a corner of it', () => {
    // A generator that only ever reached a few characters would collide far
    // sooner than the arithmetic suggests.
    const seen = new Set<string>();
    let n = 0;
    for (let i = 0; i < 400; i++) {
      for (const character of newInviteCode(() => n++)) seen.add(character);
    }
    expect(seen.size).toBe(INVITE_ALPHABET.length);
  });
});
