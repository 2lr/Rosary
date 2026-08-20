import { fail, handle, json, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { createRosary, listRosaries } from '@/lib/db/rosaries';
import { isMysterySetId, mysterySetForDate } from '@/lib/rosary/mysteries';
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

    let mysterySet: string | null = null;
    if (kind === 'chaplet') {
      mysterySet = isMysterySetId(body.mysterySet)
        ? body.mysterySet
        : mysterySetForDate(new Date());
    }

    const intention =
      typeof body.intention === 'string' && body.intention.trim()
        ? body.intention.trim().slice(0, MAX_INTENTION)
        : null;

    const rosary = await createRosary({
      userId: user.id,
      kind,
      mode,
      mysterySet,
      lang,
      intention,
    });

    return json({ rosary }, { status: 201 });
  });
}
