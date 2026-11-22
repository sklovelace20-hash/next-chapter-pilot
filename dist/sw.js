const cacheName = 'next-chapter-shell-v17';
const assets = ['./', './index.html', './style.css', './app.js', './planner.js', './roadmap.js', './vault-crypto.js', './discovery.js', './discovery-content.js', './deeper.js', './growth.js', './ai-mirror.js', './evening-trail.webp', './journey.js', './journey-content.js', './value-cards.js', './plan-hub.js', './answer-selection.js', './library.js', './everyday-tools.js', './everyday-content.js', './everyday-trail.webp', './middle-theory-library.js', './accomplishments.js', './routes.js', './assessment.js', './hub-icons.woff2', './personality-watercolor.webp',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('next-chapter-shell-') && key !== cacheName)
      .map((key) => caches.delete(key))
  )));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(event.request) ||
      (event.request.mode === 'navigate' ? await cache.match('./index.html') : Response.error());
  }));
});
