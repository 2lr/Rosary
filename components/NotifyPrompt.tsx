'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import type { Translator } from '@/lib/i18n/dictionary';
import { enablePush, pushState, timeZone } from '@/lib/client/push';

/**
 * The ask, until it is answered.
 *
 * It comes back on every visit while the browser has not been asked — "later"
 * puts it away for this session and no longer, which is what "keeps appearing
 * until you say yes" has to mean if it is to be honest. Once the browser has
 * decided, either way, it is gone for good: a prompt that returns after a
 * refusal is not a prompt, it is nagging, and the browser will not re-ask
 * anyway.
 *
 * It is a card at the top of the screen rather than a modal over it. Somebody
 * opening this app has come to pray, and nothing should stand in front of that.
 */

const PUT_AWAY = 'rosary:notify-prompt-dismissed';

export default function NotifyPrompt({ t }: { t: Translator }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pushState() !== 'default') return;
    try {
      if (sessionStorage.getItem(PUT_AWAY) === '1') return;
    } catch {
      // Private windows throw on storage; the prompt simply shows.
    }
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <Card className="mt-4 px-4 py-4 animate-rise">
      <p className="font-display text-lg leading-tight">{t('notify.promptTitle')}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">
        {t('notify.promptBody')}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const next = await enablePush();
            if (next === 'granted') {
              // Saying yes has to leave a reminder actually set, or the
              // permission was asked for nothing.
              await fetch('/api/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifyHour: 8, timeZone: timeZone() }),
              });
            }
            setBusy(false);
            setShow(false);
          }}
          className="tap flex-1 rounded-full bg-[var(--bloom-accent)] px-4 py-2.5 text-sm text-[var(--bloom-on-accent)] transition disabled:opacity-40"
        >
          {t('notify.promptYes')}
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(PUT_AWAY, '1');
            } catch {
              // Nothing to remember it with; it will show again either way.
            }
            setShow(false);
          }}
          className="tap rounded-full px-3 py-2 text-xs text-faint transition hover:text-[var(--bloom-ink)]"
        >
          {t('notify.promptLater')}
        </button>
      </div>
    </Card>
  );
}
