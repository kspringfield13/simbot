// SimBot Service Worker — offline caching for PWA
const CACHE_NAME = 'simbot-v1';
const STATIC_CACHE = 'simbot-static-v1';
const MODEL_CACHE = 'simbot-models-v1';

// Critical assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, MODEL_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: route requests to appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // 3D models (.glb) — cache-first (large, static assets)
  if (url.pathname.endsWith('.glb')) {
    event.respondWith(cacheFirst(request, MODEL_CACHE));
    return;
  }

  // Hashed JS/CSS bundles — cache-first (immutable due to content hash)
  if (/\.(js|css)$/.test(url.pathname) && /[.-][a-f0-9]{8,}/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML and non-hashed assets — network-first with cache fallback
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// Cache-first: return cached version, falling back to network
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Network-first: try network, fall back to cache
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/');
      if (cachedIndex) return cachedIndex;
    }

    return new Response('Offline', { status: 503 });
  }
}
