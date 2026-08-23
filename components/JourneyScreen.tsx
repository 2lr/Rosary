'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppNav from '@/components/AppNav';
import RosaryArt from '@/components/RosaryArt';
import RosaryViewer from '@/components/RosaryViewer';
import PrayerCalendar from '@/components/PrayerCalendar';
import StageLadder from '@/components/StageLadder';
import { Card, Stat, cx } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import type { Stats } from '@/lib/rosary/stats';
import { type Bloom } from '@/lib/rosary/growth';
import { roman, stageWindow } from '@/lib/rosary/stages';
import { MYSTERY_SETS, MYSTERY_SET_ORDER } from '@/lib/rosary/mysteries';
import type { Rosary } from '@/lib/rosary/types';

export default function JourneyScreen({
  lang,
  stats,
  bloom,
  rosaries,
  lineage,
}: {
  lang: Lang;
  stats: Stats;
  bloom: Bloom;
  rosaries: Rosary[];
  /** What the people invited below this one have prayed. */
  lineage: { invited: number; people: number; rosaries: number; decades: number };
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [ladder, setLadder] = useState(false);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }),
    [lang],
  );

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
        {/* Not your own prayer, but prayer that happened because you gave
            somebody a code. It belongs in the same grid as the rest. */}
        {lineage.rosaries > 0 && (
          <Stat value={lineage.rosaries} label={t('journey.lineage')} />
        )}
      </section>

      {/* A month at a time, with the dates on show: an unlabelled grid of
          squares tells you the shape of a habit but never which day was which. */}
      <Card className="mt-4 px-4 py-4">
        <PrayerCalendar lang={lang} stats={stats} t={t} />
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

      {/* The ladder has no end, so it cannot all be listed: what is shown is
          where you stand — the one behind, the one you are on with its degrees,
          and the next few. */}
      <Card className="mt-3 px-4 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
            {t('journey.stage')}
          </p>
          <p className="text-[0.65rem] text-faint">
            {t('journey.degree', {
              n: roman(bloom.degree.index),
              of: roman(bloom.degree.of),
            })}
          </p>
        </div>
        <ol className="mt-3 space-y-1.5">
          {stageWindow(bloom.stage.index).map((stage) => {
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
                <span className="flex items-center gap-2">
                  {current && (
                    <span className="flex items-center gap-1">
                      {Array.from({ length: bloom.degree.of }, (_, i) => (
                        <span
                          key={i}
                          className={cx(
                            'h-1 w-1 rounded-full',
                            i < bloom.degree.index
                              ? 'bg-[var(--bloom-accent)]'
                              : 'bg-[var(--bloom-fill-3)]',
                          )}
                        />
                      ))}
                    </span>
                  )}
                  <span className="text-xs tabular-nums">{stage.threshold}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-muted">
          {t('journey.toNext', { n: bloom.decadesToNext, stage: bloom.nextStage.name[lang] })}
        </p>

        {/* The window shows five rungs of something that has no last one. This
            is the way in to the rest of it. */}
        <button
          type="button"
          onClick={() => setLadder(true)}
          className="tap mt-3 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs text-[var(--bloom-accent)] transition hover:bg-[var(--bloom-accent)]/8"
        >
          <span>{t('journey.allStages')}</span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
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

      {ladder && (
        <StageLadder
          bloom={bloom}
          lang={lang}
          decades={stats.totalDecades}
          onClose={() => setLadder(false)}
        />
      )}

      {viewing && (
        <RosaryViewer bloom={bloom} lang={lang} onClose={() => setViewing(false)} />
      )}
    </div>
  );
}

/** 91 days ending today, laid out in seven-day columns. */
