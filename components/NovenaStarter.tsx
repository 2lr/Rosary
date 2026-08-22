'use client';

import { useMemo, useState } from 'react';
import { cx } from '@/components/ui';
import type { Lang } from '@/lib/i18n/config';
import type { translatorFor } from '@/lib/i18n/dictionary';
import { NOVENA_DAYS, daysBetween, shiftDays } from '@/lib/rosary/novenas';

/**
 * Choosing which nine days a novena covers.
 *
 * There is only one question — what was, or will be, its first day — so that is
 * the only thing asked. Today is the usual answer; having begun a few days ago
 * is the other common one, and it must be sayable, because the days already
 * prayed should count. The feast's own dates are offered as a shortcut when
 * they are still ahead.
 *
 * The same form starts a novena and corrects one already started.
 */

/**
 * How far back a first day may be put. Far enough to enter a novena that has
 * just finished — the day after its feast is exactly when someone thinks to
 * record it — rather than only one still running.
 */
const FURTHEST_BACK = 40;

export default function NovenaStarter({
  lang,
  t,
  today,
  liturgical,
  current,
  busy,
  onConfirm,
  onCancel,
}: {
  lang: Lang;
  t: ReturnType<typeof translatorFor>;
  today: string;
  /** The first day of the feast's own nine, when they are still ahead. */
  liturgical: string | null;
  /** The day already chosen, when correcting rather than starting. */
  current?: string;
  busy: boolean;
  onConfirm: (startedOn: string) => void;
  onCancel: () => void;
}) {
  const [day, setDay] = useState(current ?? today);

  const dateOf = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    [lang],
  );
  const show = (key: string) => dateOf.format(new Date(`${key}T12:00:00Z`));

  const earliest = shiftDays(today, -FURTHEST_BACK);
  const end = shiftDays(day, NOVENA_DAYS - 1);
  const position = daysBetween(day, today) + 1;

  // Its own dates are worth one tap whether they are ahead or just behind: a
  // novena is usually recorded the day it ends, not the day it starts.
  const shortcuts = [
    { key: today, label: t('novena.dayToday') },
    ...(liturgical && liturgical !== today && liturgical >= earliest
      ? [{ key: liturgical, label: t('novena.dayItsOwn', { date: show(liturgical) }) }]
      : []),
  ];

  return (
    <div className="mt-3 rounded-2xl bg-[var(--bloom-fill)] px-3 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
        {t('novena.firstDay')}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.key}
            type="button"
            onClick={() => setDay(shortcut.key)}
            aria-pressed={day === shortcut.key}
            className={cx(
              'tap rounded-full px-3 py-1.5 text-xs transition',
              day === shortcut.key
                ? 'bg-[var(--bloom-accent)] text-[var(--bloom-on-accent)]'
                : 'surface text-muted',
            )}
          >
            {shortcut.label}
          </button>
        ))}
      </div>

      {/* Anything else, including a novena begun before today. */}
      <label className="mt-3 block">
        <span className="text-[0.68rem] text-muted">{t('novena.orPick')}</span>
        <input
          type="date"
          value={day}
          min={earliest}
          max={shiftDays(today, 400)}
          onChange={(event) => event.target.value && setDay(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--bloom-border)] bg-[var(--bloom-bg-0)] px-3 py-2 text-[16px] outline-none focus:border-[var(--bloom-accent)]/60"
        />
      </label>

      {/* What confirming actually gives, before confirming it. */}
      <p className="mt-2.5 text-[0.68rem] text-faint">
        {t('novena.from', { from: show(day), to: show(end) })}
        {end < today
          ? ` · ${t('novena.alreadyOver')}`
          : day > today
            ? ` · ${t('novena.startsOn', { date: show(day) })}`
            : ` · ${t('novena.day', { n: position, of: NOVENA_DAYS })}`}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(day)}
          disabled={busy}
          className="tap flex-1 rounded-full bg-[var(--bloom-accent)] px-4 py-2 text-sm text-[var(--bloom-on-accent)] transition disabled:opacity-40"
        >
          {current ? t('novena.saveDate') : t('novena.confirm')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="tap rounded-full px-4 py-2 text-sm text-faint transition hover:text-[var(--bloom-ink)] disabled:opacity-40"
        >
          {t('novena.cancel')}
        </button>
      </div>
    </div>
  );
}
