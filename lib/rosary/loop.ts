import type { BeadState, LoopBead } from '@/components/RosaryArt';
import type { Step } from './types';

export type LoopView = {
  beads: LoopBead[];
  /** The four pendant beads, ordered from the medal down to the crucifix. */
  pendant: BeadState[];
  medal: BeadState;
  cross: BeadState;
  /** Loop bead index the user is currently on, or -1. */
  activeIndex: number;
  /** Which chaplet of a full rosary is being shown (1-based). */
  chaplet: number;
  chaplets: number;
};

function stateOf(step: Step | undefined, done: Set<number>, current: number): BeadState {
  if (!step) return 'todo';
  if (step.id === current) return 'active';
  return done.has(step.id) ? 'done' : 'todo';
}

/**
 * Projects the sequence onto a real rosary: the crucifix for the Creed, then
 * one Our Father bead, three Hail Mary beads and the centre medal, then a loop
 * of fifty-five beads — five times an Our Father followed by ten Hail Marys.
 * That is fifty-nine beads, which is what you count in the hand.
 *
 * A twenty-decade rosary reuses the same loop once per chaplet, which is also
 * how it is prayed.
 */
export function loopView(steps: Step[], done: Set<number>, current: number): LoopView {
  const beads: LoopBead[] = Array.from({ length: 55 }, (_, i) => ({
    kind: i % 11 === 0 ? 'pater' : 'ave',
    state: 'todo',
  }));

  const opening = steps.filter((s) => s.decade === undefined && s.kind !== 'closing');
  const creed = opening.find((s) => s.prayer === 'creed');
  const openingOurFather = opening.find((s) => s.prayer === 'ourFather');
  const openingHailMarys = opening.filter((s) => s.prayer === 'hailMary').slice(0, 3);
  const openingGloryBe = opening.find((s) => s.prayer === 'gloryBe');

  // Ordered from the medal downwards, so the first Hail Mary sits nearest the
  // Our Father bead the user has just left.
  const pendant: BeadState[] = [
    stateOf(openingHailMarys[2], done, current),
    stateOf(openingHailMarys[1], done, current),
    stateOf(openingHailMarys[0], done, current),
    stateOf(openingOurFather, done, current),
  ];

  const currentStep = steps.find((s) => s.id === current);
  const currentDecade = currentStep?.decade ?? null;
  const chaplet = currentDecade ? Math.floor((currentDecade - 1) / 5) + 1 : 1;
  const maxDecade = steps.reduce((max, s) => Math.max(max, s.decade ?? 0), 0);
  const chaplets = Math.max(1, Math.ceil(maxDecade / 5));

  let activeIndex = -1;

  for (const step of steps) {
    if (step.decade === undefined) continue;
    if (Math.floor((step.decade - 1) / 5) + 1 !== chaplet) continue;

    const decadeInChaplet = ((step.decade - 1) % 5) + 1;
    const base = (decadeInChaplet - 1) * 11;

    let index = -1;
    if (step.prayer === 'ourFather') index = base;
    else if (step.prayer === 'hailMary' && step.beadInDecade) index = base + step.beadInDecade;

    if (index < 0 || index > 54) continue;

    beads[index].state = stateOf(step, done, current);
    if (beads[index].state === 'active') activeIndex = index;
  }

  return {
    beads,
    pendant,
    medal: stateOf(openingGloryBe, done, current),
    cross: stateOf(creed, done, current),
    activeIndex,
    chaplet,
    chaplets,
  };
}
