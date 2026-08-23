'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sheet from '@/components/Sheet';
import { recordPrayed } from '@/lib/client/recordPrayed';
import { Button, cx } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import { MYSTERY_SETS, MYSTERY_SET_ORDER, type MysterySetId } from '@/lib/rosary/mysteries';
import type { PrayerMode, RosaryKind } from '@/lib/rosary/types';

type Props = {
  lang: Lang;
  defaultSet: MysterySetId;
  onClose: () => void;
  onStarted: (rosaryId: string) => void;
};

/**
 * What is prayed is chosen here rather than on the home screen. The home screen
 * asks one thing — start — and everything that used to sit under it as extra
 * options lives in this sheet: which mysteries, or a rosary with none.
 */
type Choice = MysterySetId | 'free' | 'full';

export default function StartSheet({ lang, defaultSet, onClose, onStarted }: Props) {
  const router = useRouter();
  const t = useMemo(() => translatorFor(lang), [lang]);
  const [choice, setChoice] = useState<Choice>(defaultSet);
  const [mode, setMode] = useState<PrayerMode>('spoken');
  const [intention, setIntention] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setChoice(defaultSet), [defaultSet]);

  const kind: RosaryKind = choice === 'free' ? 'free' : choice === 'full' ? 'full' : 'chaplet';
  const mysterySet = kind === 'chaplet' ? (choice as MysterySetId) : null;

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
          mysterySet,
          intention: intention.trim() || null,
          notifyEmail: notifyEmail.trim() || null,
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

  // The same choices, for a rosary already prayed on real beads: it is written
  // down whole rather than tapped through, and counts for exactly the same.
  async function record() {
    setBusy(true);
    setError(null);
    const ok = await recordPrayed({
      kind,
      mysterySet,
      lang,
      intention: intention.trim() || null,
      notifyEmail: notifyEmail.trim() || null,
    });
    if (!ok) {
      setError(t('error.generic'));
      setBusy(false);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Sheet title={t('home.myChaplet')} onClose={onClose} closeLabel={t('common.close')}>
      <div className="space-y-2">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('home.whichMysteries')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MYSTERY_SET_ORDER.map((id) => (
            <Choice
              key={id}
              active={choice === id}
              title={MYSTERY_SETS[id].name[lang]}
              badge={id === defaultSet ? t('home.today') : undefined}
              onClick={() => setChoice(id)}
            />
          ))}
        </div>

        {/* Neither of these has mysteries to pick, so they sit apart from the
            four rather than pretending to be a fifth and a sixth. */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Choice
            active={choice === 'free'}
            title={t('home.free')}
            description={t('home.freeDesc')}
            onClick={() => setChoice('free')}
          />
          <Choice
            active={choice === 'full'}
            title={t('home.full')}
            description={t('home.fullDesc')}
            onClick={() => setChoice('full')}
          />
        </div>
      </div>

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
          className="w-full resize-none rounded-2xl border border-[var(--bloom-border)] bg-[var(--bloom-fill)] px-4 py-3 text-[16px] leading-relaxed outline-none transition placeholder:text-[var(--bloom-placeholder)] focus:border-[var(--bloom-accent)]/60"
        />
      </div>

      {/* Praying for somebody, and letting them know. The address is used once,
          when the chaplet is finished, and carries neither the name of whoever
          prayed nor what they prayed for. */}
      <div className="mt-4 space-y-2">
        <label
          htmlFor="notify"
          className="flex items-baseline justify-between text-[0.65rem] uppercase tracking-[0.18em] text-faint"
        >
          <span>{t('home.forWhom')}</span>
          <span className="normal-case tracking-normal">{t('home.optional')}</span>
        </label>
        <input
          id="notify"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          spellCheck={false}
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          placeholder={t('home.forWhomPlaceholder')}
          className="w-full rounded-2xl border border-[var(--bloom-border)] bg-[var(--bloom-fill)] px-4 py-3 text-[16px] outline-none transition placeholder:text-[var(--bloom-placeholder)] focus:border-[var(--bloom-accent)]/60"
        />
        <p className="text-[0.65rem] leading-relaxed text-faint text-pretty">
          {t('home.forWhomHint')}
        </p>
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      {/* Two answers to the same question, and neither is the small one: pray
          it now on the screen, or say it was already prayed on real beads. */}
      <Button size="lg" className="mt-5 w-full" onClick={start} disabled={busy}>
        {busy ? t('auth.working') : t('home.start')}
      </Button>

      <button
        type="button"
        onClick={() => void record()}
        disabled={busy}
        className="tap mt-2.5 w-full rounded-full border border-[var(--bloom-accent)] px-4 py-3.5 text-base text-[var(--bloom-accent)] transition disabled:opacity-40"
      >
        {t('home.alreadyPrayedShort')}
      </button>
    </Sheet>
  );
}

function Choice({
  active,
  title,
  description,
  badge,
  onClick,
}: {
  active: boolean;
  title: string;
  description?: string;
  badge?: string;
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
          ? 'border-[var(--bloom-accent)]/60 bg-[var(--bloom-accent)]/12 text-[var(--bloom-ink)]'
          : 'border-[var(--bloom-border)] bg-[var(--bloom-fill)] text-muted hover:bg-[var(--bloom-fill-2)]',
      )}
    >
      <span className="block font-display text-base leading-tight">{title}</span>
      {badge && (
        <span className="mt-0.5 block text-[0.6rem] uppercase tracking-wider text-[var(--bloom-accent)]">
          {badge}
        </span>
      )}
      {description && (
        <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted">{description}</span>
      )}
    </button>
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
          : 'border-[var(--bloom-border)] bg-[var(--bloom-fill)] hover:bg-[var(--bloom-fill-2)]',
      )}
    >
      <span className="block font-display text-base">{title}</span>
      <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted">{description}</span>
    </button>
  );
}
