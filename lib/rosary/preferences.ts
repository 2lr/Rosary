import type { BloomPreferences } from './growth';

type Preferable = { colors: readonly string[] | null; shape: BloomPreferences['shape'] };

/** The part of a user record the artwork actually reads. */
export function preferencesOf(user: Preferable): BloomPreferences {
  return { colors: user.colors, shape: user.shape };
}
