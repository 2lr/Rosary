'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNav from '@/components/AppNav';
import LanguageToggle from '@/components/LanguageToggle';
import AppearanceCard, { type Appearance } from '@/components/AppearanceCard';
import InviteCard from '@/components/InviteCard';
import { Button, Card, Field } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import { bloomFrom } from '@/lib/rosary/growth';
import { applyBloomVars } from '@/lib/rosary/theme';
import type { Lang } from '@/lib/i18n/config';
import type { Stats } from '@/lib/rosary/stats';
import {
  HAIL_MARY,
  HAIL_MARY_VARIANTS,
  type HailMaryVariant,
} from '@/lib/rosary/prayers';
import { cx } from '@/components/ui';

type InstallPrompt = Event & { prompt: () => Promise<void> };

export default function SettingsScreen({
  user,
  stats,
}: {
  user: Appearance & {
    id: string;
    email: string;
    displayName: string | null;
    lang: Lang;
    hailMary: HailMaryVariant;
  };
  stats: Stats;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(user.lang);
  const [name, setName] = useState(user.displayName ?? '');
  const [appearance, setAppearance] = useState<Appearance>({
    colors: user.colors,
    shape: user.shape,
  });
  const [hailMary, setHailMary] = useState<HailMaryVariant>(user.hailMary);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);

  const t = useMemo(() => translatorFor(lang), [lang]);

  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function save() {
    setBusy(true);
    setSaved(false);
    await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lang,
        displayName: name.trim() || null,
        colors: appearance.colors,
        shape: appearance.shape,
        hailMary,
      }),
    });
    // Repaint the whole app now rather than when the next page comes back
    // from the server. The colours are computed here from the same function
    // the server uses, so there is nothing to wait for.
    applyBloomVars(
      bloomFrom(stats, user.id, { colors: appearance.colors, shape: appearance.shape }),
    );

    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pad-top">
      <header className="text-center">
        <h1 className="font-display text-3xl">{t('settings.title')}</h1>
      </header>

      <Card className="mt-6 space-y-5 px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted">{t('settings.language')}</span>
          <LanguageToggle
            lang={lang}
            onChange={(next) => {
              setLang(next);
              setSaved(false);
            }}
          />
        </div>

        <Field
          label={t('settings.name')}
          placeholder={t('settings.namePlaceholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={80}
          autoComplete="given-name"
        />

        <Button className="w-full" onClick={() => void save()} disabled={busy}>
          {saved ? t('settings.saved') : t('settings.save')}
        </Button>
      </Card>

      {/* Also on the home screen, because it is the only way anybody else gets
          in — but this is where people come looking for their own code. */}
      <InviteCard t={t} />

      <AppearanceCard
        t={t}
        stats={stats}
        userId={user.id}
        value={appearance}
        onChange={(next) => {
          setAppearance(next);
          setSaved(false);
        }}
      />

      {/* The Hail Mary is said fifty-three times in a rosary, so its wording is
          the one worth choosing. The others are left as they are. */}
      <Card className="mt-3 px-4 py-5">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('settings.hailMary')}
        </p>
        <p className="mt-1.5 text-xs text-muted">{t('settings.hailMaryHint')}</p>

        <div className="mt-3 flex gap-1.5">
          {HAIL_MARY_VARIANTS.map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => {
                setHailMary(variant);
                setSaved(false);
              }}
              aria-pressed={hailMary === variant}
              className={cx(
                'tap flex-1 rounded-full px-3 py-2 text-xs transition',
                hailMary === variant
                  ? 'bg-[var(--bloom-accent)] text-[var(--bloom-on-accent)]'
                  : 'surface text-muted',
              )}
            >
              {HAIL_MARY[variant].name[lang]}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-faint">{HAIL_MARY[hailMary].note[lang]}</p>

        {/* Seeing the words themselves is the only way to choose between them,
            and when there are several, seeing that they differ. */}
        <div className="mt-3 space-y-2.5">
          {HAIL_MARY[hailMary].wordings.map((wording, i) => (
            <blockquote key={i} className="border-l border-[var(--bloom-fill-3)] pl-3">
              <p className="font-display text-sm leading-relaxed text-muted text-pretty">
                {wording.text[lang][0]}
              </p>
            </blockquote>
          ))}
        </div>

        <Button className="mt-4 w-full" onClick={() => void save()} disabled={busy}>
          {saved ? t('settings.saved') : t('settings.save')}
        </Button>
      </Card>

      <Card className="mt-3 space-y-3 px-4 py-5">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('settings.install')}
        </p>
        {standalone ? (
          <p className="text-sm text-muted">{t('settings.installed')}</p>
        ) : installPrompt ? (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              void installPrompt.prompt();
              setInstallPrompt(null);
            }}
          >
            {t('settings.installAndroid')}
          </Button>
        ) : (
          <p className="text-sm leading-relaxed text-muted">{t('settings.installIos')}</p>
        )}
      </Card>

      <Card className="mt-3 space-y-3 px-4 py-5">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('settings.account')}
        </p>
        <p className="truncate text-sm text-muted">{user.email}</p>
        <Button variant="ghost" className="w-full" onClick={() => void signOut()}>
          {t('auth.signOut')}
        </Button>
      </Card>

      <Card className="mt-3 px-4 py-5">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          {t('settings.about')}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t('settings.aboutBody')}</p>
      </Card>

      <AppNav t={t} />
    </div>
  );
}
