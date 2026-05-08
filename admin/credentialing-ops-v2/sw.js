const CACHE_NAME = 'credentik-v14';
const ASSETS = [
  '/admin/credentialing-ops-v2/',
  '/admin/credentialing-ops-v2/index.html',
  '/admin/credentialing-ops-v2/ui/styles.css',
  '/admin/credentialing-ops-v2/ui/app.js',
  '/admin/credentialing-ops-v2/core/config.js',
  '/admin/credentialing-ops-v2/core/store.js',
  '/admin/credentialing-ops-v2/core/taxonomy-api.js',
  '/admin/credentialing-ops-v2/core/workflow.js',
  '/admin/credentialing-ops-v2/core/batch-generator.js',
  '/admin/credentialing-ops-v2/core/email-generator.js',
  '/admin/credentialing-ops-v2/core/migration.js',
  '/admin/credentialing-ops-v2/data/schema.js',
  '/admin/credentialing-ops-v2/data/payers.js',
  '/admin/credentialing-ops-v2/data/providers.js',
  '/admin/credentialing-ops-v2/data/states.js',
  '/admin/credentialing-ops-v2/data/strategies.js',
  '/admin/credentialing-ops-v2/data/telehealth-policies.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network-first for API calls (Google Sheets)
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for app assets (ensures updates are always picked up)
  event.respondWith(
    fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
