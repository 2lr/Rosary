import { fail, handle, json, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { createRosary, listRosaries } from '@/lib/db/rosaries';
import { isValidEmail } from '@/lib/db/users';
import { isMysterySetId, mysterySetForDate } from '@/lib/rosary/mysteries';
import { instantFor, isDayKey, withinBackdate } from '@/lib/rosary/pastDay';
import { isLang, normalizeLang } from '@/lib/i18n/config';
import type { PrayerMode, RosaryKind } from '@/lib/rosary/types';

const KINDS: RosaryKind[] = ['chaplet', 'full', 'free'];
const MODES: PrayerMode[] = ['spoken', 'written'];
const MAX_INTENTION = 500;

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({ rosaries: await listRosaries(user.id) });
  });
}

type Body = {
  kind?: string;
  mode?: string;
  mysterySet?: string | null;
  lang?: string;
  intention?: string | null;
  /** Somebody to tell when it is finished. */
  notifyEmail?: string | null;
  /** The day it was prayed, YYYY-MM-DD, when that was not today. */
  prayedOn?: string | null;
};

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);
    if (!body) return fail('invalid_body');

    const kind = KINDS.find((k) => k === body.kind);
    if (!kind) return fail('invalid_kind');

    const mode = MODES.find((m) => m === body.mode) ?? 'spoken';
    const lang = isLang(body.lang) ? body.lang : normalizeLang(user.lang);

    // A day may be named for a rosary prayed on beads and written down later.
    // The window is checked here rather than trusted: a date typed into a form
    // is a number from a stranger until it has been looked at.
    const today = new Date();
    let prayedAt: string | null = null;
    if (body.prayedOn !== undefined && body.prayedOn !== null && body.prayedOn !== '') {
      if (!isDayKey(body.prayedOn)) return fail('invalid_day');
      if (!withinBackdate(body.prayedOn, today.toISOString().slice(0, 10))) {
        return fail('day_out_of_range');
      }
      prayedAt = instantFor(body.prayedOn);
    }

    let mysterySet: string | null = null;
    if (kind === 'chaplet') {
      // The mysteries of the day it was prayed, not of the day it was typed in.
      mysterySet = isMysterySetId(body.mysterySet)
        ? body.mysterySet
        : mysterySetForDate(prayedAt ? new Date(prayedAt) : today);
    }

    const intention =
      typeof body.intention === 'string' && body.intention.trim()
        ? body.intention.trim().slice(0, MAX_INTENTION)
        : null;

    // Kept with the rosary and used once, when it is finished — praying for
    // somebody is not a thing to announce before it has happened.
    const notifyEmail =
      typeof body.notifyEmail === 'string' && isValidEmail(body.notifyEmail.trim())
        ? body.notifyEmail.trim().toLowerCase()
        : null;

    const rosary = await createRosary({
      userId: user.id,
      kind,
      mode,
      mysterySet,
      lang,
      intention,
      notifyEmail,
      prayedAt,
    });

    return json({ rosary }, { status: 201 });
  });
}
