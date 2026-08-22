'use client';

import { useEffect, useMemo, useState } from 'react';
import RosaryArt from '@/components/RosaryArt';
import { roman } from '@/lib/rosary/stages';
import BloomVars from '@/components/BloomVars';
import RosaryViewer from '@/components/RosaryViewer';
import { Button, ButtonLink, Card } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import type { Bloom } from '@/lib/rosary/growth';
import type { Change, Trait } from '@/lib/rosary/traits';

export default function CompletionScreen({
  lang,
  decades,
  hailMarys,
  bloom,
  levelledUp,
  degreeReached,
  changes,
  next,
}: {
  lang: Lang;
  decades: number;
  hailMarys: number;
  bloom: Bloom;
  levelledUp: boolean;
  /** A degree passed inside the same stage — smaller news, but news. */
  degreeReached: boolean;
  /** What is visibly different from before this rosary. */
  changes: Change[];
  /** The nearest thing still to come, so there is always a next step. */
  next: { trait: Trait; remaining: number } | null;
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const [fill, setFill] = useState(0);
  const [viewing, setViewing] = useState(false);

  // The loop lights up once, slowly, as a small act of thanksgiving.
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 2400);
      setFill(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const shown = changes.slice(0, 3);

  return (
    <>
      <BloomVars bloom={bloom} />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 pad-top pad-bottom">
        <button
          type="button"
          onClick={() => setViewing(true)}
          className="tap"
          aria-label={t('done.look')}
        >
          <RosaryArt
            bloom={bloom}
            fill={fill}
            highlight={fill > 0.99 ? shown.map((c) => c.trait.id) : undefined}
            freshGrains={fill > 0.99 ? decades : 0}
            className="h-64 w-auto"
          />
        </button>

        <div className="-mt-2 text-center animate-rise">
          <h1 className="font-display text-3xl text-[var(--bloom-accent)]">{t('done.title')}</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            {t('done.body', { decades, hailMarys })}
          </p>

          {levelledUp ? (
            <p className="mt-4 rounded-2xl border border-[var(--bloom-accent)]/35 bg-[var(--bloom-accent)]/10 px-4 py-3 text-sm">
              {t('done.stageReached', { stage: bloom.stage.name[lang] })}
            </p>
          ) : (
            degreeReached && (
              <p className="mt-4 text-sm text-muted">
                {t('done.degreeReached', {
                  n: roman(bloom.degree.index),
                  stage: bloom.stage.name[lang],
                })}
              </p>
            )
          )}
        </div>

        {/* What is actually different in the picture, in so many words. */}
        <Card className="mt-5 w-full px-4 py-4 text-left">
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">
            {t('done.changed')}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {/* One grain per decade, so this line is true every single time. */}
            <li className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bloom-accent)]" />
              <span>{t('done.heart', { n: decades })}</span>
            </li>
          </ul>
          {shown.length > 0 ? (
            <ul className="mt-1.5 space-y-1.5">
              {shown.map((change) => (
                <li key={change.trait.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bloom-accent)]" />
                  <span>
                    {t(change.trait.change)}
                    {change.steps > 1 && (
                      <span className="lining text-faint"> ×{change.steps}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-faint">{t('done.nothingVisible')}</p>
          )}

          {next && (
            <p className="mt-3 border-t border-[var(--bloom-border)] pt-3 text-xs text-faint">
              {t('done.next', { n: next.remaining, what: t(next.trait.label) })}
            </p>
          )}
        </Card>

        <div className="mt-5 flex w-full flex-col gap-2.5">
          <Button size="lg" className="w-full" onClick={() => setViewing(true)}>
            {t('done.look')}
          </Button>
          <ButtonLink href="/journey" variant="ghost" size="lg" className="w-full">
            {t('done.journey')}
          </ButtonLink>
          <ButtonLink href="/home" variant="quiet" size="md" className="w-full">
            {t('done.home')}
          </ButtonLink>
        </div>
      </main>

      {viewing && <RosaryViewer bloom={bloom} lang={lang} onClose={() => setViewing(false)} />}
    </>
  );
}
