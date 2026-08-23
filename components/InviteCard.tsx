'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import type { Translator } from '@/lib/i18n/dictionary';
import { formatInviteCode } from '@/lib/invite';

/**
 * Your own code, and what has been prayed by the people you let in.
 *
 * Nobody signs up here without somebody's code, so this is not a growth
 * ornament bolted on the side — it is the only door in. It says the code, it
 * shares it in one tap, and it counts what came of the ones already given.
 *
 * The count is of prayer, never of people's prayer: how many rosaries and
 * decades the whole line below you has finished, and how many are in it. Who
 * they are and what they prayed on which day stays theirs.
 */

type Lineage = {
  code: string | null;
  invited: number;
  people: number;
  rosaries: number;
  decades: number;
};

export default function InviteCard({ t }: { t: Translator }) {
  const [state, setState] = useState<Lineage | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/invite');
        if (!response.ok) return;
        const data = (await response.json()) as Lineage;
        if (!cancelled) setState(data);
      } catch {
        // No card rather than a broken one; the next visit will try again.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const code = state?.code ?? null;

  const share = useCallback(async () => {
    if (!code) return;
    const url = `${window.location.origin}/?code=${code}`;
    const text = t('invite.shareText', { app: t('appName'), code: formatInviteCode(code) });

    // The share sheet is the one people expect on a phone; a copied link is the
    // honest fallback everywhere else, including when the sheet is dismissed.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: t('appName'), text, url });
        return;
      } catch {
        // Dismissed, or refused. Fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Nothing left to try: the code is on screen to be read out.
    }
  }, [code, t]);

  if (!code) return null;

  const { invited, people, rosaries, decades } = state!;

  return (
    <Card className="mt-3 px-4 py-4">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">{t('invite.label')}</p>
      <p className="mt-1 font-display text-lg leading-tight">{t('invite.title')}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">{t('invite.body')}</p>

      {/* The code itself, big enough to read across a table. */}
      <p className="mt-3 text-center font-display text-3xl tracking-[0.22em] tabular-nums">
        {formatInviteCode(code)}
      </p>

      <button
        type="button"
        onClick={() => void share()}
        className="tap mt-3 w-full rounded-full bg-[var(--bloom-accent)] px-4 py-3 text-sm text-[var(--bloom-on-accent)] transition"
      >
        {copied ? t('invite.copied') : t('invite.share')}
      </button>

      {invited === 0 ? (
        <p className="mt-3 text-[0.68rem] leading-relaxed text-faint text-pretty">
          {t('invite.none')}
        </p>
      ) : (
        <div className="mt-3 space-y-1">
          <p className="text-[0.7rem] text-muted">
            {t('invite.invited', { n: invited })}
            {people > invited && ` · ${t('invite.people', { n: people })}`}
          </p>
          <p className="text-[0.7rem] text-[var(--bloom-accent)]">
            {rosaries === 1
              ? t('invite.prayedOne', { decades })
              : t('invite.prayed', { rosaries, decades })}
          </p>
          <p className="text-[0.62rem] text-faint">{t('invite.privacy')}</p>
        </div>
      )}
    </Card>
  );
}
