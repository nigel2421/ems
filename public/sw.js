// KuraTech Offline Service Worker for Field Agent PWA (QA OFF-01..OFF-09)
const CACHE_NAME = 'ems-pwa-v4';
const ASSETS_TO_CACHE = [
  '/index.html',
  '/favicon.svg',
  '/favicon.ico',
  '/kuratech-logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => Promise.all(clients.map((client) => {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) return null;
        if (clientUrl.pathname !== '/' && clientUrl.pathname !== '/admin.html') return null;
        return client.navigate(client.url).catch(() => null);
      })))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // The public domain must follow Nginx's redirect for the admin entry.
  // Never serve an old cached admin shell from the public-domain cache.
  if (requestUrl.pathname === '/admin.html') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Always refresh navigations when online so a prior admin shell or stale
  // login page cannot be replayed from the app cache.
  if (event.request.mode === 'navigate' || requestUrl.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
