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
      <button
        type="button"
        aria-label={closeLabel}
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
        <h2 className="font-display text-2xl">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
