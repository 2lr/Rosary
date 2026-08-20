export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

export const LANG_LABELS: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
};

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function normalizeLang(value: unknown): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/** Best-effort match of an Accept-Language header against the supported set. */
export function langFromAcceptLanguage(header: string | null | undefined): Lang {
  if (!header) return DEFAULT_LANG;
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() ?? '';
    const base = tag.split('-')[0];
    if (isLang(base)) return base;
  }
  return DEFAULT_LANG;
}

const ORDINALS: Record<Lang, string[]> = {
  fr: ['1ᵉʳ', '2ᵉ', '3ᵉ', '4ᵉ', '5ᵉ'],
  en: ['1st', '2nd', '3rd', '4th', '5th'],
};

/** Ordinal for the five mysteries of a chaplet. */
export function ordinal(n: number, lang: Lang): string {
  return ORDINALS[lang][n - 1] ?? String(n);
}
