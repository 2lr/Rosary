import { fail, handle, json, readJson } from '@/lib/api';
import { checkPasswordStrength } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import {
  createUser,
  findUserByEmail,
  findUserByInviteCode,
  hasAnyUser,
  isValidEmail,
} from '@/lib/db/users';
import { sponsorForEmail } from '@/lib/db/notices';
import { normalizeLang } from '@/lib/i18n/config';

type Body = {
  email?: string;
  password?: string;
  lang?: string;
  displayName?: string;
  /** The code of whoever invited them. */
  code?: string;
};

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

    // Nobody comes in on their own: an account is somebody's guest. There are
    // three ways to be one, and all three end with a host recorded.
    //
    // A code, typed or carried in by the link. Or the address itself: somebody
    // who was prayed for, and had this address named while it happened, is
    // already invited by whoever did that — they need type nothing. And the
    // very first account on an empty install, which has nobody to be invited
    // by, without which the app could never be started at all.
    let invitedBy: string | null = null;
    if (await hasAnyUser()) {
      const host = await findUserByInviteCode(body?.code);
      invitedBy = host?.id ?? (await sponsorForEmail(email));
      if (!invitedBy) return fail('invalid_code');
    }

    const user = await createUser({
      email,
      password,
      lang: normalizeLang(body?.lang),
      displayName: body?.displayName ?? null,
      invitedBy,
    });

    await setSessionCookie(user.id);
    return json({ user });
  });
}
