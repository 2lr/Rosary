/**
 * The one-time word that lets somebody back into their own account.
 *
 * What is sent is a long random string; what is stored is only its SHA-256.
 * A database that leaks must not hand over live accounts — the hash is enough
 * to recognise a token somebody presents, and useless to anybody reading it.
 *
 * Pure and free of the database, so both halves can be tested without one.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** An hour. Long enough to find the mail, short enough to be worth stealing. */
export const RESET_TTL_MS = 60 * 60 * 1000;

/** 32 bytes, base64url: nothing to guess, and it survives a URL untouched. */
export function newResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/** Compares two hashes without letting the clock say how far they matched. */
export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function expiryFrom(now: Date): string {
  return new Date(now.getTime() + RESET_TTL_MS).toISOString();
}

/** Whether a reset is still good: not used, not expired. */
export function stillValid(
  reset: { usedAt: string | null; expiresAt: string },
  now: Date,
): boolean {
  if (reset.usedAt) return false;
  const expires = Date.parse(reset.expiresAt);
  return Number.isFinite(expires) && expires > now.getTime();
}
