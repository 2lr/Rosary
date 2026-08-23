import 'server-only';
import webpush from 'web-push';
import type { PushMessage } from '@/lib/push/messages';

/**
 * Handing a notification to the browser's push service.
 *
 * Three environment variables, and nothing goes out without them:
 * VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT (a mailto: address the
 * push services can complain to). Generate the pair once with
 * `npx web-push generate-vapid-keys` and keep the private one private — the
 * public one is handed to every browser that subscribes, which is its job.
 */

export type PushOutcome = 'sent' | 'unconfigured' | 'gone' | 'failed';

let configured: boolean | null = null;

/** The key a browser needs to subscribe. Null when push is not set up. */
export function publicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function configure(): boolean {
  if (configured !== null) return configured;

  const publik = process.env.VAPID_PUBLIC_KEY?.trim();
  const secret = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publik || !secret || !subject) {
    configured = false;
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publik, secret);
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export async function sendPush(
  target: { endpoint: string; p256dh: string; auth: string },
  message: PushMessage,
): Promise<PushOutcome> {
  if (!configure()) return 'unconfigured';

  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(message),
      { TTL: 6 * 3600 },
    );
    return 'sent';
  } catch (error) {
    // 404 and 410 are the push service saying this browser is gone for good;
    // anything else may work next time and the subscription is left alone.
    const status = (error as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? 'gone' : 'failed';
  }
}
