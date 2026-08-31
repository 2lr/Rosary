'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import type { MessageKey, Translator } from '@/lib/i18n/dictionary';

/**
 * Putting the app on the home screen, said in the words of the phone in hand.
 *
 * Worth its place for two reasons. It opens without an address bar, which is
 * the difference between a website and something you pray with. And on iOS a
 * web app cannot receive a single notification until it has been installed —
 * so somebody who turned reminders on and never installed would simply never
 * hear from us, with nothing on screen to say why.
 *
 * Chrome hands over a real installer through `beforeinstallprompt`, so where
 * that arrives there is a button and no instructions. Safari offers nothing of
 * the kind and never has, so there the steps are written out. The card removes
 * itself once the app is running standalone, which is the only reliable sign
 * that the job is done.
 */

type Prompt = Event & { prompt: () => Promise<void> };

function installed(): boolean {
  if (typeof window === 'undefined') return true;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  // iOS Safari predates the media query and keeps its own flag.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(standalone || iosStandalone);
}

function platform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const agent = navigator.userAgent;
  // iPadOS reports itself as a Mac, and is told apart by having a touchscreen.
  if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return /Android/.test(agent) ? 'android' : 'desktop';
}

export default function InstallCard({ t }: { t: Translator }) {
  const [show, setShow] = useState(false);
  const [how, setHow] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [installer, setInstaller] = useState<Prompt | null>(null);

  useEffect(() => {
    if (installed()) return;
    setHow(platform());
    setShow(true);

    const onPrompt = (event: Event) => {
      // Keeping it is what allows a button of our own, at a moment that makes
      // sense, rather than the browser's own banner whenever it feels like it.
      event.preventDefault();
      setInstaller(event as Prompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!show) return null;

  const steps: Record<typeof how, MessageKey> = {
    ios: 'install.ios',
    android: 'install.android',
    desktop: 'install.desktop',
  };

  return (
    <Card className="mt-4 px-4 py-4">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">{t('install.label')}</p>
      <p className="mt-1 font-display text-lg leading-tight">{t('install.title')}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">{t('install.why')}</p>

      {installer ? (
        <button
          type="button"
          onClick={async () => {
            await installer.prompt();
            // Whatever was chosen, the prompt is spent: it cannot be shown twice.
            setInstaller(null);
            setShow(!installed());
          }}
          className="tap mt-3 w-full rounded-full bg-[var(--bloom-accent)] px-4 py-3 text-sm text-[var(--bloom-on-accent)] transition"
        >
          {t('install.button')}
        </button>
      ) : (
        <p className="mt-3 text-[0.8rem] leading-relaxed text-pretty">{t(steps[how])}</p>
      )}
    </Card>
  );
}
