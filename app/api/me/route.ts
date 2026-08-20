import { fail, handle, json, readJson } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/auth/guard';
import { findUserById, updateUserPreferences } from '@/lib/db/users';
import { isLang } from '@/lib/i18n/config';

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    return json({ user });
  });
}

type Body = { lang?: string; displayName?: string | null };

export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);
    if (!body) return fail('invalid_body');

    if (body.lang !== undefined && !isLang(body.lang)) return fail('invalid_lang');
    if (body.displayName !== undefined && body.displayName !== null) {
      if (typeof body.displayName !== 'string' || body.displayName.length > 80) {
        return fail('invalid_name');
      }
    }

    await updateUserPreferences(user.id, {
      ...(body.lang !== undefined && isLang(body.lang) ? { lang: body.lang } : {}),
      ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
    });

    return json({ user: await findUserById(user.id) });
  });
}
