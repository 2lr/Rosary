import { fail, handle, json, readJson } from '@/lib/api';
import { checkPasswordStrength } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { createUser, findUserByEmail, isValidEmail } from '@/lib/db/users';
import { normalizeLang } from '@/lib/i18n/config';

type Body = { email?: string; password?: string; lang?: string; displayName?: string };

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<Body>(request);
    const email = (body?.email ?? '').trim();
    const password = body?.password ?? '';

    if (!isValidEmail(email)) return fail('invalid_email');

    const strength = checkPasswordStrength(password);
    if (strength === 'too-short') return fail('password_too_short');
    if (strength === 'too-long') return fail('password_too_long');

    if (await findUserByEmail(email)) return fail('email_taken', 409);

    const user = await createUser({
      email,
      password,
      lang: normalizeLang(body?.lang),
      displayName: body?.displayName ?? null,
    });

    await setSessionCookie(user.id);
    return json({ user });
  });
}
