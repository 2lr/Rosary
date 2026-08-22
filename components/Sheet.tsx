'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** A bottom sheet: the natural place for a decision on a phone. */
export default function Sheet({
  title,
  onClose,
  closeLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Tapping beside the sheet closes it, as it should — but it is not the
          control any more: the written one in the header is, so this one stays
          out of the way of anyone reading the page rather than seeing it. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[var(--bloom-scrim)] backdrop-blur-sm"
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-[var(--bloom-border)] bg-[var(--bloom-bg-0)] px-5 pb-8 pt-3 shadow-2xl outline-none sm:rounded-[2rem] pad-bottom"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--bloom-fill-3)] sm:hidden" />
        {/* The scrim closes it too, but on a sheet long enough to scroll the
            scrim is off-screen — so the way out is written, and stays put. */}
        <div className="sticky top-0 z-10 -mx-5 flex items-baseline justify-between gap-3 bg-[var(--bloom-bg-0)] px-5 pb-2">
          <h2 className="min-w-0 font-display text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="tap shrink-0 rounded-full border border-[var(--bloom-border)] px-3 py-1 text-xs text-muted transition hover:text-[var(--bloom-ink)]"
          >
            {closeLabel}
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
