import type { Lang } from '@/lib/i18n/config';
import { MYSTERY_SETS, MYSTERY_SET_ORDER, type MysterySetId } from './mysteries';
import { OPENING_VIRTUES } from './prayers';
import type { PrayerMode, RosaryKind, Step } from './types';

export type SequenceInput = {
  kind: RosaryKind;
  mysterySet: MysterySetId | null;
  mode: PrayerMode;
  lang: Lang;
};

/**
 * Expands a rosary into the ordered list of steps the user walks through.
 *
 * Pure and deterministic: the database only ever stores which steps are done,
 * never the sequence itself, so the same rosary can be resumed on any device.
 */
export function buildSequence({ kind, mysterySet, mode, lang }: SequenceInput): Step[] {
  const steps: Step[] = [];
  let id = 0;
  const push = (step: Omit<Step, 'id'>) => {
    steps.push({ ...step, id: id++ });
  };

  // --- Opening: cross, creed, Our Father, three Hail Marys, Glory Be ---
  push({ kind: 'opening', prayer: 'signOfTheCross' });
  push({ kind: 'prayer', prayer: 'creed' });
  push({ kind: 'bead', prayer: 'ourFather' });
  for (let i = 0; i < 3; i++) {
    push({ kind: 'bead', prayer: 'hailMary', hint: OPENING_VIRTUES[i][lang] });
  }
  push({ kind: 'prayer', prayer: 'gloryBe' });

  // --- Decades ---
  const sets: MysterySetId[] =
    kind === 'full'
      ? MYSTERY_SET_ORDER
      : kind === 'chaplet' && mysterySet
        ? [mysterySet]
        : [];

  const decadeGroups: { set: MysterySetId | null; mystery: number }[] = [];
  if (sets.length > 0) {
    for (const set of sets) {
      for (let m = 1; m <= 5; m++) decadeGroups.push({ set, mystery: m });
    }
  } else {
    // Free rosary: five decades, each opened by the user's own intention.
    for (let m = 1; m <= 5; m++) decadeGroups.push({ set: null, mystery: m });
  }

  decadeGroups.forEach((group, i) => {
    const decade = i + 1;
    const base = { decade, ...(group.set ? { set: group.set } : {}), mystery: group.mystery };

    if (group.set) {
      push({ kind: 'mystery', ...base });
    } else {
      push({
        kind: 'free-write',
        ...base,
        hint:
          mode === 'written'
            ? lang === 'fr'
              ? 'Écrivez l’intention de cette dizaine.'
              : 'Write the intention of this decade.'
            : lang === 'fr'
              ? 'Formulez à voix haute l’intention de cette dizaine.'
              : 'Name aloud the intention of this decade.',
      });
    }

    push({ kind: 'bead', prayer: 'ourFather', ...base });
    for (let b = 1; b <= 10; b++) {
      push({ kind: 'bead', prayer: 'hailMary', ...base, beadInDecade: b });
    }
    push({ kind: 'prayer', prayer: 'gloryBe', ...base });
    push({ kind: 'decade-end', prayer: 'fatima', ...base });
  });

  // --- Closing ---
  push({ kind: 'closing', prayer: 'salveRegina' });
  push({ kind: 'closing', prayer: 'closing' });

  return steps;
}

export function totalDecades(kind: RosaryKind): number {
  return kind === 'full' ? 20 : 5;
}

/** Number of decades whose closing step has been marked as prayed. */
export function countCompletedDecades(steps: Step[], done: Set<number>): number {
  return steps.filter((s) => s.kind === 'decade-end' && done.has(s.id)).length;
}

/** How many Hail Marys the sequence contains, for the statistics page. */
export function countHailMarys(steps: Step[], done: Set<number>): number {
  return steps.filter((s) => s.prayer === 'hailMary' && done.has(s.id)).length;
}

/** Index of the first step that has not been marked as prayed. */
export function firstUndoneStep(steps: Step[], done: Set<number>): number {
  const idx = steps.findIndex((s) => !done.has(s.id));
  return idx === -1 ? Math.max(0, steps.length - 1) : idx;
}

/** Groups the sequence into the sections shown in the progress rail. */
export type Section = { label: string; from: number; to: number; decade: number | null };

export function sections(steps: Step[], lang: Lang): Section[] {
  const out: Section[] = [];
  let current: Section | null = null;

  for (const step of steps) {
    const decade = step.decade ?? null;
    const label =
      decade === null
        ? step.kind === 'closing'
          ? lang === 'fr'
            ? 'Conclusion'
            : 'Conclusion'
          : lang === 'fr'
            ? 'Ouverture'
            : 'Opening'
        : step.set
          ? MYSTERY_SETS[step.set].mysteries[(step.mystery ?? 1) - 1].title[lang]
          : lang === 'fr'
            ? `Dizaine ${decade}`
            : `Decade ${decade}`;

    if (!current || current.label !== label || current.decade !== decade) {
      current = { label, from: step.id, to: step.id, decade };
      out.push(current);
    } else {
      current.to = step.id;
    }
  }

  return out;
}
