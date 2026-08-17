// Cache-first service worker for the app shell.
//
// IMPORTANT: bump CACHE_VERSION on every deploy. Installed apps serve from their own
// cache, so without a new version users would keep running the old code forever.
const CACHE_VERSION = 'v8';
const CACHE_NAME = `dixit-score-${CACHE_VERSION}`;

const APP_SHELL = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/state.js',
  'js/rules.js',
  'js/storage.js',
  'js/known-players.js',
  'js/wake-lock.js',
  'js/i18n.js',
  'js/palette.js',
  'js/ui/html.js',
  'js/ui/dialog.js',
  'js/ui/game-screen.js',
  'js/ui/player-card.js',
  'js/ui/color-picker.js',
  'js/ui/setup-dialog.js',
  'js/ui/add-player-dialog.js',
  'js/ui/edit-player-dialog.js',
  'js/ui/scoring-dialog.js',
  'js/ui/reorderable-list.js',
  'icons/logo.jpg',
  'icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      // Take over without waiting for every old tab to close.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only GET requests are cacheable; anything else goes straight to the network.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache successful same-origin responses so later visits work offline too.
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        // Offline and not cached: fall back to the app shell for navigations.
        .catch(() => (event.request.mode === 'navigate'
          ? caches.match('index.html')
          : Promise.reject(new Error('offline'))));
    })
  );
});
