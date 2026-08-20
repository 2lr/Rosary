'use client';

import { useEffect } from 'react';
import type { Lang } from '@/lib/i18n/config';

/**
 * Keeps <html lang> in step with the reader's chosen language. Done on the
 * client so the root layout can stay static and cacheable.
 */
export default function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
