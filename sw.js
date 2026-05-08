/**
 * EnnHealth Psychiatry — Service Worker
 * Provides offline support, caching, and PWA install capability.
 */

var CACHE_NAME = 'ennhealth-v2';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dist/styles.min.css',
  '/dist/main.min.js',
  '/dist/mobile-app.min.js',
  '/dist/screening.min.js',
  '/dist/shared-header.min.js',
  '/dist/ga-events.min.js',
  '/dist/gtag-init.min.js',
  '/dist/sw-register.min.js',
  '/manifest.json',
  '/assets/images/logo-192.png',
  '/assets/images/logo-512.png',
  '/assets/images/favicon-32.png',
  '/about/',
  '/faq/',
  '/locations/'
];

// Install — cache critical assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network-first for API/dynamic, cache-first for static assets
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Google Analytics, external APIs, and Apps Script
  if (url.hostname === 'www.google-analytics.com' ||
      url.hostname === 'www.googletagmanager.com' ||
      url.hostname === 'script.google.com' ||
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    return;
  }

  // HTML pages — network first, fall back to cache, then offline page
  if (event.request.headers.get('accept') && event.request.headers.get('accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
