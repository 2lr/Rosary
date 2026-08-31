import { handle, json, readJson } from '@/lib/api';
import { expiryFrom, hashResetToken, newResetToken } from '@/lib/auth/reset';
import { findUserByEmail, openReset, recentResets } from '@/lib/db/users';
import { resetNotice } from '@/lib/mail/resetNotice';
import { appUrl, sendMail } from '@/lib/mail/send';

/**
 * "I have forgotten my password."
 *
 * The reply is the same whether or not the address has an account, and takes
 * about as long either way: an endpoint that answers differently is a way of
 * asking whether somebody uses this app, which is not a question a stranger
 * gets to ask.
 *
 * What it does report is whether the server can send mail at all. That is a
 * fact about this deployment, not about the person, so saying it tells nobody
 * anything about anybody — and not saying it leaves somebody staring at a
 * screen that promised a mail which was never going to come.
 */

/** How many times one account may ask within the window below. */
const MAX_ASKS = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<{ email?: string }>(request);
    const email = (body?.email ?? '').trim();

    const configured = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim());
    const reply = json({ ok: true, mail: configured ? 'attempted' : 'unconfigured' });
    if (!configured || !email) return reply;

    const user = await findUserByEmail(email);
    if (!user) return reply;

    // Asking repeatedly must not turn this into a way of flooding somebody's
    // inbox, and the person who genuinely asked twice still has their token.
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    if ((await recentResets(user.id, since)) >= MAX_ASKS) return reply;

    const token = newResetToken();
    await openReset(user.id, hashResetToken(token), expiryFrom(new Date()));

    const base = appUrl(originOf(request));
    if (base) {
      await sendMail({
        to: user.email,
        ...resetNotice({ lang: user.lang, token, appUrl: base }),
      });
    }

    return reply;
  });
}

function originOf(request: Request): string | null {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return null;
  const proto =
    request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
