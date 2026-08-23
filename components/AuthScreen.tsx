'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import RosaryArt from '@/components/RosaryArt';
import LanguageToggle from '@/components/LanguageToggle';
import HtmlLang from '@/components/HtmlLang';
import { Button, Field } from '@/components/ui';
import { translatorFor } from '@/lib/i18n/dictionary';
import { type Lang } from '@/lib/i18n/config';
import { bloomFrom } from '@/lib/rosary/growth';
import { EMPTY_STATS } from '@/lib/rosary/stats';
import type { MessageKey } from '@/lib/i18n/dictionary';
import { normalizeInviteCode } from '@/lib/invite';

const ERROR_KEYS: Record<string, MessageKey> = {
  invalid_email: 'error.invalidEmail',
  password_too_short: 'error.passwordTooShort',
  password_too_long: 'error.passwordTooLong',
  email_taken: 'error.emailTaken',
  invalid_credentials: 'error.invalidCredentials',
  invalid_code: 'error.invalidCode',
};

export default function AuthScreen({ initialLang }: { initialLang: Lang }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Somebody following an invitation link arrives with the code already in it,
  // and should not have to copy it out of the address bar.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get('code');
    const valid = normalizeInviteCode(shared);
    if (valid) setCode(valid);
  }, []);

  const t = useMemo(() => translatorFor(lang), [lang]);
  // A first-day rosary: bare, waiting. It is the promise of the whole app.
  const bloom = useMemo(() => bloomFrom(EMPTY_STATS, 'welcome'), []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, lang, displayName: name || null, code }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        const key = data.error ? ERROR_KEYS[data.error] : undefined;
        setError(t(key ?? 'error.generic'));
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
        <RosaryArt bloom={bloom} className="h-64 w-auto opacity-90" fill={1} />
      </div>

      <header className="mt-4 text-center animate-rise">
        <h1 className="font-display text-[2rem] leading-tight text-balance">
          {t('auth.introTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted text-pretty">
          {t('auth.introBody')}
        </p>
      </header>

      <form onSubmit={submit} className="mt-7 space-y-3.5">
        {/* The door. Nobody gets an account without somebody else's code, so
            this is asked first — before the name, before the address. */}
        {mode === 'signup' && (
          <Field
            label={t('auth.code')}
            hint={t('auth.codeHint')}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            className="tracking-[0.2em]"
          />
        )}

        {mode === 'signup' && (
          <Field
            label={t('auth.name')}
            hint={t('auth.nameHint')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            enterKeyHint="next"
          />
        )}

        <Field
          label={t('auth.email')}
          type="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
        />

        <Field
          label={t('auth.password')}
          hint={mode === 'signup' ? t('auth.passwordHint') : undefined}
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          enterKeyHint="go"
          error={error}
        />

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? t('auth.working') : mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === 'signup' ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
        <button
          type="button"
          className="tap font-medium text-[var(--bloom-accent)] underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup');
            setError(null);
          }}
        >
          {mode === 'signup' ? t('auth.signIn') : t('auth.signUp')}
        </button>
      </p>

      <p className="mt-auto pt-8 text-center text-xs text-faint">{t('tagline')}</p>
    </main>
  );
}
