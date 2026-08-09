const CACHE_NAME = 'game-room-v1085';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const headers = new Headers(res.headers);
          headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers
          });
        })
        .catch(() => caches.match(req))
    );
  }
});
