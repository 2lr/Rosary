import type { MysterySetId } from './mysteries';

export type DayCount = { date: string; count: number; decades: number };

export type Stats = {
  totalCompleted: number;
  totalDecades: number;
  totalHailMarys: number;
  totalMinutes: number;
  firstPrayedAt: string | null;
  lastPrayedAt: string | null;
  daysSinceFirst: number;
  daysPrayed: number;
  currentStreak: number;
  longestStreak: number;
  /** Completed rosaries per mystery set — drives the palette of the artwork. */
  bySet: Record<MysterySetId | 'free', number>;
  /** One entry per day with at least one completed rosary, oldest first. */
  byDay: DayCount[];
  inProgress: number;
};

export const EMPTY_STATS: Stats = {
  totalCompleted: 0,
  totalDecades: 0,
  totalHailMarys: 0,
  totalMinutes: 0,
  firstPrayedAt: null,
  lastPrayedAt: null,
  daysSinceFirst: 0,
  daysPrayed: 0,
  currentStreak: 0,
  longestStreak: 0,
  bySet: { joyful: 0, luminous: 0, sorrowful: 0, glorious: 0, free: 0 },
  byDay: [],
  inProgress: 0,
};

const DAY = 86_400_000;

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
}

export function streaks(days: string[], today: string): { current: number; longest: number } {
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = diffDays(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // The current streak only survives if it reaches today or yesterday.
  const last = days[days.length - 1];
  const gap = diffDays(last, today);
  let current = 0;
  if (gap === 0 || gap === 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (diffDays(days[i - 1], days[i]) === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

