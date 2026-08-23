/**
 * The code one person gives another so they can come in.
 *
 * Nobody signs up without one. That is the whole shape of this app's growth:
 * every account is somebody's guest, and the person who let them in can see
 * what has been prayed since — not who prayed it, only how much.
 *
 * The alphabet leaves out the four characters people get wrong when reading a
 * code off a screen and typing it into a phone: I, O, 0 and 1. Six characters
 * from the remaining thirty-two is a bit over a billion codes, which is enough
 * for a rosary app and short enough to say out loud.
 */

export const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const INVITE_LENGTH = 6;

/**
 * A new code. Takes its randomness as an argument so the caller decides where
 * it comes from — the server passes `crypto.randomInt`, a test passes a counter.
 */
export function newInviteCode(pick: (bound: number) => number): string {
  let code = '';
  for (let i = 0; i < INVITE_LENGTH; i++) {
    code += INVITE_ALPHABET[pick(INVITE_ALPHABET.length) % INVITE_ALPHABET.length];
  }
  return code;
}

/**
 * What someone typed, turned into a code — or null if it cannot be one.
 *
 * People paste codes with spaces, dashes and the wrong case, and they read them
 * off screens. Everything but the letters is dropped before judging it, so
 * "ave-7k2" and "AVE 7K2" are the same code.
 */
export function normalizeInviteCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== INVITE_LENGTH) return null;
  for (const character of cleaned) {
    if (!INVITE_ALPHABET.includes(character)) return null;
  }
  return cleaned;
}

/** How a code is shown: in two halves, which is how it gets read aloud. */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
