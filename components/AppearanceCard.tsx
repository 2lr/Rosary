'use client';

import { useMemo } from 'react';
import RosaryArt from '@/components/RosaryArt';
import { Card, cx } from '@/components/ui';
import { bloomFrom } from '@/lib/rosary/growth';
import { HARMONIES } from '@/lib/rosary/harmonies';
import { LOOP_SHAPES, type LoopShape } from '@/lib/rosary/shapes';
import type { Stats } from '@/lib/rosary/stats';
import type { MessageKey, Translator } from '@/lib/i18n/dictionary';

const SHAPE_LABEL: Record<LoopShape, MessageKey> = {
  round: 'settings.shapeRound',
  oval: 'settings.shapeOval',
  square: 'settings.shapeSquare',
};

const ROLE_LABEL: MessageKey[] = [
  'settings.colorAccent',
  'settings.colorBead',
  'settings.colorChain',
];

export type Appearance = {
  colors: [string, string, string] | null;
  shape: LoopShape;
};

export default function AppearanceCard({
  t,
  stats,
  userId,
  value,
  onChange,
}: {
  t: Translator;
  stats: Stats;
  userId: string;
  value: Appearance;
  onChange: (next: Appearance) => void;
}) {
  const preview = useMemo(
    () => bloomFrom(stats, userId, { colors: value.colors, shape: value.shape }),
    [stats, userId, value.colors, value.shape],
  );

  // With nothing chosen, the swatches show the colours the mysteries produced,
  // so picking one starts from what is already on screen.
  const swatches = value.colors ?? preview.trio;

  const setColor = (index: number, color: string) => {
    const next = [...swatches] as [string, string, string];
    next[index] = color;
    onChange({ ...value, colors: next });
  };

  return (
    <Card className="mt-3 space-y-5 px-4 py-5">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
        {t('settings.appearance')}
      </p>

      {/* The change is shown, not described. */}
      <div className="flex justify-center">
        <RosaryArt
          bloom={preview}
          fill={1}
          className="h-44 w-auto"
          title={t('settings.preview')}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted">{t('settings.shape')}</p>
        <div className="grid grid-cols-3 gap-2">
          {LOOP_SHAPES.map((shape) => (
            <button
              key={shape}
              type="button"
              aria-pressed={value.shape === shape}
              onClick={() => onChange({ ...value, shape })}
              className={cx(
                'tap flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs transition',
                value.shape === shape
                  ? 'border-[var(--bloom-accent)]/60 bg-[var(--bloom-accent)]/12'
                  : 'border-[var(--bloom-border)] bg-[var(--bloom-fill)] hover:bg-[var(--bloom-fill-2)]',
              )}
            >
              <ShapeGlyph shape={shape} />
              <span>{t(SHAPE_LABEL[shape])}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted">{t('settings.colors')}</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_LABEL.map((label, index) => (
            <label
              key={label}
              className="tap flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-[var(--bloom-border)] bg-[var(--bloom-fill)] px-2 py-3 text-xs transition hover:bg-[var(--bloom-fill-2)]"
            >
              <span
                className="h-8 w-8 rounded-full border border-[var(--bloom-border)] shadow-inner"
                style={{ background: swatches[index] }}
              />
              <span className="text-faint">{t(label)}</span>
              <input
                type="color"
                value={swatches[index]}
                onChange={(e) => setColor(index, e.target.value)}
                className="sr-only"
              />
            </label>
          ))}
        </div>
        <p className="text-[0.68rem] leading-relaxed text-faint">{t('settings.colorsHint')}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted">{t('settings.harmonies')}</p>
        <div className="flex flex-wrap gap-2">
          {HARMONIES.map((harmony) => {
            const active =
              value.colors !== null &&
              value.colors.every((c, i) => c.toLowerCase() === harmony.colors[i]);
            return (
              <button
                key={harmony.key}
                type="button"
                onClick={() => onChange({ ...value, colors: [...harmony.colors] })}
                aria-pressed={active}
                className={cx(
                  'tap flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition',
                  active
                    ? 'border-[var(--bloom-accent)]/60 bg-[var(--bloom-accent)]/12'
                    : 'border-[var(--bloom-border)] hover:bg-[var(--bloom-fill-2)]',
                )}
              >
                <span className="flex -space-x-1">
                  {harmony.colors.map((color) => (
                    <span
                      key={color}
                      className="h-3 w-3 rounded-full border border-[var(--bloom-border)]"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                {t(harmony.label)}
              </button>
            );
          })}
        </div>
      </div>

      {value.colors && (
        <button
          type="button"
          onClick={() => onChange({ ...value, colors: null })}
          className="tap text-xs text-[var(--bloom-accent)] underline-offset-4 hover:underline"
        >
          {t('settings.resetColors')}
        </button>
      )}
    </Card>
  );
}

function ShapeGlyph({ shape }: { shape: LoopShape }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      {shape === 'round' && <circle cx="12" cy="12" r="8.5" />}
      {shape === 'oval' && <ellipse cx="12" cy="12" rx="6.6" ry="9" />}
      {shape === 'square' && <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5" />}
    </svg>
  );
}
