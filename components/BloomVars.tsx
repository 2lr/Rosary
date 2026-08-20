import type { Bloom } from '@/lib/rosary/growth';

/**
 * Publishes the user's palette as CSS variables so the whole page — not just
 * the artwork — shifts as the rosary grows.
 */
export default function BloomVars({ bloom }: { bloom: Bloom }) {
  const { palette } = bloom;
  const css = `:root{
  --bloom-bg-0:${palette.bg[0]};
  --bloom-bg-1:${palette.bg[1]};
  --bloom-bg-2:${palette.bg[2]};
  --bloom-chain:${palette.chain};
  --bloom-bead:${palette.bead};
  --bloom-pater:${palette.paterBead};
  --bloom-accent:${palette.accent};
  --bloom-glow:${palette.glow};
  --bloom-ink:${palette.ink};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
