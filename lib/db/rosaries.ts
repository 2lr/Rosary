import 'server-only';
import { randomUUID } from 'node:crypto';
import { all, one, run } from './index';
import { normalizeLang } from '@/lib/i18n/config';
import { isMysterySetId } from '@/lib/rosary/mysteries';
import type {
  PrayerMode,
  Rosary,
  RosaryKind,
  RosaryProgress,
  RosaryStatus,
} from '@/lib/rosary/types';

type RosaryRow = {
  id: string;
  user_id: string;
  kind: string;
  mode: string;
  mystery_set: string | null;
  lang: string;
  intention: string | null;
  status: string;
  progress: string;
  decades_completed: number;
  hail_marys: number;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

const EMPTY_PROGRESS: RosaryProgress = { step: 0, done: [], writings: {} };

function parseProgress(raw: string): RosaryProgress {
  try {
    const value = JSON.parse(raw) as Partial<RosaryProgress>;
    return {
      step: typeof value.step === 'number' ? value.step : 0,
      done: Array.isArray(value.done) ? value.done.filter((n) => typeof n === 'number') : [],
      writings:
        value.writings && typeof value.writings === 'object'
          ? (value.writings as Record<string, string>)
          : {},
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

function toRosary(row: RosaryRow): Rosary {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as RosaryKind,
    mode: row.mode as PrayerMode,
    mysterySet: isMysterySetId(row.mystery_set) ? row.mystery_set : null,
    lang: normalizeLang(row.lang),
    intention: row.intention,
    status: row.status as RosaryStatus,
    progress: parseProgress(row.progress),
    decadesCompleted: Number(row.decades_completed) || 0,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function createRosary(input: {
  userId: string;
  kind: RosaryKind;
  mode: PrayerMode;
  mysterySet: string | null;
  lang: string;
  intention: string | null;
}): Promise<Rosary> {
  const id = randomUUID();
  const now = new Date().toISOString();

  await run(
    `INSERT INTO rosaries
       (id, user_id, kind, mode, mystery_set, lang, intention, status, progress,
        decades_completed, hail_marys, started_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, 0, 0, ?, ?, NULL)`,
    [
      id,
      input.userId,
      input.kind,
      input.mode,
      input.mysterySet,
      input.lang,
      input.intention,
      JSON.stringify(EMPTY_PROGRESS),
      now,
      now,
    ],
  );

  const created = await findRosary(id, input.userId);
  if (!created) throw new Error('Rosary could not be created');
  return created;
}

export async function findRosary(id: string, userId: string): Promise<Rosary | null> {
  const row = await one<RosaryRow>('SELECT * FROM rosaries WHERE id = ? AND user_id = ?', [
    id,
    userId,
  ]);
  return row ? toRosary(row) : null;
}

export async function listRosaries(userId: string, limit = 50): Promise<Rosary[]> {
  const rows = await all<RosaryRow>(
    `SELECT * FROM rosaries WHERE user_id = ? ORDER BY started_at DESC LIMIT ${Math.max(1, Math.min(500, Math.floor(limit)))}`,
    [userId],
  );
  return rows.map(toRosary);
}

/** The most recent rosary that was started but never finished. */
export async function findOpenRosary(userId: string): Promise<Rosary | null> {
  const row = await one<RosaryRow>(
    `SELECT * FROM rosaries
     WHERE user_id = ? AND status = 'in_progress'
     ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  return row ? toRosary(row) : null;
}

export async function saveProgress(
  id: string,
  userId: string,
  patch: {
    progress: RosaryProgress;
    decadesCompleted: number;
    hailMarys: number;
    status: RosaryStatus;
    intention?: string | null;
  },
): Promise<Rosary | null> {
  const now = new Date().toISOString();

  // The columns to touch are decided here rather than with CASE expressions in
  // the SQL: Postgres cannot infer the type of a bare parameter inside a CASE,
  // and refuses the statement outright.
  const assignments = [
    'progress = ?',
    'decades_completed = ?',
    'hail_marys = ?',
    'status = ?',
    'updated_at = ?',
  ];
  const values: unknown[] = [
    JSON.stringify(patch.progress),
    patch.decadesCompleted,
    patch.hailMarys,
    patch.status,
    now,
  ];

  if (patch.status === 'completed') {
    assignments.push('completed_at = ?');
    values.push(now);
  }
  if (patch.intention !== undefined) {
    assignments.push('intention = ?');
    values.push(patch.intention);
  }

  await run(`UPDATE rosaries SET ${assignments.join(', ')} WHERE id = ? AND user_id = ?`, [
    ...values,
    id,
    userId,
  ]);

  return findRosary(id, userId);
}

export async function deleteRosary(id: string, userId: string): Promise<void> {
  await run('DELETE FROM rosaries WHERE id = ? AND user_id = ?', [id, userId]);
}
