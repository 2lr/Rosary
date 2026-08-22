import 'server-only';
import { all, run } from './index';

/**
 * Which novenas a user has joined.
 *
 * Only the joining is stored. Whether the nine days were kept is read from the
 * rosaries already recorded — a novena is not a second thing to keep up with,
 * it is the rosary you pray anyway, nine days running.
 */

export type JoinedNovena = { novena: string; year: number; joinedAt: string };

type Row = { novena: string; year: number; joined_at: string };

export async function listJoinedNovenas(userId: string): Promise<JoinedNovena[]> {
  const rows = await all<Row>(
    'SELECT novena, year, joined_at FROM novenas WHERE user_id = ? ORDER BY year DESC, novena',
    [userId],
  );
  return rows.map((row) => ({ novena: row.novena, year: row.year, joinedAt: row.joined_at }));
}

export async function joinNovena(userId: string, novena: string, year: number): Promise<void> {
  // Joining twice is not an error, it is the same thing again.
  const existing = await all<Row>(
    'SELECT novena FROM novenas WHERE user_id = ? AND novena = ? AND year = ?',
    [userId, novena, year],
  );
  if (existing.length > 0) return;

  await run(
    'INSERT INTO novenas (user_id, novena, year, joined_at) VALUES (?, ?, ?, ?)',
    [userId, novena, year, new Date().toISOString()],
  );
}

export async function leaveNovena(userId: string, novena: string, year: number): Promise<void> {
  await run('DELETE FROM novenas WHERE user_id = ? AND novena = ? AND year = ?', [
    userId,
    novena,
    year,
  ]);
}
