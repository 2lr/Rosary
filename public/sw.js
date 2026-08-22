/**
 * A deliberately small service worker.
 *
 * The app shell and assets are cached so the rosary opens instantly and works
 * on a phone with no signal; anything that touches the database always goes to
 * the network, because progress must never be served stale.
 */
const VERSION = 'rosary-v2';
const ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/**
 * What is safe to keep: things that never change without changing their name.
 * Next fingerprints everything under /_next/static, and the icons and manifest
 * are fixed. Nothing else.
 */
function isStaticAsset(url, request) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.pathname.startsWith('/icons/')) return true;
  if (url.pathname === '/manifest.webmanifest') return true;
  return ['style', 'script', 'font', 'image'].includes(request.destination);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Moving between pages fetches a React Server Component payload: an ordinary
  // GET that carries the whole rendered page, palette included. Caching one
  // pins the interface to the colours it was built with — which is why
  // changing a colour used to need the app killed and reopened. These always
  // go to the network.
  if (url.searchParams.has('_rsc') || request.headers.get('RSC')) return;

  // Navigations: network first, fall back to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit || caches.match('/offline')),
      ),
    );
    return;
  }

  // Anything else that is not a fingerprinted asset is left to the network,
  // because anything else can carry the user's own data.
  if (!isStaticAsset(url, request)) return;

  // Assets: serve from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
