'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RosaryArt from '@/components/RosaryArt';
import { cx } from '@/components/ui';
import type { Bloom } from '@/lib/rosary/growth';
import type { Lang } from '@/lib/i18n/config';
import { translatorFor } from '@/lib/i18n/dictionary';
import {
  FAMILY_LABEL,
  FAMILY_ORDER,
  TRAITS,
  activeTraits,
  type Family,
  type Trait,
} from '@/lib/rosary/traits';

const MIN_SCALE = 1;
const MAX_SCALE = 6;

type Transform = { scale: number; x: number; y: number };
const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

/**
 * The rosary, close up.
 *
 * Everything the prayer has produced is here: the piece itself at whatever
 * magnification you want, what is already showing, and what is coming next
 * with the exact number of decades still to pray for it.
 */
export default function RosaryViewer({
  bloom,
  lang,
  onClose,
}: {
  bloom: Bloom;
  lang: Lang;
  onClose: () => void;
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const [view, setView] = useState<Transform>(IDENTITY);
  const [open, setOpen] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);

  const shown = activeTraits(bloom.growth);
  const byFamily = FAMILY_ORDER.map((family) => ({
    family,
    traits: shown.filter((trait) => trait.family === family),
  })).filter((group) => group.traits.length > 0);
  const coming = TRAITS.filter((trait) => bloom.growth.notch[trait.id] === 0)
    .map((trait) => ({ trait, remaining: bloom.growth.remaining[trait.id] }))
    .filter((entry): entry is { trait: Trait; remaining: number } => entry.remaining !== null)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 4);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const clamp = useCallback((next: Transform): Transform => {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
    const box = stage.current?.getBoundingClientRect();
    if (!box) return { ...next, scale };
    // Never let the piece be dragged entirely off the stage.
    const slackX = (box.width * (scale - 1)) / 2;
    const slackY = (box.height * (scale - 1)) / 2;
    return {
      scale,
      x: Math.min(slackX, Math.max(-slackX, next.x)),
      y: Math.min(slackY, Math.max(-slackY, next.y)),
    };
  }, []);

  /** Zoom about a point, so what is under the finger stays under the finger. */
  const zoomAt = useCallback(
    (factor: number, clientX: number, clientY: number) => {
      const box = stage.current?.getBoundingClientRect();
      if (!box) return;
      const cxp = clientX - box.left - box.width / 2;
      const cyp = clientY - box.top - box.height / 2;
      setView((current) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
        const ratio = scale / current.scale;
        return clamp({
          scale,
          x: cxp - (cxp - current.x) * ratio,
          y: cyp - (cyp - current.y) * ratio,
        });
      });
    },
    [clamp],
  );

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    zoomAt(Math.exp(-event.deltaY / 320), event.clientX, event.clientY);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const scale = (pinch.current.scale * distance) / (pinch.current.distance || 1);
      setView((current) => clamp({ ...current, scale }));
      return;
    }

    if (pointers.current.size === 1) {
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      setView((current) => clamp({ ...current, x: current.x + dx, y: current.y + dy }));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bloom-bg-0)] pad-top">
      <header className="flex shrink-0 items-center justify-between px-5">
        <h2 className="font-display text-xl">{t('viewer.title')}</h2>
        <div className="flex items-center gap-2">
          {view.scale > 1.01 && (
            <button
              type="button"
              onClick={() => setView(IDENTITY)}
              className="tap surface rounded-full px-3 py-1.5 text-xs text-muted"
            >
              {t('viewer.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="tap surface flex h-9 w-9 items-center justify-center rounded-full text-muted"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div
        ref={stage}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => (view.scale > 1.5 ? setView(IDENTITY) : zoomAt(2.6, e.clientX, e.clientY))}
        className="relative min-h-0 flex-[1.4] touch-none overflow-hidden"
        style={{ cursor: view.scale > 1.01 ? 'grab' : 'zoom-in' }}
      >
        <div
          className="flex h-full w-full items-center justify-center will-change-transform"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: pointers.current.size === 0 ? 'transform 140ms ease-out' : 'none',
          }}
        >
          <RosaryArt bloom={bloom} fill={1} className="h-full w-auto" title={t('viewer.title')} />
        </div>

        {view.scale < 1.05 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[0.65rem] text-faint">
            {t('viewer.hint')}
          </p>
        )}
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-6 pad-bottom">
        <section>
          <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">
            {t('viewer.traits')}
          </h3>
          {shown.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('journey.sinceNever')}</p>
          ) : (
            byFamily.map((group) => (
              <div key={group.family} className="mt-3">
                <p className="mb-1.5 font-display text-lg text-[var(--bloom-accent)]">
                  {t(FAMILY_LABEL[group.family as Family])}
                </p>
                <ul className="space-y-1.5">
                  {group.traits.map((trait) => (
                    <TraitRow
                      key={trait.id}
                      trait={trait}
                      bloom={bloom}
                      t={t}
                      open={open === trait.id}
                      onToggle={() => setOpen(open === trait.id ? null : trait.id)}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">
            {t('viewer.memory')}
          </h3>
          <p className="mt-1.5 text-sm text-muted">
            {t('viewer.memoryHint', { n: bloom.growth.memory.ticks })}
          </p>
        </section>

        {coming.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">
              {t('viewer.toCome')}
            </h3>
            <ul className="mt-2.5 space-y-1.5">
              {coming.map(({ trait, remaining }) => (
                <li
                  key={trait.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-faint"
                >
                  <span>{t(trait.label)}</span>
                  <span className="lining text-xs">{t('viewer.remaining', { n: remaining })}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function TraitRow({
  trait,
  bloom,
  t,
  open,
  onToggle,
}: {
  trait: Trait;
  bloom: Bloom;
  t: ReturnType<typeof translatorFor>;
  open: boolean;
  onToggle: () => void;
}) {
  const notch = bloom.growth.notch[trait.id];
  const remaining = bloom.growth.remaining[trait.id];
  const progress = Math.min(1, notch / trait.notches);

  return (
    <li className="surface overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="tap flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-sm">{t(trait.label)}</span>
        <span className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--bloom-fill-2)]">
          <span
            className={cx('block h-full rounded-full bg-[var(--bloom-accent)]')}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </span>
        <span className="lining w-[4.4rem] shrink-0 whitespace-nowrap text-right text-[0.68rem] text-faint">
          {remaining === null ? '—' : t('viewer.remaining', { n: remaining })}
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--bloom-border)] px-3 py-2.5">
          <p className="text-[0.8rem] leading-relaxed text-muted">{t(trait.meaning)}</p>
          {trait.scripture && (
            <p className="mt-1 text-[0.68rem] italic text-faint">{t(trait.scripture)}</p>
          )}
        </div>
      )}
    </li>
  );
}
