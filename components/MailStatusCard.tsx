'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import type { MessageKey, Translator } from '@/lib/i18n/dictionary';

/**
 * What became of the words you sent.
 *
 * The one question the app could not answer from inside itself: did that mail
 * actually go out? Every attempt is recorded, including the ones where nothing
 * left the building, and this shows the last few of them.
 *
 * When a send fails, the provider's own words are printed underneath, unedited.
 * "403 the domain is not verified" is the sentence that tells you what to do;
 * any rewording of it loses exactly that.
 */

type Notice = { email: string; status: string; error: string | null; createdAt: string };

type Feed = { notices: Notice[]; waiting: number };

const LABELS: Record<string, MessageKey> = {
  sent: 'mail.sent',
  unconfigured: 'mail.unconfigured',
  failed: 'mail.failed',
  too_many: 'mail.too_many',
  already_today: 'mail.already_today',
};

export default function MailStatusCard({ t, lang }: { t: Translator; lang: string }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  const load = async (): Promise<Feed | null> => {
    try {
      const response = await fetch('/api/notices');
      if (!response.ok) return null;
      return (await response.json()) as Feed;
    } catch {
      // Nothing to show rather than a broken card.
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    load().then((data) => {
      if (data && !cancelled) setFeed(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing has ever been sent: there is nothing to report and no card.
  if (!feed || feed.notices.length === 0) return null;
  const notices = feed.notices;

  const when = new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="mt-4 px-4 py-4">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">{t('mail.label')}</p>

      <ul className="mt-3 space-y-3">
        {notices.map((notice) => (
          <li key={`${notice.email}-${notice.createdAt}`}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm">{notice.email}</p>
              <p className="shrink-0 text-[0.62rem] text-faint">
                {when.format(new Date(notice.createdAt))}
              </p>
            </div>
            <p
              className={
                notice.status === 'sent'
                  ? 'text-[0.7rem] text-[var(--bloom-accent)]'
                  : 'text-[0.7rem] text-muted'
              }
            >
              {LABELS[notice.status] ? t(LABELS[notice.status]) : notice.status}
            </p>
            {notice.error && (
              <p className="mt-0.5 break-words font-mono text-[0.62rem] leading-snug text-faint">
                {notice.error}
              </p>
            )}
          </li>
        ))}
      </ul>

      {feed.waiting > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setSaid(null);
            try {
              const response = await fetch('/api/notices', { method: 'POST' });
              const result = (await response.json()) as { sent?: number; failed?: number };
              const gone = result.sent ?? 0;
              setSaid(
                gone === 0
                  ? t('mail.retryNone')
                  : gone === 1
                    ? t('mail.retryDone.one')
                    : t('mail.retryDone').replace('{n}', String(gone)),
              );
            } catch {
              setSaid(t('mail.retryNone'));
            }
            const fresh = await load();
            if (fresh) setFeed(fresh);
            setBusy(false);
          }}
          className="tap mt-4 w-full rounded-full bg-[var(--bloom-accent)] px-4 py-2.5 text-sm text-[var(--bloom-on-accent)] transition disabled:opacity-40"
        >
          {busy
            ? t('mail.retryBusy')
            : feed.waiting === 1
              ? t('mail.retry.one')
              : t('mail.retry').replace('{n}', String(feed.waiting))}
        </button>
      )}

      {said && <p className="mt-2 text-center text-[0.7rem] text-muted">{said}</p>}
    </Card>
  );
}
