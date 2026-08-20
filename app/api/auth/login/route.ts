import { fail, handle, json, readJson } from '@/lib/api';
import { setSessionCookie } from '@/lib/auth/session';
import { authenticate } from '@/lib/db/users';

type Body = { email?: string; password?: string };

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<Body>(request);
    const email = (body?.email ?? '').trim();
    const password = body?.password ?? '';
    if (!email || !password) return fail('invalid_credentials', 401);

    const user = await authenticate(email, password);
    if (!user) return fail('invalid_credentials', 401);

    await setSessionCookie(user.id);
    return json({ user });
  });
}
