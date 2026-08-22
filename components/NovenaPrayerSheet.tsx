'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Sheet from '@/components/Sheet';
import type { Lang } from '@/lib/i18n/config';
import type { translatorFor } from '@/lib/i18n/dictionary';
import { NOVENA_DAYS } from '@/lib/rosary/novenas';
import { novenaPrayer } from '@/lib/rosary/novenaPrayers';

/**
 * The words of a novena, for the day it is on.
 *
 * The prayer is the same on each of the nine days; some novenas also carry an
 * intention proper to the day, which comes first because it is what changes.
 * Underneath, the way out is a rosary — which is what the nine days are made
 * of, and what this app is for.
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
  const prayer = useMemo(() => novenaPrayer(novena), [novena]);

  if (!prayer) return null;

  const index = Math.min(NOVENA_DAYS, Math.max(1, day)) - 1;
  const intention = prayer.eachDay?.[lang]?.[index] ?? null;

  return (
    <Sheet title={name} onClose={onClose} closeLabel={t('common.close')}>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
        {t('novena.day', { n: Math.min(NOVENA_DAYS, Math.max(1, day)), of: NOVENA_DAYS })}
      </p>

      {/* What changes from day to day comes first. */}
      {intention && (
        <p className="mt-3 font-display text-base leading-relaxed text-[var(--bloom-accent)] text-pretty">
          {intention}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {prayer.daily[lang].map((paragraph, i) => (
          <p
            key={i}
            className="font-display text-[0.95rem] leading-relaxed text-pretty"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">{t('novena.thenPray')}</p>

      <Link
        href="/home"
        className="tap mt-4 flex w-full items-center justify-center rounded-full bg-[var(--bloom-accent)] px-4 py-3 text-sm text-[var(--bloom-on-accent)] transition"
      >
        {t('novena.thenRosary')}
      </Link>
    </Sheet>
  );
}
