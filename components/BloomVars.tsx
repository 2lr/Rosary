'use client';

import { useEffect } from 'react';
import type { Bloom } from '@/lib/rosary/growth';
import { applyBloomVars, bloomCss } from '@/lib/rosary/theme';

/**
 * Publishes the user's palette as CSS variables so the whole page — not just
 * the artwork — shifts as the rosary grows. Everything else in the interface is
 * derived from these in globals.css, so a single palette drives the app.
 *
 * The style tag is what the first paint uses, so the page never flashes the
 * wrong colour. The effect then writes the same values onto the root element:
 * inline properties outrank any stylesheet, so whatever is on screen — even a
 * page rendered a moment ago with the previous colours — is corrected at once.
 */
export default function BloomVars({ bloom }: { bloom: Bloom }) {
  useEffect(() => {
    applyBloomVars(bloom);
  }, [bloom]);

  return <style dangerouslySetInnerHTML={{ __html: bloomCss(bloom) }} />;
}
