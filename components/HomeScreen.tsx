'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import RosaryArt from '@/components/RosaryArt';
import AppNav from '@/components/AppNav';
import StartSheet from '@/components/StartSheet';
import RosaryViewer from '@/components/RosaryViewer';
import GospelCard from '@/components/GospelCard';
import InviteCard from '@/components/InviteCard';
import NovenaCard from '@/components/NovenaCard';
import { Button, ButtonLink, Card, cx } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import type { Stats } from '@/lib/rosary/stats';
import type { Bloom } from '@/lib/rosary/growth';
import { MYSTERY_SETS, type MysterySetId } from '@/lib/rosary/mysteries';
import { buildSequence } from '@/lib/rosary/sequence';
import { nextMilestone } from '@/lib/rosary/traits';
import { roman } from '@/lib/rosary/stages';
import StageLadder from '@/components/StageLadder';
import type { Rosary } from '@/lib/rosary/types';

type Props = {
  user: { displayName: string | null; lang: Lang };
  stats: Stats;
  bloom: Bloom;
  openRosary: Rosary | null;
  todaysSet: MysterySetId;
};

export default function HomeScreen({ user, stats, bloom, openRosary, todaysSet }: Props) {
  const router = useRouter();
  const lang = user.lang;
  const t = useMemo(() => translatorFor(lang), [lang]);
  const sign = useMemo(() => nextMilestone(bloom.growth), [bloom.growth]);

  const [starting, setStarting] = useState(false);
  const [ladder, setLadder] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const greeting = !now
    ? t('auth.welcome')
    : now.getHours() < 12
      ? t('home.greetingMorning')
      : now.getHours() < 18
        ? t('home.greetingAfternoon')
        : t('home.greetingEvening');

  const dateLabel = now
    ? new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
    : '';

  const set = MYSTERY_SETS[todaysSet];

  const prayedToday =
    stats.byDay.length > 0 && now
      ? stats.byDay[stats.byDay.length - 1].date === now.toISOString().slice(0, 10)
      : false;

  const resumePercent = openRosary ? percentOf(openRosary) : 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pad-top">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-2xl">
            {greeting}
            {user.displayName ? `, ${user.displayName}` : ''}
          </p>
          <p className="mt-0.5 text-xs capitalize text-faint">{dateLabel || ' '}</p>
        </div>
        <span
          className={cx(
            'rounded-full px-2.5 py-1 text-[0.65rem] tracking-wide',
            prayedToday
              ? 'bg-[var(--bloom-accent)]/15 text-[var(--bloom-accent)]'
              : 'surface text-faint',
          )}
        >
          {prayedToday ? t('home.prayedToday') : t('home.notPrayedToday')}
        </span>
      </header>

      {/* The rosary itself: it is the user's record, drawn. Tapping it opens
          the close-up, where every detail can be inspected. */}
      <button
        type="button"
        onClick={() => setViewing(true)}
        className="tap relative mt-1 flex justify-center"
        aria-label={t('done.look')}
      >
        <RosaryArt
          bloom={bloom}
          fill={1}
          className="h-[17rem] w-auto"
          title={`${bloom.stage.name[lang]}`}
        />
        <span className="absolute bottom-0 right-1 rounded-full px-2 py-1 text-[0.6rem] text-faint">
          {t('done.look')}
        </span>
      </button>

      <section className="-mt-3 text-center animate-rise">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-faint">
          {t('journey.stage')}
        </p>
        <button
          type="button"
          onClick={() => setLadder(true)}
          className="tap rounded-2xl px-3 py-0.5"
          aria-label={t('journey.allStages')}
        >
          <h1 className="font-display text-3xl text-[var(--bloom-accent)]">
            {bloom.stage.name[lang]}
          </h1>
        </button>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted text-pretty">
          {bloom.stage.note[lang]}
        </p>

        {/* Two scales, because they answer different questions. The dots say
            what moves this week; the bar and the line say what you are climbing
            towards. A stage alone left hundreds of decades with nothing to
            show. */}
        <div className="mx-auto mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: bloom.degree.of }, (_, i) => (
            <span
              key={i}
              className={cx(
                'h-1.5 rounded-full transition-all duration-500',
                i < bloom.degree.index
                  ? 'w-5 bg-[var(--bloom-accent)]'
                  : 'w-1.5 bg-[var(--bloom-fill-3)]',
              )}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-faint">
          {t('journey.degree', { n: roman(bloom.degree.index), of: roman(bloom.degree.of) })}
        </p>

        <div className="mx-auto mt-3.5 max-w-[15rem]">
          <div className="h-1 overflow-hidden rounded-full bg-[var(--bloom-fill-2)]">
            <div
              className="h-full rounded-full bg-[var(--bloom-accent)] transition-[width] duration-700"
              style={{ width: `${Math.round(bloom.toNext * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[0.68rem] text-faint">
            {t('journey.toNext', {
              n: bloom.decadesToNext,
              stage: bloom.nextStage.name[lang],
            })}
          </p>
        </div>

        {/* Barely there on purpose: a hint of what is coming, for whoever
            looks for it, without turning prayer into a progress bar. A chaplet
            is five decades, so anything within five arrives next time. */}
        {sign && (
          <p className="mt-4 text-[0.6rem] italic tracking-wide text-whisper">
            {sign.remaining <= 5
              ? t('home.nextSignSoon', { sign: t(sign.trait.label).toLowerCase() })
              : t('home.nextSignAt', {
                  sign: t(sign.trait.label).toLowerCase(),
                  n: sign.remaining,
                })}
          </p>
        )}
      </section>

      {openRosary && (
        <Card className="mt-6 p-4 animate-rise">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
                {t('journey.inProgress')}
              </p>
              <p className="truncate font-display text-lg">{labelFor(openRosary, lang, t)}</p>
              <p className="mt-0.5 text-xs text-muted">
                {t('home.resumeAt', { progress: resumePercent })}
              </p>
            </div>
            <ButtonLink href={`/pray/${openRosary.id}`} size="sm" className="shrink-0">
              {t('journey.resume')}
            </ButtonLink>
          </div>
        </Card>
      )}

      {/* One thing to do, and it is obvious. Three cards side by side asked a
          question nobody came here to answer: on most days the chaplet of the
          day is simply what you pray. The other two kinds stay reachable, a
          line below, for whoever actually wants them. */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[0.65rem] uppercase tracking-[0.22em] text-faint">
            {t('home.todaysMysteries')}
          </h2>
          <span className="text-xs text-muted">{set.name[lang]}</span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted text-pretty">
          {set.mysteries.map((m) => m.title[lang]).join(' · ')}
        </p>

        <Button size="lg" className="mt-4 w-full" onClick={() => setStarting(true)}>
          {t('home.startToday')}
        </Button>

        {/* Nine days towards a feast, kept by praying the rosary on each of
            them. Only here when there is one to keep. */}
        <NovenaCard lang={lang} stats={stats} t={t} />

        {/* The day's own word, under the day's mysteries. Folded away: it is
            there for whoever wants it, and never in the way of praying. */}
        <div className="mt-4">
          <GospelCard lang={lang} t={t} />
        </div>
      </section>

      {/* The only door into this app is somebody's code, so the way to give
          yours is on the first screen rather than buried in the settings. */}
      <InviteCard t={t} />

      <section className="mt-6 grid grid-cols-3 gap-2.5">
        <MiniStat value={stats.totalCompleted} label={t('journey.rosaries')} />
        <MiniStat value={stats.totalDecades} label={t('journey.decades')} />
        <MiniStat value={stats.currentStreak} label={t('journey.streak')} />
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

      {starting && (
        <StartSheet
          lang={lang}
          defaultSet={todaysSet}
          onClose={() => setStarting(false)}
          onStarted={(id) => router.push(`/pray/${id}`)}
        />
      )}
    </div>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="surface rounded-2xl px-3 py-3 text-center">
      <div className="lining font-display text-2xl leading-none">{value}</div>
      <div className="mt-1 text-[0.6rem] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  );
}

function percentOf(rosary: Rosary): number {
  const steps = buildSequence({
    kind: rosary.kind,
    mysterySet: rosary.mysterySet,
    mode: rosary.mode,
    lang: rosary.lang,
  });
  if (steps.length === 0) return 0;
  return Math.round((rosary.progress.done.length / steps.length) * 100);
}

function labelFor(
  rosary: Rosary,
  lang: Lang,
  t: ReturnType<typeof translatorFor>,
): string {
  if (rosary.kind === 'free') return t('home.free');
  if (rosary.kind === 'full') return t('home.full');
  return rosary.mysterySet ? MYSTERY_SETS[rosary.mysterySet].name[lang] : t('home.chaplet');
}
