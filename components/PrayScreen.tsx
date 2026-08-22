'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RosaryArt from '@/components/RosaryArt';
import VirginFiligree from '@/components/VirginFiligree';
import CompletionScreen from '@/components/CompletionScreen';
import { Button, cx } from '@/components/ui';
import { useRosarySync } from '@/lib/client/useRosarySync';
import { translatorFor } from '@/lib/i18n/dictionary';
import { MYSTERY_SETS } from '@/lib/rosary/mysteries';
import { prayerWith, type HailMaryVariant } from '@/lib/rosary/prayers';
import { buildSequence, firstUndoneStep, totalDecades } from '@/lib/rosary/sequence';
import { loopView } from '@/lib/rosary/loop';
import { bloomFrom, degreeFor, stageFor } from '@/lib/rosary/growth';
import { describeChanges, nextChange } from '@/lib/rosary/traits';
import { ordinal } from '@/lib/i18n/config';
import type { Bloom, BloomPreferences } from '@/lib/rosary/growth';
import type { Stats } from '@/lib/rosary/stats';
import type { Rosary, Step } from '@/lib/rosary/types';

export default function PrayScreen({
  rosary,
  bloom,
  stats,
  preferences,
  hailMary,
}: {
  rosary: Rosary;
  bloom: Bloom;
  stats: Stats;
  preferences: BloomPreferences;
  hailMary: HailMaryVariant;
}) {
  const router = useRouter();
  const lang = rosary.lang;
  const t = useMemo(() => translatorFor(lang), [lang]);

  const steps = useMemo(
    () =>
      buildSequence({
        kind: rosary.kind,
        mysterySet: rosary.mysterySet,
        mode: rosary.mode,
        lang,
      }),
    [rosary.kind, rosary.mysterySet, rosary.mode, lang],
  );

  const { progress, done, sync, update, finish } = useRosarySync(rosary);
  const [index, setIndex] = useState(() =>
    rosary.progress.done.length === 0 ? 0 : firstUndoneStep(steps, new Set(rosary.progress.done)),
  );
  const [completed, setCompleted] = useState(rosary.status === 'completed');
  // Frozen at mount: finishing calls router.refresh(), which would otherwise
  // hand us statistics that already include the rosary just prayed and make
  // every completion look like no progress at all.
  const [baseline] = useState(stats);
  const scroller = useRef<HTMLDivElement>(null);

  const step = steps[Math.min(index, steps.length - 1)];
  const view = useMemo(() => loopView(steps, done, step.id), [steps, done, step.id]);

  // What the art should frame: the decade being prayed, or the pendant during
  // the opening prayers, which is where those beads and the crucifix are. The
  // closing is left unframed so the whole rosary is seen once more at the end.
  const focus = useMemo(() => {
    if (step.decade !== undefined) {
      const base = ((step.decade - 1) % 5) * 11;
      return { beads: Array.from({ length: 11 }, (_, i) => base + i) };
    }
    return step.kind === 'closing' ? null : { pendant: true };
  }, [step.decade, step.kind]);
  const decadeTotal = totalDecades(rosary.kind);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, next));
      setIndex(clamped);
      update({ step: clamped });
      scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [steps.length, update],
  );

  const isLast = index === steps.length - 1;

  const markAndAdvance = useCallback(async () => {
    const nextDone = new Set(done);
    nextDone.add(step.id);
    const nextIndex = Math.min(steps.length - 1, index + 1);

    if (isLast) {
      update({ done: [...nextDone], step: index }, { immediate: true, status: 'completed' });
      const ok = await finish();
      if (ok) {
        setCompleted(true);
        router.refresh();
      }
      return;
    }

    update({ done: [...nextDone], step: nextIndex });
    setIndex(nextIndex);
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });

    if (navigator.vibrate) navigator.vibrate(8);
  }, [done, finish, index, isLast, router, step.id, steps.length, update]);

  // Keyboard for desktop; the phone is driven by the big button.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        void markAndAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, index, markAndAdvance]);

  if (completed) {
    const decades = steps.filter((s) => s.kind === 'decade-end' && done.has(s.id)).length;
    const hailMarys = steps.filter((s) => s.prayer === 'hailMary' && done.has(s.id)).length;
    const before = bloomFrom(baseline, rosary.userId, preferences);
    const after = bloomFrom(
      {
        ...baseline,
        totalDecades: baseline.totalDecades + decades,
        totalCompleted: baseline.totalCompleted + 1,
      },
      rosary.userId,
      preferences,
    );
    return (
      <CompletionScreen
        lang={lang}
        decades={decades}
        hailMarys={hailMarys}
        bloom={after}
        levelledUp={after.stage.key !== stageFor(baseline.totalDecades).stage.key}
        degreeReached={
          degreeFor(after.growth.input.decades).index !== degreeFor(baseline.totalDecades).index
        }
        changes={describeChanges(before.growth, after.growth)}
        next={nextChange(after.growth)}
      />
    );
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pad-top">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/home"
          className="tap surface flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-muted"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {t('pray.pause')}
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[0.65rem] uppercase tracking-[0.18em] text-faint">
            {sectionLabel(step, lang, t, decadeTotal)}
          </p>
        </div>

        <span
          className={cx(
            'w-16 text-right text-[0.6rem] tracking-wide',
            sync === 'pending' ? 'text-amber-300/80' : 'text-faint',
          )}
        >
          {sync === 'saving' ? t('pray.saving') : sync === 'pending' ? t('pray.pendingSync') : ''}
        </span>
      </header>

      {/* The one thing on this screen you are meant to be following with a
          thumb, so it takes what the screen can spare: a share of the height
          rather than a fixed box, floored on a small phone and capped on a tall
          one so the words are never pushed off. */}
      <div className="relative mt-1 flex shrink-0 justify-center">
        <RosaryArt
          bloom={bloom}
          beads={view.beads}
          pendant={view.pendant}
          medal={view.medal}
          cross={view.cross}
          focus={focus}
          className="h-[38vh] max-h-[20rem] min-h-[13rem] w-full"
          onBeadClick={(beadIndex) => jumpToBead(beadIndex, steps, view.chaplet, goTo)}
        />
        {view.chaplets > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-[var(--bloom-fill-2)] px-2 py-1 text-[0.6rem] text-faint">
            {view.chaplet}/{view.chaplets}
          </span>
        )}
      </div>

      <DecadeRail
        total={decadeTotal}
        current={step.decade ?? 0}
        completed={steps.filter((s) => s.kind === 'decade-end' && done.has(s.id)).length}
      />

      <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
        {/* The Virgin behind the words, breathing once for each prayer said:
            the key is the step, so the rise and fall begins again on every bead
            rather than running to a clock of its own. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <VirginFiligree
            key={step.id}
            className="animate-breathe h-[92%] max-h-full w-auto max-w-none"
          />
        </div>

        <div
          ref={scroller}
          className="no-scrollbar relative flex min-h-0 flex-1 flex-col justify-center overflow-y-auto"
        >
        <StepBody
          key={step.id}
          step={step}
          rosary={rosary}
          writings={progress.writings}
          hailMary={hailMary}
          onWrite={(text) =>
            update({ writings: { ...progress.writings, [String(step.id)]: text } })
          }
          t={t}
        />
        </div>
      </div>

      <footer className="relative shrink-0 pt-3 pad-bottom">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label={t('pray.back')}
            className="tap surface flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-muted disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <Button size="lg" className="h-14 flex-1" onClick={() => void markAndAdvance()}>
            {isLast ? t('pray.finish') : done.has(step.id) ? t('pray.next') : t('pray.amen')}
          </Button>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={isLast}
            aria-label={t('pray.next')}
            className="tap surface flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-muted disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[0.6rem] tabular-nums text-faint">
          {done.size} / {steps.length}
        </p>
      </footer>
    </div>
  );
}

function jumpToBead(
  beadIndex: number,
  steps: Step[],
  chaplet: number,
  goTo: (index: number) => void,
) {
  const decadeInChaplet = Math.floor(beadIndex / 11) + 1;
  const decade = (chaplet - 1) * 5 + decadeInChaplet;
  const position = beadIndex % 11;

  const target = steps.findIndex((s) =>
    position === 0
      ? s.decade === decade && s.prayer === 'ourFather'
      : s.decade === decade && s.prayer === 'hailMary' && s.beadInDecade === position,
  );
  if (target >= 0) goTo(target);
}

function DecadeRail({
  total,
  current,
  completed,
}: {
  total: number;
  current: number;
  completed: number;
}) {
  return (
    <div className="mt-2 flex shrink-0 items-center justify-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            className={cx(
              'h-1 rounded-full transition-all duration-500',
              n === current
                ? 'w-6 bg-[var(--bloom-accent)]'
                : n <= completed
                  ? 'w-3 bg-[var(--bloom-accent)]/45'
                  : 'w-3 bg-[var(--bloom-fill-3)]',
            )}
          />
        );
      })}
    </div>
  );
}

function sectionLabel(
  step: Step,
  lang: 'fr' | 'en',
  t: ReturnType<typeof translatorFor>,
  decadeTotal: number,
): string {
  if (step.decade === undefined) {
    return step.kind === 'closing' ? t('pray.conclusion') : t('pray.opening');
  }
  if (step.set) {
    // Decade first: it is the half that must survive truncation on a phone.
    return `${t('pray.decadeOf', { n: step.decade, total: decadeTotal })} · ${
      MYSTERY_SETS[step.set].name[lang]
    }`;
  }
  return t('pray.decadeOf', { n: step.decade, total: decadeTotal });
}

function StepBody({
  step,
  rosary,
  writings,
  hailMary,
  onWrite,
  t,
}: {
  step: Step;
  rosary: Rosary;
  writings: Record<string, string>;
  hailMary: HailMaryVariant;
  onWrite: (text: string) => void;
  t: ReturnType<typeof translatorFor>;
}) {
  const lang = rosary.lang;
  const written = rosary.mode === 'written';

  if (step.kind === 'mystery' && step.set && step.mystery) {
    const mystery = MYSTERY_SETS[step.set].mysteries[step.mystery - 1];
    return (
      <article className="animate-rise space-y-4 pb-2">
        <div className="text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-faint">
            {t('pray.mystery', { ordinal: ordinal(step.mystery, lang) })}
          </p>
          <h1 className="mt-1.5 font-display text-[1.85rem] leading-tight text-balance text-[var(--bloom-accent)]">
            {mystery.title[lang]}
          </h1>
          <p className="mt-1 text-xs text-faint">{mystery.scripture[lang]}</p>
        </div>

        <p className="font-display text-lg leading-relaxed text-pretty">
          {mystery.meditation[lang]}
        </p>

        <p className="text-xs text-muted">
          <span className="uppercase tracking-[0.16em] text-faint">{t('pray.fruit')} · </span>
          {mystery.fruit[lang]}
        </p>

        {written && (
          <WritingBox value={writings[String(step.id)] ?? ''} onChange={onWrite} t={t} />
        )}
      </article>
    );
  }

  if (step.kind === 'free-write') {
    return (
      <article className="animate-rise space-y-4 pb-2">
        <div className="text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-faint">
            {t('pray.decade', { n: step.decade ?? 1 })}
          </p>
          <h1 className="mt-1.5 font-display text-[1.85rem] text-[var(--bloom-accent)]">
            {t('pray.freeTitle')}
          </h1>
          {step.hint && <p className="mt-1.5 text-sm text-muted">{step.hint}</p>}
        </div>
        <WritingBox
          value={writings[String(step.id)] ?? ''}
          onChange={onWrite}
          t={t}
          rows={7}
          autoFocus
        />
      </article>
    );
  }

  // The decade picks the wording, so the words are steady while this decade
  // is being prayed and different in the next.
  const prayer = step.prayer ? prayerWith(step.prayer, hailMary, step.decade ?? 0) : null;
  if (!prayer) return null;

  return (
    <article className="animate-rise space-y-4 pb-2">
      <div className="text-center">
        <h1 className="font-display text-[1.7rem] leading-tight text-[var(--bloom-accent)]">
          {prayer.title[lang]}
        </h1>
        {step.hint && <p className="mt-1 text-xs text-faint">{step.hint}</p>}
        {step.beadInDecade && (
          <p className="mt-1 text-xs text-faint">
            {t('pray.bead', { n: step.beadInDecade, total: 10 })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {prayer.text[lang].map((paragraph, i) => (
          <p key={i} className="font-display text-[1.15rem] leading-[1.75] text-pretty">
            {paragraph}
          </p>
        ))}
      </div>

      {rosary.intention && step.kind === 'opening' && (
        <div className="surface rounded-2xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.16em] text-faint">
            {t('pray.intentionLabel')}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{rosary.intention}</p>
        </div>
      )}
    </article>
  );
}

function WritingBox({
  value,
  onChange,
  t,
  rows = 4,
  autoFocus,
}: {
  value: string;
  onChange: (text: string) => void;
  t: ReturnType<typeof translatorFor>;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('pray.writePlaceholder')}
      maxLength={4000}
      className="w-full resize-none rounded-2xl border border-[var(--bloom-border)] bg-[var(--bloom-fill)] px-4 py-3.5 font-display text-[1.05rem] leading-relaxed outline-none transition placeholder:text-[var(--bloom-placeholder)] focus:border-[var(--bloom-accent)]/60"
    />
  );
}
