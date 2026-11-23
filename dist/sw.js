const cacheName = 'next-chapter-shell-persistent-undo';
const assets = ['./', './index.html', './mountain-book.webp', './style.css', './app.js', './personal-os.js', './saved-answers.js', './welcome.js', './fun.js', './fun-park.webp', './bucket-bingo.js', './planner.js', './roadmap.js', './roadmap-route.svg', './vault-crypto.js', './discovery.js', './discovery-content.js', './personality-results.js', './personality-refresh.js', './deeper.js', './growth.js', './ai-mirror.js', './evening-trail.webp', './journey.js', './journey-content.js', './value-cards.js', './plan-hub.js', './activity-builder.js', './project-tracker.js', './answer-selection.js', './library.js', './everyday-tools.js', './everyday-content.js', './everyday-trail.webp', './middle-theory-library.js', './accomplishments.js', './routes.js', './assessment.js', './hub-icons.woff2', './personality-watercolor.webp',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('next-chapter-') && key !== cacheName)
      .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(event.request) ||
      (event.request.mode === 'navigate' ? await cache.match('./index.html') : Response.error());
  }));
});
