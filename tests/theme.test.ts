import { describe, expect, it } from 'vitest';
import { bloomFrom } from '@/lib/rosary/growth';
import { bloomCss, bloomVars } from '@/lib/rosary/theme';
import { EMPTY_STATS } from '@/lib/rosary/stats';

const withColors = (colors: [string, string, string] | null) =>
  bloomFrom(EMPTY_STATS, 'someone', { colors, shape: 'round' });

describe('the palette as CSS variables', () => {
  it('publishes every name the stylesheet reads', () => {
    const names = Object.keys(bloomVars(withColors(null)));
    for (const name of [
      '--bloom-bg-0', '--bloom-bg-1', '--bloom-bg-2', '--bloom-ink', '--bloom-surface',
      '--bloom-border', '--bloom-chain', '--bloom-bead', '--bloom-pater', '--bloom-accent',
      '--bloom-on-accent', '--bloom-glow',
    ]) {
      expect(names, name).toContain(name);
    }
  });

  it('leaves no value empty, which would drop a colour silently', () => {
    for (const entry of Object.entries(bloomVars(withColors(['#3355aa', '#88aa44', '#aa4466'])))) {
      expect(entry[1].trim().length, entry[0]).toBeGreaterThan(0);
    }
  });

  it('actually changes when three colours are chosen', () => {
    const derived = bloomVars(withColors(null));
    const chosen = bloomVars(withColors(['#3355aa', '#88aa44', '#aa4466']));
    expect(chosen['--bloom-accent']).not.toBe(derived['--bloom-accent']);
    expect(chosen['--bloom-bead']).not.toBe(derived['--bloom-bead']);
    expect(chosen['--bloom-chain']).not.toBe(derived['--bloom-chain']);
  });

  it('gives a different palette for every distinct choice', () => {
    const seen = new Set(
      [
        ['#3355aa', '#88aa44', '#aa4466'],
        ['#aa3355', '#4488aa', '#44aa88'],
        ['#886644', '#aa8866', '#664422'],
      ].map((colors) => bloomVars(withColors(colors as [string, string, string]))['--bloom-accent']),
    );
    expect(seen.size).toBe(3);
  });

  it('writes a rule the browser can parse, with every value in it', () => {
    const bloom = withColors(['#3355aa', '#88aa44', '#aa4466']);
    const css = bloomCss(bloom);
    expect(css.startsWith(':root{')).toBe(true);
    expect(css.endsWith('}')).toBe(true);
    for (const [name, value] of Object.entries(bloomVars(bloom))) {
      expect(css).toContain(`${name}:${value};`);
    }
    // Nothing that would close the rule early or escape the style tag.
    expect(css.slice(6, -1)).not.toContain('}');
    expect(css).not.toContain('<');
  });
});
