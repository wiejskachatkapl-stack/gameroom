const CACHE='game-room-v1002';
const ASSETS=['./','./index.html','./style.css','./app.js','./firebase.js','./manifest.json','./assets/screens/bg_login.png','./assets/screens/bg_profile.png','./assets/screens/bg_rooms.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
