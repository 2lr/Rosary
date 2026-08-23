/**
 * Getting a browser to agree to be reminded, and telling the server where.
 *
 * The permission prompt only ever appears from a real tap — every browser
 * requires it and Safari is strict about it — so every one of these is called
 * straight out of a click handler and nothing here runs on its own.
 */

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

export function pushState(): PushState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PushState;
}

/** The public key, base64url as the server hands it out, as bytes. */
function keyBytes(base64: string): Uint8Array {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function encode(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Ask, subscribe, and register. Returns what the browser decided, so the caller
 * can keep asking or stop.
 */
export async function enablePush(): Promise<PushState> {
  if (pushState() === 'unsupported') return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission as PushState;

  const settings = await fetch('/api/push');
  if (!settings.ok) return 'granted';
  const { key } = (await settings.json()) as { key: string | null };
  // Granted, but nothing can be delivered until the server has its keys. The
  // permission is still worth keeping: it is the part that needs a person.
  if (!key) return 'granted';

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(key),
    }));

  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: encode(subscription.getKey('p256dh')),
        auth: encode(subscription.getKey('auth')),
      },
    }),
  });

  return 'granted';
}

/** Stop hearing from it on this browser. */
export async function disablePush(): Promise<void> {
  if (pushState() === 'unsupported') return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch('/api/push', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

/** The zone this browser is in, for an hour to mean what the person means. */
export function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  } catch {
    return 'Europe/Paris';
  }
}
