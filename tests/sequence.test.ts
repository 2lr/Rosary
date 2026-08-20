import { describe, expect, it } from 'vitest';
import {
  buildSequence,
  countCompletedDecades,
  countHailMarys,
  firstUndoneStep,
  totalDecades,
} from '@/lib/rosary/sequence';
import { loopView } from '@/lib/rosary/loop';

const chaplet = () =>
  buildSequence({ kind: 'chaplet', mysterySet: 'joyful', mode: 'spoken', lang: 'fr' });

describe('a chaplet', () => {
  const steps = chaplet();

  it('opens with the cross, the creed, an Our Father, three Hail Marys and a Glory Be', () => {
    expect(steps.slice(0, 7).map((s) => s.prayer)).toEqual([
      'signOfTheCross',
      'creed',
      'ourFather',
      'hailMary',
      'hailMary',
      'hailMary',
      'gloryBe',
    ]);
  });

  it('has five decades of one Our Father and ten Hail Marys', () => {
    for (let decade = 1; decade <= 5; decade++) {
      const inDecade = steps.filter((s) => s.decade === decade);
      expect(inDecade.filter((s) => s.prayer === 'ourFather')).toHaveLength(1);
      expect(inDecade.filter((s) => s.prayer === 'hailMary')).toHaveLength(10);
      expect(inDecade.filter((s) => s.prayer === 'gloryBe')).toHaveLength(1);
      expect(inDecade.filter((s) => s.kind === 'mystery')).toHaveLength(1);
      expect(inDecade.filter((s) => s.kind === 'decade-end')).toHaveLength(1);
    }
  });

  it('counts fifty-three Hail Marys in all', () => {
    expect(steps.filter((s) => s.prayer === 'hailMary')).toHaveLength(53);
  });

  it('closes with the Salve Regina and the final prayer', () => {
    expect(steps.slice(-2).map((s) => s.prayer)).toEqual(['salveRegina', 'closing']);
  });

  it('numbers its steps from zero without gaps', () => {
    expect(steps.map((s) => s.id)).toEqual(steps.map((_, i) => i));
  });
});

describe('a full rosary', () => {
  const steps = buildSequence({ kind: 'full', mysterySet: null, mode: 'spoken', lang: 'en' });

  it('walks all twenty mysteries, in the order of the four sets', () => {
    const mysteries = steps.filter((s) => s.kind === 'mystery');
    expect(mysteries).toHaveLength(20);
    expect(mysteries.slice(0, 5).every((s) => s.set === 'joyful')).toBe(true);
    expect(mysteries.slice(5, 10).every((s) => s.set === 'luminous')).toBe(true);
    expect(mysteries.slice(10, 15).every((s) => s.set === 'sorrowful')).toBe(true);
    expect(mysteries.slice(15, 20).every((s) => s.set === 'glorious')).toBe(true);
  });

  it('opens and closes only once', () => {
    expect(steps.filter((s) => s.prayer === 'creed')).toHaveLength(1);
    expect(steps.filter((s) => s.prayer === 'salveRegina')).toHaveLength(1);
  });

  it('reports twenty decades', () => {
    expect(totalDecades('full')).toBe(20);
  });
});

describe('a free rosary', () => {
  const steps = buildSequence({ kind: 'free', mysterySet: null, mode: 'written', lang: 'fr' });

  it('replaces the mysteries with the user’s own intentions', () => {
    expect(steps.filter((s) => s.kind === 'mystery')).toHaveLength(0);
    expect(steps.filter((s) => s.kind === 'free-write')).toHaveLength(5);
  });

  it('still keeps the shape of the beads', () => {
    expect(steps.filter((s) => s.prayer === 'hailMary')).toHaveLength(53);
  });

  it('prompts for writing when that is the chosen mode', () => {
    expect(steps.find((s) => s.kind === 'free-write')?.hint).toContain('Écrivez');
  });
});

