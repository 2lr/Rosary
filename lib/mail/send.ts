import 'server-only';

/**
 * Putting a mail on its way.
 *
 * One provider, reached over HTTP so there is no dependency to install: Resend.
 * Two environment variables decide whether anything leaves the building —
 * RESEND_API_KEY and MAIL_FROM. With either missing the send is reported as
 * `unconfigured` rather than attempted, and the caller records that: a rosary
 * must never fail to finish because a mail server was not set up.
 *
 * The address of the app itself is not among them. It is read off the request
 * that is finishing the rosary, so the link in the mail is whatever host the
 * person is actually using — APP_URL is only there to override that.
 */

export type MailMessage = { to: string; subject: string; text: string; html: string };

export type MailStatus = 'sent' | 'unconfigured' | 'failed';

export type MailResult = { status: MailStatus; error?: string };

/**
 * Where the app answers, for links inside a mail. No trailing slash.
 *
 * The request's own origin is the truth in almost every case; APP_URL overrides
 * it for the deployment that serves under a name it is not reached by.
 */
export function appUrl(fallback?: string | null): string | null {
  const url = process.env.APP_URL?.trim() || fallback?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

/** How long to wait on the provider before giving up on it. */
const TIMEOUT_MS = 8000;

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!key || !from) return { status: 'unconfigured' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      // The body carries the provider's reason, which is the only useful thing
      // to keep; it is stored against the notice, never shown to anybody.
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      return { status: 'failed', error: `${response.status} ${detail}`.trim() };
    }

    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: String(error).slice(0, 300) };
  }
}
