'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, cx } from '@/components/ui';
import type { Translator } from '@/lib/i18n/dictionary';
import { disablePush, enablePush, pushState, timeZone, type PushState } from '@/lib/client/push';
import { EARLIEST_HOUR, LATEST_HOUR } from '@/lib/push/clock';

/**
 * Being reminded, and when.
 *
 * The permission comes first because nothing else here means anything without
 * it, and it can only be asked for from a real tap. Once it is granted the hour
 * is a row of chips rather than a time field: there are nineteen sensible
 * answers and picking one should not open a keyboard.
 *
 * The zone goes up with the hour. Nine in the evening has to mean nine where
 * the person is, and the browser is the only thing that knows where that is.
 */

const HOURS = Array.from({ length: LATEST_HOUR - EARLIEST_HOUR + 1 }, (_, i) => EARLIEST_HOUR + i);

export default function NotificationsCard({
  t,
  hour,
  lineage,
}: {
  t: Translator;
  hour: number | null;
  lineage: boolean;
}) {
  const [state, setState] = useState<PushState>('unsupported');
  const [chosen, setChosen] = useState<number | null>(hour);
  const [evening, setEvening] = useState(lineage);
  const [busy, setBusy] = useState(false);

  useEffect(() => setState(pushState()), []);

  const save = useCallback(
    async (patch: { notifyHour?: number | null; notifyLineage?: boolean }) => {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, timeZone: timeZone() }),
      });
    },
    [],
  );

  async function turnOn() {
    setBusy(true);
    const next = await enablePush();
    setState(next);
    if (next === 'granted') {
      // Somebody who just said yes wants to be reminded; an hour has to be
      // chosen for that to mean anything, so one is chosen for them.
      const at = chosen ?? 8;
      setChosen(at);
      await save({ notifyHour: at, notifyLineage: evening });
    }
    setBusy(false);
  }

  return (
    <Card className="mt-4 px-4 py-4">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">{t('notify.label')}</p>
      <p className="mt-1 font-display text-lg leading-tight">{t('notify.title')}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">{t('notify.body')}</p>

      {state === 'unsupported' && (
        <p className="mt-3 text-[0.7rem] leading-relaxed text-faint text-pretty">
          {t('notify.unsupported')}
        </p>
      )}

      {state === 'denied' && (
        <p className="mt-3 text-[0.7rem] leading-relaxed text-faint text-pretty">
          {t('notify.denied')}
        </p>
      )}

      {state === 'default' && (
        <button
          type="button"
          onClick={() => void turnOn()}
          disabled={busy}
          className="tap mt-3 w-full rounded-full bg-[var(--bloom-accent)] px-4 py-3 text-sm text-[var(--bloom-on-accent)] transition disabled:opacity-40"
        >
          {t('notify.enable')}
        </button>
      )}

      {state === 'granted' && (
        <>
          <p className="mt-3 text-[0.7rem] text-[var(--bloom-accent)]">{t('notify.enabled')}</p>

          <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-faint">
            {t('notify.hour')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip
              active={chosen === null}
              label={t('notify.hourOff')}
              onClick={() => {
                setChosen(null);
                void save({ notifyHour: null });
              }}
            />
            {HOURS.map((at) => (
              <Chip
                key={at}
                active={chosen === at}
                label={t('notify.hourAt', { h: at })}
                onClick={() => {
                  setChosen(at);
                  void save({ notifyHour: at });
                }}
              />
            ))}
          </div>

          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={evening}
              onChange={(event) => {
                setEvening(event.target.checked);
                void save({ notifyLineage: event.target.checked });
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bloom-accent)]"
            />
            <span className="min-w-0">
              <span className="block text-sm leading-snug">{t('notify.lineage')}</span>
              <span className="block text-[0.68rem] text-faint">{t('notify.lineageHint')}</span>
            </span>
          </label>

          <button
            type="button"
            onClick={async () => {
              setBusy(true);
              await disablePush();
              await save({ notifyHour: null, notifyLineage: false });
              setChosen(null);
              setEvening(false);
              setBusy(false);
            }}
            disabled={busy}
            className="tap mt-3 rounded-full px-2 py-1 text-[0.68rem] text-faint transition hover:text-[var(--bloom-ink)] disabled:opacity-40"
          >
            {t('notify.off')}
          </button>
        </>
      )}
    </Card>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'tap rounded-full px-3 py-1.5 text-xs tabular-nums transition',
        active ? 'bg-[var(--bloom-accent)] text-[var(--bloom-on-accent)]' : 'surface text-muted',
      )}
    >
      {label}
    </button>
  );
}
