'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNav from '@/components/AppNav';
import LanguageToggle from '@/components/LanguageToggle';
import { Button, Card, Field } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';

type InstallPrompt = Event & { prompt: () => Promise<void> };

export default function SettingsScreen({
  user,
}: {
  user: { email: string; displayName: string | null; lang: Lang };
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(user.lang);
  const [name, setName] = useState(user.displayName ?? '');
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
      body: JSON.stringify({ lang, displayName: name.trim() || null }),
    });
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
