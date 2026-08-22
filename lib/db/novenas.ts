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
 * Which of the nine days were kept is read from the rosaries already recorded —
 * a novena is not a second thing to keep up with. But a day prayed away from
 * the app is still a day prayed, so any of the nine can also be marked by hand,
 * and those marks are stored beside the run rather than inside it.
 */

export type NovenaRow = {
  novena: string;
  startedOn: string;
  createdAt: string;
  /** When the user said they had kept it, whatever the rosaries recorded. */
  keptAt: string | null;
  /** Days of the nine marked by hand, as day keys. */
  days: string[];
};

type Row = {
  novena: string;
  started_on: string;
  created_at: string;
  kept_at: string | null;
};

type DayRow = { novena: string; started_on: string; day: string };

export async function listNovenas(userId: string): Promise<NovenaRow[]> {
  const rows = await all<Row>(
    `SELECT novena, started_on, created_at, kept_at FROM novena_runs
       WHERE user_id = ? ORDER BY started_on DESC`,
    [userId],
  );
  const marks = await all<DayRow>(
    'SELECT novena, started_on, day FROM novena_days WHERE user_id = ?',
    [userId],
  );

  const byRun = new Map<string, string[]>();
  for (const mark of marks) {
    const key = `${mark.novena}:${mark.started_on}`;
    const days = byRun.get(key);
    if (days) days.push(mark.day);
    else byRun.set(key, [mark.day]);
  }

  return rows.map((row) => ({
    novena: row.novena,
    startedOn: row.started_on,
    createdAt: row.created_at,
    keptAt: row.kept_at,
    days: (byRun.get(`${row.novena}:${row.started_on}`) ?? []).sort(),
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
  // The marks belong to the run. Leaving them behind would bring them back to
  // life the next time the same novena is started on the same day.
  await clearNovenaDays(userId, novena, startedOn);
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

/**
 * Marking one of the nine days as prayed, or taking the mark back.
 *
 * This is what makes a novena enterable after the fact: someone who prayed the
 * first six days on paper can say so day by day, rather than being held to
 * whatever the app happened to record. A day with a rosary against it is
 * already counted and is not marked here — there would be nothing to add.
 */
export async function markNovenaDay(
  userId: string,
  novena: string,
  startedOn: string,
  day: string,
  prayed: boolean,
): Promise<void> {
  if (!prayed) {
    await run(
      `DELETE FROM novena_days
         WHERE user_id = ? AND novena = ? AND started_on = ? AND day = ?`,
      [userId, novena, startedOn, day],
    );
    return;
  }

  // Marking the same day twice is the same thing once. No upsert: the syntax
  // differs between SQLite and Postgres, and there is nothing to update.
  const existing = await all<DayRow>(
    `SELECT day FROM novena_days
       WHERE user_id = ? AND novena = ? AND started_on = ? AND day = ?`,
    [userId, novena, startedOn, day],
  );
  if (existing.length > 0) return;

  await run(
    `INSERT INTO novena_days (user_id, novena, started_on, day, marked_at)
       VALUES (?, ?, ?, ?, ?)`,
    [userId, novena, startedOn, day, new Date().toISOString()],
  );
}

/** Days marked by hand go with the run; dropping one drops them too. */
export async function clearNovenaDays(
  userId: string,
  novena: string,
  startedOn: string,
): Promise<void> {
  await run('DELETE FROM novena_days WHERE user_id = ? AND novena = ? AND started_on = ?', [
    userId,
    novena,
    startedOn,
  ]);
}

/**
 * Carrying the marks over when the first day of a novena is corrected.
 *
 * The days marked are real days on which someone prayed, so they keep their own
 * dates; only which run they hang from changes. Any that fall outside the new
 * nine simply stop being looked at.
 */
export async function moveNovenaDays(
  userId: string,
  novena: string,
  from: string,
  to: string,
): Promise<void> {
  if (from === to) return;
  await run(
    `UPDATE novena_days SET started_on = ?
       WHERE user_id = ? AND novena = ? AND started_on = ?`,
    [to, userId, novena, from],
  );
}
