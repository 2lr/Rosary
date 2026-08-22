'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AppNav from '@/components/AppNav';
import { cx } from '@/components/ui';
import type { Lang } from '@/lib/i18n/config';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Bloom } from '@/lib/rosary/growth';
import { NAMED_STAGES, formatThreshold, roman, stageAt } from '@/lib/rosary/stages';

/**
 * The whole ladder, walked from the first stage onwards.
 *
 * It has no end, so it is not a list to be rendered but a well to be drawn
 * from: a chunk is built, and another whenever the bottom comes into view. You
 * can keep going as long as you care to scroll, which is the only honest way to
 * show something infinite.
 */

/** Stages built per pull. Enough to fill a screen twice over. */
const CHUNK = 30;

export default function StageLadder({
  bloom,
  lang,
  decades,
  onClose,
}: {
  bloom: Bloom;
  lang: Lang;
  decades: number;
  onClose: () => void;
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const [count, setCount] = useState(() => Math.max(CHUNK, bloom.stage.index + CHUNK));
  const sentinel = useRef<HTMLDivElement>(null);
  const here = useRef<HTMLLIElement>(null);

  const plain = useMemo(() => new Intl.NumberFormat(lang), [lang]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Open where the user actually stands, not at the bottom of the ladder.
  useEffect(() => {
    here.current?.scrollIntoView({ block: 'center' });
  }, []);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setCount((c) => c + CHUNK);
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const stages = useMemo(
    () => Array.from({ length: count }, (_, i) => stageAt(i)),
    [count],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bloom-bg-0)] pad-top">
      <header className="flex shrink-0 items-center justify-between px-5 pb-2">
        <div className="min-w-0">
          <h2 className="font-display text-xl">{t('journey.ladderTitle')}</h2>
          <p className="mt-0.5 truncate text-xs text-faint">
            {t('journey.ladderSub', { n: plain.format(decades) })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tap surface flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-3.5 text-sm text-[var(--bloom-ink)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          {t('common.close')}
        </button>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-28 pad-bottom">
        <ol className="relative">
          {/* The chain the stages are threaded on, like the rosary itself. */}
          <span
            aria-hidden
            className="absolute bottom-4 left-[0.3rem] top-4 w-px bg-[var(--bloom-fill-3)]"
          />

          {stages.map((stage) => {
            const reached = decades >= stage.threshold;
            const current = stage.index === bloom.stage.index;
            const named = stage.index < NAMED_STAGES;

            return (
              <li
                key={stage.key}
                ref={current ? here : undefined}
                className="relative flex gap-4 py-2.5 pl-6"
              >
                <span
                  aria-hidden
                  className={cx(
                    'absolute left-0 top-[1.15rem] rounded-full transition',
                    current
                      ? 'h-2.5 w-2.5 bg-[var(--bloom-accent)] ring-4 ring-[var(--bloom-accent)]/20'
                      : reached
                        ? 'h-2 w-2 translate-x-[0.125rem] bg-[var(--bloom-accent)]'
                        : 'h-1.5 w-1.5 translate-x-[0.1875rem] bg-[var(--bloom-fill-3)]',
                  )}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={cx(
                        'truncate font-display',
                        current
                          ? 'text-lg text-[var(--bloom-accent)]'
                          : reached
                            ? 'text-base text-[var(--bloom-ink)]'
                            : 'text-base text-faint',
                      )}
                    >
                      {stage.name[lang]}
                    </span>
                    <span
                      className={cx(
                        'shrink-0 text-xs tabular-nums',
                        reached ? 'text-muted' : 'text-faint',
                      )}
                    >
                      {formatThreshold(stage.threshold, lang)}
                    </span>
                  </div>

                  {current && (
                    <>
                      <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">
                        {stage.note[lang]}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          {Array.from({ length: bloom.degree.of }, (_, i) => (
                            <span
                              key={i}
                              className={cx(
                                'h-1 rounded-full',
                                i < bloom.degree.index
                                  ? 'w-4 bg-[var(--bloom-accent)]'
                                  : 'w-1 bg-[var(--bloom-fill-3)]',
                              )}
                            />
                          ))}
                        </span>
                        <span className="text-[0.6rem] uppercase tracking-[0.16em] text-faint">
                          {t('journey.degree', {
                            n: roman(bloom.degree.index),
                            of: roman(bloom.degree.of),
                          })}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Where the names stop being written and start being built. */}
                  {stage.index === NAMED_STAGES && (
                    <p className="mt-1 text-[0.65rem] italic text-whisper">
                      {t('journey.ladderBeyond')}
                    </p>
                  )}
                  {!named && !current && <span className="sr-only">{stage.note[lang]}</span>}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Pulling this into view builds the next stretch. There is always one. */}
        <div ref={sentinel} className="py-6 text-center text-[0.65rem] text-whisper">
          {t('journey.ladderEndless')}
        </div>
      </div>

      <AppNav t={t} />
    </div>
  );
}
