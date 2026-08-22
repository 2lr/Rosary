'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, cx } from '@/components/ui';
import type { Lang } from '@/lib/i18n/config';
import type { translatorFor } from '@/lib/i18n/dictionary';
import type { Stats } from '@/lib/rosary/stats';
import {
  NOVENA_DAYS,
  novenaProgress,
  novenaState,
  type Novena,
} from '@/lib/rosary/novenas';

/**
 * The novena of the moment.
 *
 * Nine days towards a feast, kept by praying the rosary on each of them — so
 * there is nothing extra to tick off. The card appears when one is running, or
 * shortly before the next one opens, and stays out of the way otherwise.
 */

/** How early the next one is worth mentioning. */
const HERALD_DAYS = 6;

type Run = { novena: string; startedOn: string };

export default function NovenaCard({
  lang,
  stats,
  t,
}: {
  lang: Lang;
  stats: Stats;
  t: ReturnType<typeof translatorFor>;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const state = useMemo(() => novenaState(today), [today]);

  const [runs, setRuns] = useState<Run[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/novenas');
        if (!response.ok) return;
        const data = (await response.json()) as { novenas: Run[] };
        if (!cancelled) setRuns(data.novenas);
      } catch {
        // Without this the card simply offers to join again; nothing breaks.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prayedDays = useMemo(
    () => new Set(stats.byDay.filter((d) => d.decades > 0).map((d) => d.date)),
    [stats.byDay],
  );

  const showing: Novena | null =
    state.active ?? (state.next && state.until <= HERALD_DAYS ? state.next : null);

  if (!showing) return null;

  const running = showing === state.active;
  const isJoined = (runs ?? []).some(
    (r) => r.novena === showing.key && r.startedOn === showing.start,
  );
  const { kept, days } = novenaProgress(showing.start, prayedDays, today);

  async function join(next: boolean) {
    if (!showing) return;
    setBusy(true);
    try {
      const response = await fetch('/api/novenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novena: showing.key, startedOn: showing.start, stop: !next }),
      });
      if (response.ok) {
        const data = (await response.json()) as { novenas: Run[] };
        setRuns(data.novenas);
      }
    } catch {
      // Leave the button as it was; tapping again will try again.
    } finally {
      setBusy(false);
    }
  }

  const dateRange = new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <Card className="mt-3 px-4 py-4 animate-rise">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('novena.label')}
        </p>
        <p className="shrink-0 text-[0.65rem] text-faint">
          {running
            ? t('novena.day', { n: state.day, of: NOVENA_DAYS })
            : t('novena.opensIn', { n: state.until })}
        </p>
      </div>

      <p className="mt-1 font-display text-lg leading-tight">{showing.name[lang]}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">
        {showing.about[lang]}
      </p>

      {/* The nine days, so the whole shape of it is visible at once. */}
      <div className="mt-3 flex items-center gap-1.5">
        {days.map((day, i) => (
          <span
            key={day.key}
            title={dateRange.format(new Date(`${day.key}T12:00:00Z`))}
            className={cx(
              'h-2 flex-1 rounded-full transition',
              day.prayed
                ? 'bg-[var(--bloom-accent)]'
                : day.ahead
                  ? 'bg-[var(--bloom-fill-2)]'
                  : 'bg-[var(--bloom-fill-3)]',
              running && state.day === i + 1 && !day.prayed && 'ring-1 ring-[var(--bloom-accent)]',
            )}
          />
        ))}
      </div>

      <p className="mt-2 text-[0.68rem] text-faint">
        {t('novena.from', {
          from: dateRange.format(new Date(`${showing.start}T12:00:00Z`)),
          to: dateRange.format(new Date(`${showing.end}T12:00:00Z`)),
        })}
        {running && ` · ${t('novena.kept', { n: kept, of: NOVENA_DAYS })}`}
      </p>

      {isJoined ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--bloom-accent)]">
            {running ? t('novena.joinedRunning') : t('novena.joinedSoon')}
          </p>
          <button
            type="button"
            onClick={() => void join(false)}
            disabled={busy}
            className="tap shrink-0 rounded-full px-2 py-1 text-[0.68rem] text-faint transition hover:text-[var(--bloom-ink)] disabled:opacity-40"
          >
            {t('novena.leave')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void join(true)}
          disabled={busy}
          className="tap mt-3 w-full rounded-full border border-[var(--bloom-accent)]/45 px-4 py-2 text-sm text-[var(--bloom-accent)] transition hover:bg-[var(--bloom-accent)]/10 disabled:opacity-40"
        >
          {t('novena.join')}
        </button>
      )}
    </Card>
  );
}
