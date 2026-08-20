import type { MessageKey } from '@/lib/i18n/dictionary';

export type Harmony = {
  key: string;
  label: MessageKey;
  /** Accent, beads, chain. */
  colors: [string, string, string];
};

/** Ready-made trios, for anyone who would rather not pick three colours. */
export const HARMONIES: Harmony[] = [
  { key: 'gold', label: 'harmony.gold', colors: ['#a97b32', '#c8a878', '#94795a'] },
  { key: 'marian', label: 'harmony.marian', colors: ['#3f6fa8', '#8fb3d9', '#6a86a8'] },
  { key: 'rose', label: 'harmony.rose', colors: ['#a8506a', '#d59aa8', '#a8788a'] },
  { key: 'olive', label: 'harmony.olive', colors: ['#5d7a3f', '#a8bc86', '#7f8f66'] },
  { key: 'plum', label: 'harmony.plum', colors: ['#6b4a8a', '#a98fc2', '#8a7aa0'] },
  { key: 'ember', label: 'harmony.ember', colors: ['#a85432', '#d6a184', '#a8785e'] },
];

export const DEFAULT_COLORS: [string, string, string] = HARMONIES[0].colors;
