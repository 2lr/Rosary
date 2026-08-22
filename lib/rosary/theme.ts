import type { Bloom } from './growth';

/**
 * The palette as CSS variables.
 *
 * One place, used twice: the server writes them into a style tag so the first
 * paint is already the right colour, and the client writes the same names onto
 * the root element so a change of colour takes effect at once, everywhere,
 * without waiting for a page to come back from the server.
 */
export function bloomVars(bloom: Bloom): Record<string, string> {
  const { palette } = bloom;
  return {
    '--bloom-bg-0': palette.bg[0],
    '--bloom-bg-1': palette.bg[1],
    '--bloom-bg-2': palette.bg[2],
    '--bloom-ink': palette.ink,
    '--bloom-surface': palette.surface,
    '--bloom-border': palette.border,
    '--bloom-chain': palette.chain,
    '--bloom-bead': palette.bead,
    '--bloom-pater': palette.paterBead,
    '--bloom-accent': palette.accent,
    '--bloom-on-accent': palette.onAccent,
    '--bloom-glow': palette.glow,
  };
}

export function bloomCss(bloom: Bloom): string {
  const lines = Object.entries(bloomVars(bloom)).map(([name, value]) => `${name}:${value};`);
  return `:root{${lines.join('')}}`;
}

/**
 * Writes the palette onto the root element. Inline properties beat any rule in
 * a stylesheet, so this is what wins while a page rendered with the old colours
 * is still on screen.
 */
export function applyBloomVars(bloom: Bloom): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(bloomVars(bloom))) {
    root.style.setProperty(name, value);
  }
}
