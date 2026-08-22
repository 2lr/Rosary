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

export type NovenaRow = {
  novena: string;
  startedOn: string;
  createdAt: string;
  /** When the user said they had kept it, whatever the rosaries recorded. */
  keptAt: string | null;
};

type Row = {
  novena: string;
  started_on: string;
  created_at: string;
  kept_at: string | null;
};

export async function listNovenas(userId: string): Promise<NovenaRow[]> {
  const rows = await all<Row>(
    `SELECT novena, started_on, created_at, kept_at FROM novena_runs
       WHERE user_id = ? ORDER BY started_on DESC`,
    [userId],
  );
  return rows.map((row) => ({
    novena: row.novena,
    startedOn: row.started_on,
    createdAt: row.created_at,
    keptAt: row.kept_at,
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

/**
 * Marking a novena kept, or unmarking it.
 *
 * The nine days are otherwise counted from the rosaries recorded, which is only
 * true of someone who opened the app every one of those days. A novena prayed
 * on a train, or on paper, or from memory was still prayed — so it can be said
 * so, and the saying is stored apart from the counting.
 */
export async function markNovenaKept(
  userId: string,
  novena: string,
  startedOn: string,
  kept: boolean,
): Promise<void> {
  await run(
    'UPDATE novena_runs SET kept_at = ? WHERE user_id = ? AND novena = ? AND started_on = ?',
    [kept ? new Date().toISOString() : null, userId, novena, startedOn],
  );
}