describe('counting progress', () => {
  const steps = chaplet();

  it('counts a decade only once its closing prayer is marked', () => {
    const throughFirstDecade = new Set(
      steps.filter((s) => (s.decade ?? 0) <= 1).map((s) => s.id),
    );
    expect(countCompletedDecades(steps, throughFirstDecade)).toBe(1);

    const withoutClosing = new Set(throughFirstDecade);
    withoutClosing.delete(steps.find((s) => s.kind === 'decade-end')!.id);
    expect(countCompletedDecades(steps, withoutClosing)).toBe(0);
  });

  it('counts only the Hail Marys actually prayed', () => {
    const all = new Set(steps.map((s) => s.id));
    expect(countHailMarys(steps, all)).toBe(53);
    expect(countHailMarys(steps, new Set())).toBe(0);
  });

  it('resumes at the first step not yet prayed', () => {
    const done = new Set([0, 1, 2]);
    expect(firstUndoneStep(steps, done)).toBe(3);
    expect(firstUndoneStep(steps, new Set())).toBe(0);
  });
});

describe('the bead loop', () => {
  const steps = chaplet();

  it('lays fifty-five beads out as five decades', () => {
    const { beads } = loopView(steps, new Set(), 0);
    expect(beads).toHaveLength(55);
    expect(beads.filter((b) => b.kind === 'pater')).toHaveLength(5);
    expect(beads.filter((b) => b.kind === 'ave')).toHaveLength(50);
  });

  it('marks the bead the user is on', () => {
    const seventhHailMary = steps.find(
      (s) => s.decade === 2 && s.prayer === 'hailMary' && s.beadInDecade === 7,
    )!;
    const { beads, activeIndex } = loopView(steps, new Set(), seventhHailMary.id);
    expect(activeIndex).toBe(11 + 7);
    expect(beads[activeIndex].state).toBe('active');
  });

  it('shows one chaplet at a time within a full rosary', () => {
    const full = buildSequence({ kind: 'full', mysterySet: null, mode: 'spoken', lang: 'fr' });
    const inThirdChaplet = full.find((s) => s.decade === 12 && s.prayer === 'ourFather')!;
    const view = loopView(full, new Set(), inThirdChaplet.id);
    expect(view.chaplets).toBe(4);
    expect(view.chaplet).toBe(3);
    // The twelfth decade is the second of its chaplet.
    expect(view.activeIndex).toBe(11);
  });

  it('counts fifty-nine beads: four on the pendant and fifty-five on the loop', () => {
    const { beads, pendant } = loopView(steps, new Set(), 0);
    expect(beads.length + pendant.length).toBe(59);
    expect(pendant).toHaveLength(4);
  });

  it('puts the Creed on the crucifix and the Glory Be on the medal', () => {
    const creed = steps.find((s) => s.prayer === 'creed')!;
    expect(loopView(steps, new Set(), creed.id).cross).toBe('active');

    const gloryBe = steps.find((s) => s.decade === undefined && s.prayer === 'gloryBe')!;
    expect(loopView(steps, new Set(), gloryBe.id).medal).toBe('active');
  });

  it('lights the pendant from the cross upwards', () => {
    const opening = steps.filter((s) => s.decade === undefined && s.kind !== 'closing');
    const ourFather = opening.find((s) => s.prayer === 'ourFather')!;
    const hailMarys = opening.filter((s) => s.prayer === 'hailMary');

    // Index 3 is the bead nearest the crucifix, index 0 the one at the medal.
    expect(loopView(steps, new Set(), ourFather.id).pendant[3]).toBe('active');
    expect(loopView(steps, new Set(), hailMarys[0].id).pendant[2]).toBe('active');
    expect(loopView(steps, new Set(), hailMarys[2].id).pendant[0]).toBe('active');
  });

  it('marks the pendant beads already prayed as done', () => {
    const opening = steps.filter((s) => s.decade === undefined && s.kind !== 'closing');
    const done = new Set(opening.slice(0, 4).map((s) => s.id));
    const { pendant } = loopView(steps, done, 99);
    expect(pendant[3]).toBe('done');
    expect(pendant[2]).toBe('done');
    expect(pendant[0]).toBe('todo');
  });
});
