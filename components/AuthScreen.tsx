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
  invalid_token: 'error.invalidToken',
};

export default function AuthScreen({ initialLang }: { initialLang: Lang }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [sent, setSent] = useState<'no' | 'yes' | 'unconfigured'>('no');
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
      // Forgetting a password is a different errand: it asks for the address
      // and nothing else, and it never says whether that address is known.
      if (mode === 'forgot') {
        const response = await fetch('/api/auth/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = (await response.json().catch(() => ({}))) as { mail?: string };
        setSent(data.mail === 'unconfigured' ? 'unconfigured' : 'yes');
        return;
      }

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
          {mode === 'forgot' ? t('auth.forgotTitle') : t('auth.introTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted text-pretty">
          {mode === 'forgot' ? t('auth.forgotBody') : t('auth.introBody')}
        </p>
      </header>

      {mode === 'forgot' && sent !== 'no' && (
        <p className="mt-6 rounded-2xl bg-[var(--bloom-fill)] px-4 py-3 text-sm leading-relaxed text-muted text-pretty">
          {sent === 'unconfigured' ? t('auth.forgotUnconfigured') : t('auth.forgotSent')}
        </p>
      )}

      <form onSubmit={submit} className="mt-7 space-y-3.5">
        {/* The door. Nobody gets an account without an invitation, so this is
            asked first — but it is not required here, because the address
            itself can be the invitation: somebody prayed for it and named it,
            and the server knows. Which of the two let them in is its call. */}
        {mode === 'signup' && (
          <Field
            label={t('auth.code')}
            hint={t('auth.codeHint')}
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

        {mode !== 'forgot' && (
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
        )}

        {mode === 'forgot' && error && <p className="text-xs text-rose-700">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy
            ? t('auth.working')
            : mode === 'signup'
              ? t('auth.signUp')
              : mode === 'forgot'
                ? t('auth.forgotSend')
                : t('auth.signIn')}
        </Button>
      </form>

      {/* Only offered where it is the actual problem: somebody who cannot get
          in. It is not a third way to make an account. */}
      {mode === 'signin' && (
        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError(null);
              setSent('no');
            }}
            className="tap text-xs text-faint underline-offset-4 transition hover:text-[var(--bloom-ink)] hover:underline"
          >
            {t('auth.forgot')}
          </button>
        </p>
      )}

      {mode === 'forgot' ? (
        <p className="mt-5 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSent('no');
            }}
            className="tap font-medium text-[var(--bloom-accent)] underline-offset-4 hover:underline"
          >
            {t('auth.backToSignIn')}
          </button>
        </p>
      ) : (
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
      )}

      <p className="mt-auto pt-8 text-center text-xs text-faint">{t('tagline')}</p>
    </main>
  );
}
