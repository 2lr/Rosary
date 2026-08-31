import { handle, json } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { noticeHistory, recentNotices } from '@/lib/db/notices';
import { catchUpNotices } from '@/lib/mail/catchUp';
import { noticesToRetry } from '@/lib/mail/retry';

/** What became of the last words this person sent. Their own sends, nobody else's. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const [notices, history] = await Promise.all([recentNotices(user.id), noticeHistory(user.id)]);
    // How many the button would actually send, not how many failed: a person
    // offered a repair should be told the true number.
    return json({ notices, waiting: noticesToRetry(history, new Date()).length });
  });
}

/**
 * "Send the ones that never went out."
 *
 * Only ever this person's own backlog, and only the notices that failed for a
 * reason on our side. What comes back is the count, so the button can say what
 * it did rather than merely that it was pressed.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    return json(await catchUpNotices(user.id, originOf(request)));
  });
}

function originOf(request: Request): string | null {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return null;
  const proto =
    request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
