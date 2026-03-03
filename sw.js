// Import OneSignal push worker (merges into same SW scope)
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

var CACHE = 'app-v2';
var SCREENSHOT_COUNT = 3;
var STATIC = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192.webp',
  './icon-512.webp'
];
for (var i = 1; i <= SCREENSHOT_COUNT; i++) {
  STATIC.push('./screenshot' + i + '.webp');
}

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(STATIC);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Cross-origin — pass through
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;
  var isPage = path.endsWith('/') || path.endsWith('index.html') || path.endsWith('app.html');

  if (isPage) {
    // Network-first for pages
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match('./index.html');
      })
    );
  } else {
    // Cache-first for assets
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
          return response;
        });
      })
    );
  }
});
