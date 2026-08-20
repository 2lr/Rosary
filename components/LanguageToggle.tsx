'use client';

import { LANGS, LANG_LABELS, type Lang } from '@/lib/i18n/config';
import { cx } from '@/components/ui';

export default function LanguageToggle({
  lang,
  onChange,
  className,
}: {
  lang: Lang;
  onChange: (next: Lang) => void;
  className?: string;
}) {
  return (
    <div
      className={cx('surface flex rounded-full p-0.5 text-xs', className)}
      role="group"
      aria-label="Language"
    >
      {LANGS.map((candidate) => (
        <button
          key={candidate}
          type="button"
          onClick={() => onChange(candidate)}
          aria-pressed={lang === candidate}
          className={cx(
            'tap rounded-full px-3 py-1.5 font-medium transition',
            lang === candidate
              ? 'bg-[var(--bloom-accent)] text-night-950'
              : 'text-muted hover:text-[var(--bloom-ink)]',
          )}
        >
          {candidate === 'fr' ? 'FR' : 'EN'}
          <span className="sr-only"> — {LANG_LABELS[candidate]}</span>
        </button>
      ))}
    </div>
  );
}
