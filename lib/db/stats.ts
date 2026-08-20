import 'server-only';
import { all, one } from './index';
import type { MysterySetId } from '@/lib/rosary/mysteries';
import type { Stats } from '@/lib/rosary/stats';

export type { DayCount, Stats } from '@/lib/rosary/stats';
export { EMPTY_STATS } from '@/lib/rosary/stats';
import { dayKey, diffDays, streaks } from '@/lib/rosary/stats';

type CompletedRow = {
  completed_at: string;
  started_at: string;
  decades_completed: number;
  hail_marys: number;
  kind: string;
  mystery_set: string | null;
};

export async function getStats(userId: string, today = new Date()): Promise<Stats> {
  const rows = await all<CompletedRow>(
    `SELECT completed_at, started_at, decades_completed, hail_marys, kind, mystery_set
     FROM rosaries
     WHERE user_id = ? AND status = 'completed' AND completed_at IS NOT NULL
     ORDER BY completed_at ASC`,
    [userId],
  );

  const openRow = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM rosaries WHERE user_id = ? AND status = 'in_progress'`,
    [userId],
  );

  const bySet: Stats['bySet'] = { joyful: 0, luminous: 0, sorrowful: 0, glorious: 0, free: 0 };
  const perDay = new Map<string, { count: number; decades: number }>();
  let totalDecades = 0;
  let totalHailMarys = 0;
  let totalMinutes = 0;

  for (const row of rows) {
    const decades = Number(row.decades_completed) || 0;
    totalDecades += decades;
    totalHailMarys += Number(row.hail_marys) || 0;

    const elapsed = (Date.parse(row.completed_at) - Date.parse(row.started_at)) / 60_000;
    // Rosaries picked up over a whole day would distort the total, so cap a
    // single session at a generous hour.
    if (Number.isFinite(elapsed) && elapsed > 0) totalMinutes += Math.min(elapsed, 60);

    const key = row.kind === 'free' || !row.mystery_set ? 'free' : (row.mystery_set as MysterySetId);
    if (key in bySet) bySet[key as keyof typeof bySet] += 1;

    const day = dayKey(row.completed_at);
    const entry = perDay.get(day) ?? { count: 0, decades: 0 };
    entry.count += 1;
    entry.decades += decades;
    perDay.set(day, entry);
  }

  const days = [...perDay.keys()].sort();
  const { current, longest } = streaks(days, dayKey(today.toISOString()));
  const firstPrayedAt = rows[0]?.completed_at ?? null;
  const lastPrayedAt = rows[rows.length - 1]?.completed_at ?? null;

  return {
    totalCompleted: rows.length,
    totalDecades,
    totalHailMarys,
    totalMinutes: Math.round(totalMinutes),
    firstPrayedAt,
    lastPrayedAt,
    daysSinceFirst: firstPrayedAt
      ? Math.max(0, diffDays(dayKey(firstPrayedAt), dayKey(today.toISOString())))
      : 0,
    daysPrayed: days.length,
    currentStreak: current,
    longestStreak: longest,
    bySet,
    byDay: days.map((date) => ({ date, ...perDay.get(date)! })),
    inProgress: Number(openRow?.n) || 0,
  };
}
