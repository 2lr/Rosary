import { fail, handle, json, readJson } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/auth/guard';
import { findUserById, updateUserPreferences } from '@/lib/db/users';
import { isLang } from '@/lib/i18n/config';
import { isValidHour } from '@/lib/push/clock';
import { isHexColor, normalizeHex } from '@/lib/rosary/color';
import { isHailMaryVariant } from '@/lib/rosary/prayers';
import { isLoopShape } from '@/lib/rosary/shapes';

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    return json({ user });
  });
}

type Body = {
  lang?: string;
  displayName?: string | null;
  colors?: unknown;
  shape?: string;
  hailMary?: string;
  /** Hour of the user's own day for the reminder, or null to stop it. */
  notifyHour?: number | null;
  /** Whether to hear, in the evening, what the people below them prayed. */
  notifyLineage?: boolean;
  /** Their zone, so the hour means what they think it means. */
  timeZone?: string;
};

export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);
    if (!body) return fail('invalid_body');

    if (body.lang !== undefined && !isLang(body.lang)) return fail('invalid_lang');
    if (body.notifyHour !== undefined && body.notifyHour !== null && !isValidHour(body.notifyHour)) {
      return fail('invalid_hour');
    }
    if (body.shape !== undefined && !isLoopShape(body.shape)) return fail('invalid_shape');
    if (body.hailMary !== undefined && !isHailMaryVariant(body.hailMary)) {
      return fail('invalid_hail_mary');
    }

    if (body.displayName !== undefined && body.displayName !== null) {
      if (typeof body.displayName !== 'string' || body.displayName.length > 80) {
        return fail('invalid_name');
      }
    }

    let colors: [string, string, string] | null | undefined;
    if (body.colors !== undefined) {
      if (body.colors === null) {
        colors = null;
      } else if (
        Array.isArray(body.colors) &&
        body.colors.length === 3 &&
        body.colors.every(isHexColor)
      ) {
        colors = body.colors.map((c) => normalizeHex(c as string)) as [string, string, string];
      } else {
        return fail('invalid_colors');
      }
    }

    await updateUserPreferences(user.id, {
      ...(body.notifyHour !== undefined ? { notifyHour: body.notifyHour } : {}),
      ...(body.notifyLineage !== undefined ? { notifyLineage: !!body.notifyLineage } : {}),
      ...(typeof body.timeZone === 'string' && body.timeZone.length <= 64
        ? { timeZone: body.timeZone }
        : {}),
      ...(body.lang !== undefined && isLang(body.lang) ? { lang: body.lang } : {}),
      ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
      ...(colors !== undefined ? { colors } : {}),
      ...(body.shape !== undefined && isLoopShape(body.shape) ? { shape: body.shape } : {}),
      ...(body.hailMary !== undefined && isHailMaryVariant(body.hailMary)
        ? { hailMary: body.hailMary }
        : {}),
    });

    return json({ user: await findUserById(user.id) });
  });
}
