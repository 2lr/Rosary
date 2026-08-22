'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Sheet from '@/components/Sheet';
import type { Lang } from '@/lib/i18n/config';
import type { translatorFor } from '@/lib/i18n/dictionary';
import { NOVENA_DAYS } from '@/lib/rosary/novenas';
import { novenaOrder } from '@/lib/rosary/novenaPrayers';

/**
 * The words of a novena, for the day it is on — the whole day, in order.
 *
 * Everything that is said is written here, from the sign of the cross to the
 * last invocation, including the Our Father, the Hail Mary and the Glory Be:
 * naming them and leaving the reader to find them is what makes a novena
 * impossible to pray from a screen. The steps are numbered because that is what
 * the page is for — going down it, once a day, nine days running.
 *
 * Some novenas also carry an intention proper to the day, which is placed
 * before the prayer because it is the part that changes.
 */
export default function NovenaPrayerSheet({
  lang,
  t,
  name,
  novena,
  day,
  onClose,
}: {
  lang: Lang;
  t: ReturnType<typeof translatorFor>;
  name: string;
  novena: string;
  /** 1 → 9. Outside that the novena is not on a day of its own. */
  day: number;
  onClose: () => void;
}) {
  const onDay = Math.min(NOVENA_DAYS, Math.max(1, day));

  const steps = useMemo(
    () =>
      novenaOrder(novena, lang, onDay, {
        opening: t('novena.stepOpening'),
        intention: t('novena.stepIntention'),
        prayer: t('novena.stepPrayer'),
        closing: t('novena.stepClosing'),
      }),
    [novena, lang, onDay, t],
  );

  if (steps.length === 0) return null;

  return (
    <Sheet title={name} onClose={onClose} closeLabel={t('common.close')}>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
        {t('novena.day', { n: onDay, of: NOVENA_DAYS })}
      </p>

      <ol className="mt-4 space-y-5">
        {steps.map((step, i) => (
          <li key={step.id}>
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-[0.62rem] tabular-nums text-faint">{i + 1}</span>
              <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">
                {step.title}
                {/* Said more than once — printed once, with how many times. */}
                {step.times && step.times > 1 && (
                  <span className="text-[var(--bloom-accent)]">
                    {` · ${t('novena.times', { n: step.times })}`}
                  </span>
                )}
              </h3>
            </div>
            <div className="mt-1.5 space-y-2 pl-5">
              {step.lines.map((line, j) => (
                <p
                  key={j}
                  className="font-display text-[0.95rem] leading-relaxed text-pretty"
                >
                  {line}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {/* The nine days are made of rosaries; this is the way back to one. */}
      <Link
        href="/home"
        className="tap mt-6 flex w-full items-center justify-center rounded-full bg-[var(--bloom-accent)] px-4 py-3 text-sm text-[var(--bloom-on-accent)] transition"
      >
        {t('novena.thenRosary')}
      </Link>
    </Sheet>
  );
}
