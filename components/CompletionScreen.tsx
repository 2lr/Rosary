'use client';

import { useEffect, useMemo, useState } from 'react';
import RosaryArt from '@/components/RosaryArt';
import BloomVars from '@/components/BloomVars';
import { ButtonLink } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import type { Bloom } from '@/lib/rosary/growth';

export default function CompletionScreen({
  lang,
  decades,
  hailMarys,
  bloom,
  levelledUp,
}: {
  lang: Lang;
  decades: number;
  hailMarys: number;
  bloom: Bloom;
  levelledUp: boolean;
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const [fill, setFill] = useState(0);

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

  return (
    <>
      <BloomVars bloom={bloom} />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 pad-top pad-bottom">
        <RosaryArt bloom={bloom} fill={fill} className="h-72 w-auto" />

        <div className="-mt-4 text-center animate-rise">
          <h1 className="font-display text-3xl text-[var(--bloom-accent)]">{t('done.title')}</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            {t('done.body', { decades, hailMarys })}
          </p>

          {levelledUp ? (
            <p className="mt-5 rounded-2xl border border-[var(--bloom-accent)]/35 bg-[var(--bloom-accent)]/10 px-4 py-3 text-sm">
              {t('done.stageReached', { stage: bloom.stage.name[lang] })}
            </p>
          ) : (
            <p className="mt-5 text-sm text-faint">{t('done.grown')}</p>
          )}
        </div>

        <div className="mt-8 flex w-full flex-col gap-2.5">
          <ButtonLink href="/journey" size="lg" className="w-full">
            {t('done.journey')}
          </ButtonLink>
          <ButtonLink href="/home" variant="ghost" size="lg" className="w-full">
            {t('done.home')}
          </ButtonLink>
        </div>
      </main>
    </>
  );
}
