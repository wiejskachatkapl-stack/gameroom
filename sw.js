const CACHE_NAME = 'game-room-v1084';
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req, {cache: 'no-store'}).catch(() => caches.match(req)));
    return;
  }
  event.respondWith(fetch(req, {cache: 'no-store'}).catch(() => caches.match(req)));
});
