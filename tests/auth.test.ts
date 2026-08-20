import { describe, expect, it, beforeAll } from 'vitest';
import { checkPasswordStrength, hashPassword, verifyPassword } from '@/lib/auth/password';
import { parseSession, serializeSession } from '@/lib/auth/session';
import { isValidEmail, normalizeEmail } from '@/lib/db/users';

beforeAll(() => {
  process.env.SESSION_SECRET = 'a-test-secret-that-is-long-enough';
});

describe('passwords', () => {
  it('verifies a password against its own hash', async () => {
    const hash = await hashPassword('un mot de passe');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('un mot de passe', hash)).toBe(true);
    expect(await verifyPassword('un autre', hash)).toBe(false);
  });

  it('salts, so the same password never hashes twice the same way', async () => {
    expect(await hashPassword('même')).not.toBe(await hashPassword('même'));
  });

  it('normalises unicode so an accent typed two ways still opens the account', async () => {
    const composed = 'cr\u00e8me'; // e-grave as one code point
    const decomposed = 'cre\u0300me'; // e + combining grave accent
    expect(await verifyPassword(decomposed, await hashPassword(composed))).toBe(true);
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$1$2$3$4$')).toBe(false);
  });

  it('asks for at least eight characters', () => {
    expect(checkPasswordStrength('short')).toBe('too-short');
    expect(checkPasswordStrength('longenough')).toBeNull();
    expect(checkPasswordStrength('x'.repeat(201))).toBe('too-long');
  });
});

describe('sessions', () => {
  it('round-trips a user id', () => {
    const { value } = serializeSession('user-42');
    expect(parseSession(value)?.uid).toBe('user-42');
  });

  it('refuses a tampered payload', () => {
    const { value } = serializeSession('user-42');
    const [body, signature] = value.split('.');
    const forged = Buffer.from(JSON.stringify({ uid: 'someone-else', exp: 1e10 })).toString(
      'base64url',
    );
    expect(parseSession(`${forged}.${signature}`)).toBeNull();
    expect(parseSession(`${body}.wrong`)).toBeNull();
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession('nonsense')).toBeNull();
  });

  it('refuses a signature made with another secret', () => {
    const { value } = serializeSession('user-42');
    process.env.SESSION_SECRET = 'a-different-secret-of-good-length';
    expect(parseSession(value)).toBeNull();
    process.env.SESSION_SECRET = 'a-test-secret-that-is-long-enough';
  });
});

describe('email addresses', () => {
  it('are stored lowercase and trimmed', () => {
    expect(normalizeEmail('  Jean@2LR.com ')).toBe('jean@2lr.com');
  });

  it('are checked for an obvious shape', () => {
    expect(isValidEmail('jean@2lr.com')).toBe(true);
    expect(isValidEmail('jean@2lr')).toBe(false);
    expect(isValidEmail('jean')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
  });
});
