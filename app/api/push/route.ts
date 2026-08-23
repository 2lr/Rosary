import { fail, handle, json, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { dropSubscription, saveSubscription, subscriptionCount } from '@/lib/db/push';
import { publicKey } from '@/lib/push/send';

/**
 * A browser signing up to be reminded, or dropping out.
 *
 * The public VAPID key is handed out here too, because a browser cannot
 * subscribe without it and it is meant to be public.
 */

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({
      key: publicKey(),
      subscriptions: await subscriptionCount(user.id),
    });
  });
}

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);

    const endpoint = body?.endpoint;
    const p256dh = body?.keys?.p256dh;
    const auth = body?.keys?.auth;
    if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint)) {
      return fail('invalid_subscription');
    }
    if (typeof p256dh !== 'string' || typeof auth !== 'string' || !p256dh || !auth) {
      return fail('invalid_subscription');
    }

    await saveSubscription(user.id, { endpoint, p256dh, auth });
    return json({ subscriptions: await subscriptionCount(user.id) });
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);
    if (typeof body?.endpoint === 'string') await dropSubscription(body.endpoint);
    return json({ subscriptions: await subscriptionCount(user.id) });
  });
}
