import type { BeadState, LoopBead } from '@/components/RosaryArt';
import type { Step } from './types';

export type LoopView = {
  beads: LoopBead[];
  pendant: BeadState[];
  /** Loop bead index the user is currently on, or -1. */
  activeIndex: number;
  /** Which chaplet of a full rosary is being shown (1-based). */
  chaplet: number;
  chaplets: number;
};

function stateOf(step: Step, done: Set<number>, current: number): BeadState {
  if (step.id === current) return 'active';
  return done.has(step.id) ? 'done' : 'todo';
}

/**
 * Projects the sequence onto the 55 beads of a physical rosary loop plus the
 * five beads of the pendant. A twenty-decade rosary reuses the same loop once
 * per chaplet, which is exactly how it is prayed in the hand.
 */
export function loopView(steps: Step[], done: Set<number>, current: number): LoopView {
  const beads: LoopBead[] = Array.from({ length: 55 }, (_, i) => ({
    kind: i % 11 === 0 ? 'pater' : 'ave',
    state: 'todo',
  }));

  // Pendant, ordered from the medal down to the crucifix.
  const pendant: BeadState[] = ['todo', 'todo', 'todo', 'todo', 'todo'];
  const opening = steps.filter((s) => s.decade === undefined && s.kind !== 'closing');
  // opening = [cross, creed, ourFather, hailMary ×3, gloryBe]
  const pendantSteps = [
    opening.find((s) => s.prayer === 'gloryBe'),
    ...opening.filter((s) => s.prayer === 'hailMary').slice(0, 3).reverse(),
    opening.find((s) => s.prayer === 'ourFather'),
  ];
  pendantSteps.forEach((step, i) => {
    if (step) pendant[i] = stateOf(step, done, current);
  });

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

  return { beads, pendant, activeIndex, chaplet, chaplets };
}
