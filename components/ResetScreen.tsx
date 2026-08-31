'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HtmlLang from '@/components/HtmlLang';
import LanguageToggle from '@/components/LanguageToggle';
import RosaryArt from '@/components/RosaryArt';
import { Button, Field } from '@/components/ui';
import { translatorFor, type MessageKey } from '@/lib/i18n/dictionary';
import type { Lang } from '@/lib/i18n/config';
import { bloomFrom } from '@/lib/rosary/growth';
import { EMPTY_STATS } from '@/lib/rosary/stats';

/**
 * Choosing a new password, holding a link from a mail.
 *
 * The token is read from the address rather than typed, and sent back with
 * the new password. Nothing is checked before the form is shown: telling
 * somebody their link is dead before they have even tried is a way of
 * confirming which links are live, and it costs them a second visit.
 */

const ERROR_KEYS: Record<string, MessageKey> = {
  invalid_token: 'error.invalidToken',
  password_too_short: 'error.passwordTooShort',
  password_too_long: 'error.passwordTooLong',
};

export default function ResetScreen({ initialLang }: { initialLang: Lang }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const t = useMemo(() => translatorFor(lang), [lang]);
  const bloom = useMemo(() => bloomFrom(EMPTY_STATS, 'welcome'), []);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(t(data.error ? (ERROR_KEYS[data.error] ?? 'error.generic') : 'error.generic'));
        return;
      }
      router.replace('/home');
      router.refresh();
    } catch {
      setError(t('error.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pad-top pad-bottom">
      <HtmlLang lang={lang} />
      <div className="flex items-center justify-between py-2">
        <span className="font-display text-lg tracking-wide">{t('appName')}</span>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      <div className="relative mt-2 flex justify-center">
        <RosaryArt bloom={bloom} className="h-56 w-auto opacity-90" fill={1} />
      </div>

      <header className="mt-4 text-center animate-rise">
        <h1 className="font-display text-[2rem] leading-tight text-balance">
          {t('auth.resetTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted text-pretty">
          {t('auth.resetBody')}
        </p>
      </header>

      <form onSubmit={submit} className="mt-7 space-y-3.5">
        <Field
          label={t('auth.newPassword')}
          hint={t('auth.passwordHint')}
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          enterKeyHint="go"
          error={error}
        />

        <Button type="submit" size="lg" className="w-full" disabled={busy || !token}>
          {busy ? t('auth.working') : t('auth.resetDo')}
        </Button>
      </form>

      <p className="mt-auto pt-8 text-center text-xs text-faint">{t('tagline')}</p>
    </main>
  );
}
