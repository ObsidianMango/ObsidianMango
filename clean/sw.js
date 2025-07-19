const CACHE_NAME = 'cleaning-checklist-v1';
const urlsToCache = [
  '/',
  '/index.html', // Or whatever your HTML is named
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // List all your images (task images etc)
  // '/1emptybin.png', '/2binbehind.png', ...etc
  // '/YOUR-TILE.png'
];

// Install event - cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - clean up old caches if needed
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
    ))
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});