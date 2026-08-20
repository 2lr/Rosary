'use client';

import { useEffect, useMemo, useState } from 'react';
import Sheet from '@/components/Sheet';
import { Button, cx } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import { MYSTERY_SETS, MYSTERY_SET_ORDER, type MysterySetId } from '@/lib/rosary/mysteries';
import type { PrayerMode, RosaryKind } from '@/lib/rosary/types';

type Props = {
  kind: RosaryKind;
  lang: Lang;
  defaultSet: MysterySetId;
  onClose: () => void;
  onStarted: (rosaryId: string) => void;
};

export default function StartSheet({ kind, lang, defaultSet, onClose, onStarted }: Props) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const [set, setSet] = useState<MysterySetId>(defaultSet);
  const [mode, setMode] = useState<PrayerMode>('spoken');
  const [intention, setIntention] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSet(defaultSet), [defaultSet]);

  const title =
    kind === 'chaplet' ? t('home.chaplet') : kind === 'full' ? t('home.full') : t('home.free');

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/rosaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          mode,
          lang,
          mysterySet: kind === 'chaplet' ? set : null,
          intention: intention.trim() || null,
        }),
      });
      if (!response.ok) throw new Error('start failed');
      const data = (await response.json()) as { rosary: { id: string } };
      onStarted(data.rosary.id);
    } catch {
      setError(t('error.generic'));
      setBusy(false);
    }
  }

  return (
    <Sheet title={title} onClose={onClose} closeLabel={t('common.close')}>
      {kind === 'chaplet' && (
        <div className="space-y-2">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
            {t('home.todaysMysteries')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MYSTERY_SET_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSet(id)}
                className={cx(
                  'tap rounded-2xl border px-3 py-3 text-left text-sm transition',
                  set === id
                    ? 'border-[var(--bloom-accent)]/60 bg-[var(--bloom-accent)]/12 text-[var(--bloom-ink)]'
                    : 'border-white/10 bg-white/5 text-muted hover:bg-white/8',
                )}
              >
                <span className="block font-display text-base leading-tight">
                  {MYSTERY_SETS[id].name[lang]}
                </span>
                {id === defaultSet && (
                  <span className="mt-0.5 block text-[0.6rem] uppercase tracking-wider text-[var(--bloom-accent)]">
                    {t('home.today')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">{t('home.mode')}</p>
        <div className="grid grid-cols-2 gap-2">
          <ModeCard
            active={mode === 'spoken'}
            title={t('home.modeSpoken')}
            description={t('home.modeSpokenDesc')}
            onClick={() => setMode('spoken')}
          />
          <ModeCard
            active={mode === 'written'}
            title={t('home.modeWritten')}
            description={t('home.modeWrittenDesc')}
            onClick={() => setMode('written')}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <label
          htmlFor="intention"
          className="flex items-baseline justify-between text-[0.65rem] uppercase tracking-[0.18em] text-faint"
        >
          <span>{t('home.intention')}</span>
          <span className="normal-case tracking-normal">{t('home.optional')}</span>
        </label>
        <textarea
          id="intention"
          rows={2}
          maxLength={500}
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder={t('home.intentionPlaceholder')}
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] leading-relaxed outline-none transition placeholder:text-white/25 focus:border-[var(--bloom-accent)]/60"
        />
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      <Button size="lg" className="mt-5 w-full" onClick={start} disabled={busy}>
        {busy ? t('auth.working') : t('home.start')}
      </Button>
    </Sheet>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'tap rounded-2xl border px-3 py-3 text-left transition',
        active
          ? 'border-[var(--bloom-accent)]/60 bg-[var(--bloom-accent)]/12'
          : 'border-white/10 bg-white/5 hover:bg-white/8',
      )}
    >
      <span className="block font-display text-base">{title}</span>
      <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted">{description}</span>
    </button>
  );
}
