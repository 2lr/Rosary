'use client';

import { useMemo, useState } from 'react';
import { cx } from '@/components/ui';
import type { Lang } from '@/lib/i18n/config';
import type { translatorFor } from '@/lib/i18n/dictionary';
import type { Stats } from '@/lib/rosary/stats';
import { monthCells, monthKey, weekdayLabels } from '@/lib/rosary/calendar';

/** A month of prayer, with the days actually shown. */

export default function PrayerCalendar({
  lang,
  stats,
  t,
}: {
  lang: Lang;
  stats: Stats;
  t: ReturnType<typeof translatorFor>;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = today.toISOString().slice(0, 10);

  const [offset, setOffset] = useState(0);

  const byDate = useMemo(
    () => new Map(stats.byDay.map((d) => [d.date, d])),
    [stats.byDay],
  );

  // The month on show, counted back from this one.
  const shown = useMemo(() => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  }, [today, offset]);

  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(Date.UTC(shown.year, shown.month, 1)),
      ),
    [lang, shown],
  );

  const weekdays = useMemo(() => weekdayLabels(lang), [lang]);

  const cells = useMemo(
    () => monthCells({ year: shown.year, month: shown.month, lang, byDate, todayKey }),
    [shown, lang, byDate, todayKey],
  );

  // Never before the first rosary, never past this month.
  const earliest = stats.firstPrayedAt?.slice(0, 7) ?? todayKey.slice(0, 7);
  const canGoBack = monthKey(shown.year, shown.month) > earliest;
  const canGoForward = offset < 0;

  const prayedThisMonth = cells.filter((c) => c.day > 0 && c.decades > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('journey.calendar')}
        </p>
        <div className="flex items-center gap-1">
          <Arrow
            direction="back"
            label={t('journey.prevMonth')}
            disabled={!canGoBack}
            onClick={() => setOffset((o) => o - 1)}
          />
          <span className="min-w-[8.5rem] text-center font-display text-sm capitalize">
            {monthName}
          </span>
          <Arrow
            direction="forward"
            label={t('journey.nextMonth')}
            disabled={!canGoForward}
            onClick={() => setOffset((o) => o + 1)}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {weekdays.map((label, i) => (
          <span
            key={`weekday-${i}`}
            className="pb-1 text-center text-[0.6rem] uppercase tracking-wide text-faint"
          >
            {label}
          </span>
        ))}

        {cells.map((cell) =>
          cell.day === 0 ? (
            <span key={cell.key} />
          ) : (
            <span
              key={cell.key}
              title={
                cell.decades
                  ? `${cell.day} — ${t('journey.dayPrayed', { n: cell.decades })}`
                  : undefined
              }
              className={cx(
                'flex aspect-square items-center justify-center rounded-full text-xs tabular-nums transition',
                cell.today && 'ring-1 ring-[var(--bloom-accent)]',
                cell.decades
                  ? 'font-medium text-[var(--bloom-on-accent)]'
                  : cell.ahead
                    ? 'text-whisper'
                    : 'text-faint',
              )}
              style={
                cell.decades
                  ? {
                      // Darker the more was prayed, so a heavy day reads at a
                      // glance without a legend.
                      background: `color-mix(in srgb, var(--bloom-accent) ${Math.min(
                        100,
                        55 + cell.decades * 5,
                      )}%, transparent)`,
                    }
                  : undefined
              }
            >
              {cell.day}
            </span>
          ),
        )}
      </div>

      {prayedThisMonth > 0 && (
        <p className="mt-3 text-center text-[0.68rem] text-faint">
          {t('journey.daysPrayed')} · {prayedThisMonth}
        </p>
      )}
    </div>
  );
}

function Arrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: 'back' | 'forward';
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="tap flex h-7 w-7 items-center justify-center rounded-full text-muted transition disabled:opacity-25"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={direction === 'back' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}
