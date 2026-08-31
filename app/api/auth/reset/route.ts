import { fail, handle, json, readJson } from '@/lib/api';
import { checkPasswordStrength } from '@/lib/auth/password';
import { hashResetToken, stillValid } from '@/lib/auth/reset';
import { setSessionCookie } from '@/lib/auth/session';
import { consumeReset, findReset, setPassword } from '@/lib/db/users';

/**
 * Spending the token, and choosing the new password.
 *
 * The token is consumed before the password is written, so a request that
 * arrives twice cannot set two passwords — and the one that loses the race is
 * told the token is spent rather than quietly doing nothing.
 *
 * On success the person is signed in. They have just proved they hold the
 * address; making them type the password they invented ten seconds ago is a
 * step that protects nobody.
 */

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<{ token?: string; password?: string }>(request);
    const token = (body?.token ?? '').trim();
    const password = body?.password ?? '';

    if (!token) return fail('invalid_token');

    const strength = checkPasswordStrength(password);
    if (strength === 'too-short') return fail('password_too_short');
    if (strength === 'too-long') return fail('password_too_long');

    const hash = hashResetToken(token);
    const reset = await findReset(hash);
    if (!reset || !stillValid(reset, new Date())) return fail('invalid_token');

    if (!(await consumeReset(hash))) return fail('invalid_token');

    await setPassword(reset.userId, password);
    await setSessionCookie(reset.userId);
    return json({ ok: true });
  });
}
