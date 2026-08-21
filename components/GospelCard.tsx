'use client';

import { useEffect, useState } from 'react';
import { Card, cx } from '@/components/ui';
import type { Lang } from '@/lib/i18n/config';
import type { translatorFor } from '@/lib/i18n/dictionary';
import type { Gospel } from '@/lib/rosary/gospel';

/**
 * The gospel read at Mass today, folded away until asked for.
 *
 * Fetched after the screen is up rather than with it: the readings come from
 * someone else's server, and the rosary should never wait on one. If nothing
 * comes back the card is simply not there.
 */
export default function GospelCard({
  lang,
  t,
}: {
  lang: Lang;
  t: ReturnType<typeof translatorFor>;
}) {
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/gospel?lang=${lang}`);
        if (!response.ok) return;
        const data = (await response.json()) as { gospel: Gospel | null };
        if (!cancelled) setGospel(data.gospel);
      } catch {
        // Nothing to show, and nothing worth saying about it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  if (!gospel) return null;

  return (
    <Card className="mt-3 overflow-hidden animate-rise">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
            {t('gospel.title')}
          </p>
          <p className="mt-0.5 truncate font-display text-lg">{gospel.reference}</p>
          {gospel.feast && (
            <p className="mt-0.5 truncate text-xs text-muted">{gospel.feast}</p>
          )}
        </div>

        <svg
          viewBox="0 0 24 24"
          className={cx(
            'h-4 w-4 shrink-0 text-faint transition-transform duration-300',
            open && 'rotate-180',
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="animate-rise px-4 pb-4">
          {gospel.intro && (
            <p className="text-xs italic text-muted">{gospel.intro}</p>
          )}
          {gospel.title && (
            <p className="mt-1.5 font-display text-sm leading-snug text-[var(--bloom-accent)]">
              {gospel.title}
            </p>
          )}

          <div className="mt-3 space-y-3">
            {gospel.paragraphs.map((paragraph, i) => (
              <p
                key={i}
                // The lectionary breaks its lines where the text is meant to be
                // drawn breath; keeping them is the whole point of the layout.
                className="whitespace-pre-line font-display text-[0.95rem] leading-relaxed text-pretty"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <p className="mt-4 text-[0.6rem] uppercase tracking-[0.14em] text-whisper">
            {gospel.credit}
          </p>
        </div>
      )}
    </Card>
  );
}
