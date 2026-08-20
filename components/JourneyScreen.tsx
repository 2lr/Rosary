'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppNav from '@/components/AppNav';
import RosaryArt from '@/components/RosaryArt';
import RosaryViewer from '@/components/RosaryViewer';
import PrayerCalendar from '@/components/PrayerCalendar';
import { Card, Stat, cx } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import type { Stats } from '@/lib/rosary/stats';
import { STAGES, type Bloom } from '@/lib/rosary/growth';
import { MYSTERY_SETS, MYSTERY_SET_ORDER } from '@/lib/rosary/mysteries';
import type { Rosary } from '@/lib/rosary/types';

export default function JourneyScreen({
  lang,
  stats,
  bloom,
  rosaries,
}: {
  lang: Lang;
  stats: Stats;
  bloom: Bloom;
  rosaries: Rosary[];
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }),
    [lang],
  );
  const shortFormat = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }),
    [lang],
  );

  const heatmap = useMemo(() => buildHeatmap(stats), [stats]);
  const maxSet = Math.max(1, ...MYSTERY_SET_ORDER.map((id) => stats.bySet[id]));

  async function remove(id: string) {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    await fetch(`/api/rosaries/${id}`, { method: 'DELETE' });
    setPendingDelete(null);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pad-top">
      <header className="text-center">
        <h1 className="font-display text-3xl">{t('journey.title')}</h1>
        <p className="mt-1 text-xs text-faint">
          {stats.firstPrayedAt
            ? t('journey.since', { date: dateFormat.format(new Date(stats.firstPrayedAt)) })
            : t('journey.sinceNever')}
        </p>
      </header>

      <button
        type="button"
        onClick={() => setViewing(true)}
        className="tap relative mt-1 flex justify-center"
        aria-label={t('done.look')}
      >
        <RosaryArt bloom={bloom} fill={1} className="h-52 w-auto" />
      </button>

      <section className="grid grid-cols-3 gap-2.5">
        <Stat value={stats.totalCompleted} label={t('journey.rosaries')} />
        <Stat value={stats.totalDecades} label={t('journey.decades')} />
        <Stat value={stats.totalHailMarys} label={t('journey.hailMarys')} />
        <Stat value={stats.currentStreak} label={t('journey.streak')} />
        <Stat value={stats.longestStreak} label={t('journey.longestStreak')} />
        <Stat value={stats.daysPrayed} label={t('journey.daysPrayed')} />
      </section>

      {/* A month at a time, with the dates on show: an unlabelled grid of
          squares tells you the shape of a habit but never which day was which. */}
      <Card className="mt-4 px-4 py-4">
        <PrayerCalendar lang={lang} stats={stats} t={t} />
      </Card>

      {/* And the longer view underneath, where the run matters more than the
          date: three months of squares, one per day. */}
      <Card className="mt-3 px-4 py-4">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('journey.lastNinety')}
        </p>
        <div className="mt-3 grid grid-flow-col grid-rows-7 gap-[3px]">
          {heatmap.map((cell) => (
            <span
              key={cell.date}
              title={`${shortFormat.format(new Date(`${cell.date}T12:00:00Z`))} — ${cell.decades}`}
              className="aspect-square rounded-[3px]"
              style={{
                background:
                  cell.decades === 0
                    ? 'var(--bloom-fill)'
                    : `color-mix(in srgb, var(--bloom-accent) ${Math.min(100, 26 + cell.decades * 11)}%, transparent)`,
              }}
            />
          ))}
        </div>
      </Card>

      {/* Which mysteries the user actually prays — this drives the palette. */}
      <Card className="mt-3 px-4 py-4">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('journey.bySet')}
        </p>
        <div className="mt-3 space-y-2.5">
          {MYSTERY_SET_ORDER.map((id) => (
            <div key={id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-muted">
                {MYSTERY_SETS[id].name[lang]}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bloom-fill-2)]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(stats.bySet[id] / maxSet) * 100}%`,
                    background: `hsl(${MYSTERY_SETS[id].hue} 55% 62%)`,
                  }}
                />
              </span>
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-faint">
                {stats.bySet[id]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* The ladder of stages, so the next one is always visible. */}
      <Card className="mt-3 px-4 py-4">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('journey.stage')}
        </p>
        <ol className="mt-3 space-y-1.5">
          {STAGES.map((stage) => {
            const reached = stats.totalDecades >= stage.threshold;
            const current = stage.key === bloom.stage.key;
            return (
              <li
                key={stage.key}
                className={cx(
                  'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                  current
                    ? 'bg-[var(--bloom-accent)]/12 text-[var(--bloom-ink)]'
                    : reached
                      ? 'text-muted'
                      : 'text-faint',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cx(
                      'h-1.5 w-1.5 rounded-full',
                      reached ? 'bg-[var(--bloom-accent)]' : 'bg-[var(--bloom-fill-3)]',
                    )}
                  />
                  <span className="font-display text-base">{stage.name[lang]}</span>
                </span>
                <span className="text-xs tabular-nums">{stage.threshold}</span>
              </li>
            );
          })}
        </ol>
        {bloom.nextStage && (
          <p className="mt-3 text-xs text-muted">
            {t('journey.toNext', { n: bloom.decadesToNext, stage: bloom.nextStage.name[lang] })}
          </p>
        )}
      </Card>

      <section className="mt-5">
        <h2 className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('journey.history')}
        </h2>

        {rosaries.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t('journey.noHistory')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rosaries.map((rosary) => (
              <Card as="li" key={rosary.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base">
                      {rosary.kind === 'free'
                        ? t('home.free')
                        : rosary.kind === 'full'
                          ? t('home.full')
                          : rosary.mysterySet
                            ? MYSTERY_SETS[rosary.mysterySet].name[lang]
                            : t('home.chaplet')}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {dateFormat.format(new Date(rosary.completedAt ?? rosary.startedAt))}
                      {rosary.status === 'in_progress' && ` · ${t('journey.inProgress')}`}
                      {rosary.status === 'completed' &&
                        ` · ${rosary.decadesCompleted} ${t('journey.decades').toLowerCase()}`}
                    </p>
                    {rosary.intention && (
                      <p className="mt-1 truncate text-xs italic text-muted">
                        “{rosary.intention}”
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {rosary.status === 'in_progress' && (
                      <Link
                        href={`/pray/${rosary.id}`}
                        className="tap rounded-full bg-[var(--bloom-accent)] px-3 py-1.5 text-xs font-medium text-[var(--bloom-on-accent)]"
                      >
                        {t('journey.resume')}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(rosary.id)}
                      onBlur={() => setPendingDelete(null)}
                      className={cx(
                        'tap rounded-full px-2.5 py-1.5 text-xs transition',
                        pendingDelete === rosary.id
                          ? 'bg-rose-500/20 text-rose-200'
                          : 'text-faint hover:text-rose-300',
                      )}
                    >
                      {pendingDelete === rosary.id ? t('journey.confirmDelete') : '×'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <AppNav t={t} />

      {viewing && (
        <RosaryViewer bloom={bloom} lang={lang} onClose={() => setViewing(false)} />
      )}
    </div>
  );
}

/** 91 days ending today, laid out in seven-day columns. */
function buildHeatmap(stats: Stats): { date: string; decades: number }[] {
  const byDate = new Map(stats.byDay.map((d) => [d.date, d.decades]));
  const cells: { date: string; decades: number }[] = [];
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  for (let i = 90; i >= 0; i--) {
    const day = new Date(today.getTime() - i * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    cells.push({ date: key, decades: byDate.get(key) ?? 0 });
  }
  return cells;
}
