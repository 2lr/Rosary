'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/components/ui';
import type { Translator } from '@/lib/i18n/dictionary';

const ICONS = {
  home: 'M4 11.2 12 4l8 7.2M6 10v9h12v-9',
  journey: 'M4 19V9m5 10V5m5 14v-7m5 7V8',
  settings: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z M19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2l-.3-2.5H10.3l-.4 2.5a7.5 7.5 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2 1.2l.4 2.5h3.4l.3-2.5a7.5 7.5 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z',
} as const;

export default function AppNav({ t }: { t: Translator }) {
  const pathname = usePathname();

  const items = [
    { href: '/home', label: t('home.today'), icon: ICONS.home },
    { href: '/journey', label: t('home.journey'), icon: ICONS.journey },
    { href: '/settings', label: t('home.settings'), icon: ICONS.settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-5 pad-bottom">
      {/* Content dissolves under the bar rather than colliding with it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[var(--bloom-bg-0)] via-[var(--bloom-bg-0)]/85 to-transparent"
      />
      <div className="surface flex items-center justify-around rounded-full px-2 py-1.5 shadow-xl shadow-black/40">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'tap flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-[0.65rem] transition',
                active ? 'text-[var(--bloom-accent)]' : 'text-faint hover:text-[var(--bloom-ink)]',
              )}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className="tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
