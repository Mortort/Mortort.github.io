// Bump V whenever you deploy changes so players get the new files.
const V='bean-there-v1';
const FILES=['./','index.html','css/style.css','manifest.webmanifest','icons/icon.svg',
'js/main.js','js/core/events.js','js/core/state.js','js/core/ui.js','js/data/drinks.js',
'js/systems/orders.js','js/stations/espresso.js','js/stations/frother.js','js/stations/art.js','js/stations/extras.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
