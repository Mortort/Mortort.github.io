const V='bean-there-v4';
const FILES=['./','index.html','css/style.css','manifest.webmanifest','icons/icon.svg',
'js/main.js','js/core/events.js','js/core/state.js','js/core/ui.js','js/data/drinks.js','js/systems/orders.js',
'js/stations/cups.js','js/stations/grinder.js','js/stations/tamper.js','js/stations/machine.js','js/stations/milk.js',
'js/stations/wand.js','js/stations/pour.js','js/stations/water.js','js/stations/art.js','js/stations/extras.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
