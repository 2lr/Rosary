import type { Bloom } from '@/lib/rosary/growth';

/**
 * Publishes the user's palette as CSS variables so the whole page — not just
 * the artwork — shifts as the rosary grows. Everything else in the interface is
 * derived from these in globals.css, so a single palette drives the app.
 */
export default function BloomVars({ bloom }: { bloom: Bloom }) {
  const { palette } = bloom;
  const css = `:root{
  --bloom-bg-0:${palette.bg[0]};
  --bloom-bg-1:${palette.bg[1]};
  --bloom-bg-2:${palette.bg[2]};
  --bloom-ink:${palette.ink};
  --bloom-surface:${palette.surface};
  --bloom-border:${palette.border};
  --bloom-chain:${palette.chain};
  --bloom-bead:${palette.bead};
  --bloom-pater:${palette.paterBead};
  --bloom-accent:${palette.accent};
  --bloom-on-accent:${palette.onAccent};
  --bloom-glow:${palette.glow};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
