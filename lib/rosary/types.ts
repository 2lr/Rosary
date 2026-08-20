import type { MysterySetId } from './mysteries';
import type { PrayerId } from './prayers';

/** What kind of rosary the user set out to pray. */
export type RosaryKind =
  /** The five decades of the day's mysteries. */
  | 'chaplet'
  /** All twenty mysteries, the full rosary. */
  | 'full'
  /** No fixed mysteries: the user writes or speaks their own prayer. */
  | 'free';

export type RosaryStatus = 'in_progress' | 'completed' | 'abandoned';

/** How the user prays: silently/aloud, or writing each intention down. */
export type PrayerMode = 'spoken' | 'written';

export type StepKind =
  | 'opening'
  | 'prayer'
  | 'bead'
  | 'mystery'
  | 'decade-end'
  | 'free-write'
  | 'closing';

export type Step = {
  /** Stable index within the sequence. */
  id: number;
  kind: StepKind;
  /** The prayer to say, when the step carries one. */
  prayer?: PrayerId;
  /** Which decade this step belongs to (1-based), if any. */
  decade?: number;
  /** Which mystery set the decade belongs to. */
  set?: MysterySetId;
  /** Position of the mystery within its set (1-5). */
  mystery?: number;
  /** For Hail Mary beads: which of the ten. */
  beadInDecade?: number;
  /** Extra note shown under the title, already localised at build time. */
  hint?: string;
};

export type RosaryProgress = {
  /** Index of the step the user is currently on. */
  step: number;
  /** Steps already marked as prayed. */
  done: number[];
  /** Free-form text the user wrote, keyed by step id. */
  writings: Record<string, string>;
};

export type Rosary = {
  id: string;
  userId: string;
  kind: RosaryKind;
  mode: PrayerMode;
  /** Present for 'chaplet'; for 'full' the sequence walks all four sets. */
  mysterySet: MysterySetId | null;
  lang: 'fr' | 'en';
  intention: string | null;
  status: RosaryStatus;
  progress: RosaryProgress;
  /** Number of decades completed, denormalised for cheap statistics. */
  decadesCompleted: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
};
