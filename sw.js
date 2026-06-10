const CACHE_NAME = 'can-you-brexit-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sounds/click.wav',
  './images/title.jpg',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/coin-heads.png',
  './images/coin-tails.png',
  './images/coin-unflipped.png'
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// The game lives in index.html, so fetch it network-first: players get
// updates as soon as they're online, and the cached copy still works offline.
// Static assets (images/sounds) are immutable and served cache-first.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isPage = event.request.mode === 'navigate' ||
                 url.pathname.endsWith('/index.html') ||
                 url.pathname.endsWith('/');

  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Clean up old caches and take control of open pages
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
