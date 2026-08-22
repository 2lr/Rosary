import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, run } from './index';

/**
 * The novenas a user is praying, or has prayed.
 *
 * What is stored is the day a novena was begun — not the feast it belongs to.
 * The liturgical ones open nine days before their feast, but a novena can be
 * prayed at any time for any reason, so the day it started is the only thing
 * that fixes its nine days.
 *
 * Whether those days were kept is not stored at all: it is read from the
 * rosaries already recorded. A novena is not a second thing to keep up with.
 */

export type NovenaRow = { novena: string; startedOn: string; createdAt: string };

type Row = { novena: string; started_on: string; created_at: string };

export async function listNovenas(userId: string): Promise<NovenaRow[]> {
  const rows = await all<Row>(
    'SELECT novena, started_on, created_at FROM novena_runs WHERE user_id = ? ORDER BY started_on DESC',
    [userId],
  );
  return rows.map((row) => ({
    novena: row.novena,
    startedOn: row.started_on,
    createdAt: row.created_at,
  }));
}

/** Starting the same novena on the same day twice is the same thing once. */
export async function startNovena(
  userId: string,
  novena: string,
  startedOn: string,
): Promise<void> {
  const existing = await all<Row>(
    'SELECT novena FROM novena_runs WHERE user_id = ? AND novena = ? AND started_on = ?',
    [userId, novena, startedOn],
  );
  if (existing.length > 0) return;

  await run(
    'INSERT INTO novena_runs (id, user_id, novena, started_on, created_at) VALUES (?, ?, ?, ?, ?)',
    [randomUUID(), userId, novena, startedOn, new Date().toISOString()],
  );
}

export async function stopNovena(
  userId: string,
  novena: string,
  startedOn: string,
): Promise<void> {
  await run('DELETE FROM novena_runs WHERE user_id = ? AND novena = ? AND started_on = ?', [
    userId,
    novena,
    startedOn,
  ]);
}
