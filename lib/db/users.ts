import 'server-only';
import { randomInt, randomUUID } from 'node:crypto';
import { all, one, run } from './index';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { newInviteCode, normalizeInviteCode } from '@/lib/invite';
import { normalizeLang, type Lang } from '@/lib/i18n/config';
import { isHexColor, normalizeHex } from '@/lib/rosary/color';
import { isLoopShape, type LoopShape } from '@/lib/rosary/shapes';
import {
  DEFAULT_HAIL_MARY_VARIANT,
  isHailMaryVariant,
  type HailMaryVariant,
} from '@/lib/rosary/prayers';

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  lang: Lang;
  /** Accent, beads and chain. Null until the user picks their own. */
  colors: [string, string, string] | null;
  shape: LoopShape;
  /** Which wording of the Hail Mary to pray. */
  hailMary: HailMaryVariant;
  /** The code this user gives out. Null only on accounts made before codes. */
  inviteCode: string | null;
  /** Who let them in. Null on the very first account. */
  invitedBy: string | null;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  lang: string;
  colors: string | null;
  loop_shape: string | null;
  hail_mary: string | null;
  invite_code: string | null;
  invited_by: string | null;
  created_at: string;
};

/** Three hex colours, or null when the user has not chosen any. */
export function parseColors(raw: string | null): [string, string, string] | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value) || value.length !== 3) return null;
    if (!value.every(isHexColor)) return null;
    return value.map((c) => normalizeHex(c as string)) as [string, string, string];
  } catch {
    return null;
  }
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    lang: normalizeLang(row.lang),
    colors: parseColors(row.colors),
    shape: isLoopShape(row.loop_shape) ? row.loop_shape : 'round',
    hailMary: isHailMaryVariant(row.hail_mary) ? row.hail_mary : DEFAULT_HAIL_MARY_VARIANT,
    inviteCode: row.invite_code,
    invitedBy: row.invited_by,
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
  /** Who let them in. Null only for the first account on a new install. */
  invitedBy?: string | null;
}): Promise<User> {
  const id = randomUUID();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const createdAt = new Date().toISOString();
  const inviteCode = await freeInviteCode();

  await run(
    `INSERT INTO users
       (id, email, password_hash, display_name, lang, invite_code, invited_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      email,
      passwordHash,
      input.displayName?.trim() || null,
      input.lang,
      inviteCode,
      input.invitedBy ?? null,
      createdAt,
    ],
  );

  return {
    id,
    email,
    displayName: input.displayName?.trim() || null,
    lang: input.lang,
    colors: null,
    shape: 'round',
    hailMary: DEFAULT_HAIL_MARY_VARIANT,
    inviteCode,
    invitedBy: input.invitedBy ?? null,
    createdAt,
  };
}

/** How many times to redraw a code before giving up on the collision. */
const CODE_TRIES = 12;

/** A code nobody holds. Collisions are vanishingly rare and handled anyway. */
async function freeInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < CODE_TRIES; attempt++) {
    const code = newInviteCode((bound) => randomInt(bound));
    const taken = await one<{ id: string }>('SELECT id FROM users WHERE invite_code = ?', [code]);
    if (!taken) return code;
  }
  throw new Error('could not mint an unused invite code');
}

export async function findUserByInviteCode(code: unknown): Promise<User | null> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return null;
  const row = await one<UserRow>('SELECT * FROM users WHERE invite_code = ?', [normalized]);
  return row ? toUser(row) : null;
}

/**
 * The code this user gives out, minting one if they signed up before codes
 * existed. Everybody needs one to invite with, including the very first account.
 */
export async function inviteCodeOf(userId: string): Promise<string | null> {
  const row = await one<{ invite_code: string | null }>(
    'SELECT invite_code FROM users WHERE id = ?',
    [userId],
  );
  if (!row) return null;
  if (row.invite_code) return row.invite_code;

  const code = await freeInviteCode();
  await run('UPDATE users SET invite_code = ? WHERE id = ? AND invite_code IS NULL', [
    code,
    userId,
  ]);
  // Read it back rather than trusting the write: two tabs asking at once must
  // not each walk away with a different code for the same person.
  const after = await one<{ invite_code: string | null }>(
    'SELECT invite_code FROM users WHERE id = ?',
    [userId],
  );
  return after?.invite_code ?? code;
}

/** Whether anybody has signed up yet — the first account needs no code. */
export async function hasAnyUser(): Promise<boolean> {
  const row = await one<{ n: number }>('SELECT COUNT(*) AS n FROM users', []);
  return (Number(row?.n) || 0) > 0;
}

/** How deep the tree is walked. Deep enough for any real chain of invitations. */
const LINEAGE_DEPTH = 20;

export type Lineage = {
  /** People who came in on this user's own code. */
  invited: number;
  /** Everybody below them, however many hands the code passed through. */
  people: number;
  /** Rosaries those people have finished, and the decades in them. */
  rosaries: number;
  decades: number;
};

/**
 * What has been prayed by the people below someone in the tree.
 *
 * Counts, and nothing else: who they are and what they prayed on which day is
 * theirs. Handing out a code should not hand over a view of somebody's prayer
 * life — only the fact that it is happening, which is the part worth seeing.
 */
export async function lineageOf(userId: string): Promise<Lineage> {
  const row = await one<{
    invited: number;
    people: number;
    rosaries: number;
    decades: number;
  }>(
    `WITH RECURSIVE tree(id, depth) AS (
       SELECT id, 1 FROM users WHERE invited_by = ?
       UNION ALL
       SELECT u.id, t.depth + 1 FROM users u JOIN tree t ON u.invited_by = t.id
        WHERE t.depth < ${LINEAGE_DEPTH}
     )
     SELECT
       (SELECT COUNT(*) FROM tree WHERE depth = 1) AS invited,
       (SELECT COUNT(*) FROM tree) AS people,
       (SELECT COUNT(*) FROM rosaries r
          WHERE r.status = 'completed' AND r.user_id IN (SELECT id FROM tree)) AS rosaries,
       (SELECT COALESCE(SUM(r.decades_completed), 0) FROM rosaries r
          WHERE r.status = 'completed' AND r.user_id IN (SELECT id FROM tree)) AS decades`,
    [userId],
  );

  return {
    invited: Number(row?.invited) || 0,
    people: Number(row?.people) || 0,
    rosaries: Number(row?.rosaries) || 0,
    decades: Number(row?.decades) || 0,
  };
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
  patch: {
    lang?: Lang;
    displayName?: string | null;
    colors?: [string, string, string] | null;
    shape?: LoopShape;
    hailMary?: HailMaryVariant;
  },
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
  if (patch.colors !== undefined) {
    await run('UPDATE users SET colors = ? WHERE id = ?', [
      patch.colors ? JSON.stringify(patch.colors.map(normalizeHex)) : null,
      id,
    ]);
  }
  if (patch.shape !== undefined) {
    await run('UPDATE users SET loop_shape = ? WHERE id = ?', [patch.shape, id]);
  }
  if (patch.hailMary !== undefined) {
    await run('UPDATE users SET hail_mary = ? WHERE id = ?', [patch.hailMary, id]);
  }
}
