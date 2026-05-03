const CACHE_NAME = 'health-dashboard-v2';
const ASSETS = [
  './',
  './index.html',
  './details.html',
  './insights.html',
  './style.css',
  './main.js',
  './details.js',
  './insights.js',
  './wearable.js',
  './manifest.json',
  './theme.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
