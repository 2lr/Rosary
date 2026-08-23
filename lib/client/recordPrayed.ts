import type { MysterySetId } from '@/lib/rosary/mysteries';
import type { RosaryKind } from '@/lib/rosary/types';

/**
 * Recording a rosary that was prayed away from the phone.
 *
 * On a real chaplet you have already finished before you think to open the app.
 * This writes it down in one gesture: the rosary is created exactly as it would
 * have been, then closed with every bead marked, so it counts for the same as
 * one prayed on the screen — the same decades, the same growth, and the same
 * word to whoever it was prayed for.
 *
 * It goes through the ordinary two calls rather than a shortcut of its own,
 * which is what keeps those three things true without repeating them.
 */
export async function recordPrayed(input: {
  kind: RosaryKind;
  mysterySet: MysterySetId | null;
  lang: string;
  intention?: string | null;
  notifyEmail?: string | null;
}): Promise<boolean> {
  const created = await fetch('/api/rosaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: input.kind,
      mode: 'spoken',
      mysterySet: input.mysterySet,
      lang: input.lang,
      intention: input.intention ?? null,
      notifyEmail: input.notifyEmail ?? null,
    }),
  });
  if (!created.ok) return false;

  const { rosary } = (await created.json()) as { rosary: { id: string } };
  const finished = await fetch(`/api/rosaries/${rosary.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed', markAll: true }),
  });
  return finished.ok;
}

/** The same, for a rosary already begun on the screen and finished off it. */
export async function finishNow(id: string): Promise<boolean> {
  const response = await fetch(`/api/rosaries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed', markAll: true }),
  });
  return response.ok;
}
