// Caches the app shell so it opens instantly; translation itself always needs the network.
// Must stay at the site root so its scope covers the whole app.
const CACHE = 'live-translate-v6';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/logo.js',
  'assets/js/config.js',
  'assets/js/i18n.js',
  'assets/js/app.js',
  'assets/js/report.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // translation APIs: network only
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
