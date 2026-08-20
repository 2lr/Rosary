import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const BASE =
  'tap inline-flex items-center justify-center gap-2 rounded-full font-medium transition ' +
  'disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[var(--bloom-accent)] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[var(--bloom-bg-0)]';

const VARIANTS = {
  primary:
    'bg-[var(--bloom-accent)] text-night-950 hover:brightness-110 active:brightness-95 shadow-lg shadow-black/30',
  ghost: 'surface text-[var(--bloom-ink)] hover:bg-white/10',
  quiet: 'text-muted hover:text-[var(--bloom-ink)]',
} as const;

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-12 px-6 text-[0.95rem]',
  lg: 'h-14 px-8 text-base',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return <button className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />;
}

type ButtonLinkProps = {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cx(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function Field({ label, hint, error, className, id, ...rest }: FieldProps) {
  const inputId = id ?? `field-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="flex items-baseline justify-between text-sm text-muted">
        <span>{label}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </label>
      <input
        id={inputId}
        className={cx(
          'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[16px]',
          'text-[var(--bloom-ink)] placeholder:text-white/25 outline-none transition',
          'focus:border-[var(--bloom-accent)]/60 focus:bg-white/8',
          error && 'border-rose-400/60',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'li';
}) {
  return <Tag className={cx('surface rounded-3xl', className)}>{children}</Tag>;
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="surface rounded-2xl px-4 py-3.5">
      <div className="lining font-display text-3xl leading-none text-[var(--bloom-accent)]">{value}</div>
      <div className="mt-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-faint">{label}</div>
    </div>
  );
}
