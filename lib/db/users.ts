import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, one, run } from './index';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { normalizeLang, type Lang } from '@/lib/i18n/config';

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  lang: Lang;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  lang: string;
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    lang: normalizeLang(row.lang),
    createdAt: row.created_at,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await one<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
  return row ? toUser(row) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await one<UserRow>('SELECT * FROM users WHERE email = ?', [normalizeEmail(email)]);
  return row ? toUser(row) : null;
}

export async function createUser(input: {
  email: string;
  password: string;
  lang: Lang;
  displayName?: string | null;
}): Promise<User> {
  const id = randomUUID();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const createdAt = new Date().toISOString();

  await run(
    `INSERT INTO users (id, email, password_hash, display_name, lang, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email, passwordHash, input.displayName?.trim() || null, input.lang, createdAt],
  );

  return { id, email, displayName: input.displayName?.trim() || null, lang: input.lang, createdAt };
}

/** Returns the user when the password matches, otherwise null. */
export async function authenticate(email: string, password: string): Promise<User | null> {
  const rows = await all<UserRow>('SELECT * FROM users WHERE email = ?', [normalizeEmail(email)]);
  const row = rows[0];
  if (!row) {
    // Spend comparable time on unknown addresses so the response does not
    // reveal whether the account exists.
    await hashPassword(password);
    return null;
  }
  return (await verifyPassword(password, row.password_hash)) ? toUser(row) : null;
}

export async function updateUserPreferences(
  id: string,
  patch: { lang?: Lang; displayName?: string | null },
): Promise<void> {
  if (patch.lang !== undefined) {
    await run('UPDATE users SET lang = ? WHERE id = ?', [patch.lang, id]);
  }
  if (patch.displayName !== undefined) {
    await run('UPDATE users SET display_name = ? WHERE id = ?', [
      patch.displayName?.trim() || null,
      id,
    ]);
  }
}
