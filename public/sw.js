// Life OS — Enterprise PWA Service Worker (v1.0.0)
// Architectural tiers:
// 1. life-os-static-v1  -> Precaching core shell & offline fallback
// 2. life-os-pages-v1   -> Stale-While-Revalidate for HTML page routes
// 3. life-os-assets-v1  -> Cache-First for Next.js static bundles (/_next/static/)
// 4. life-os-fonts-v1   -> Cache-First for Vazirmatn & Web Fonts
// 5. life-os-api-v1     -> Network-First with Cache-Fallback for GET APIs (Mutations pass-through)

const VERSION = 'v1.0.0';
const CACHE_STATIC = `life-os-static-${VERSION}`;
const CACHE_PAGES = `life-os-pages-${VERSION}`;
const CACHE_ASSETS = `life-os-assets-${VERSION}`;
const CACHE_FONTS = `life-os-fonts-${VERSION}`;
const CACHE_API = `life-os-api-${VERSION}`;

const CURRENT_CACHES = [CACHE_STATIC, CACHE_PAGES, CACHE_ASSETS, CACHE_FONTS, CACHE_API];

const PRECACHE_ASSETS = [
  '/',
  '/today',
  '/dashboard',
  '/tasks',
  '/finance',
  '/planner',
  '/goals',
  '/review',
  '/analytics',
  '/offline.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
];

// 1. Install Event: Precache essential shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async (cache) => {
      console.log('[SW] Precaching essential shell and offline fallback');
      const settled = await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' }).then((res) => {
            if (res.ok) {
              return cache.put(url, res);
            }
          })
        )
      );
      const successful = settled.filter((s) => s.status === 'fulfilled').length;
      console.log(`[SW] Precache completed: ${successful}/${PRECACHE_ASSETS.length} assets ready.`);
    })
  );
});

// 2. Activate Event: Clean up outdated cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!CURRENT_CACHES.includes(key)) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Routing & 5 Caching Tiers
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Mutations (POST, PUT, PATCH, DELETE): Direct network pass-through
  // (Client-side IndexedDB Outbox handles queuing if offline)
  if (request.method !== 'GET') {
    return;
  }

  // Tier 4: Fonts (Google Fonts CDN or local font files) -> Cache-First
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com' ||
    url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_FONTS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok || res.type === 'opaque') {
            cache.put(request, res.clone());
          }
          return res;
        } catch (err) {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // Tier 3: Next.js Static Chunks (/_next/static/...) -> Cache-First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
          }
          return res;
        } catch (err) {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // Tier 5: Read APIs (/api/...) -> Network-First with Cache-Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        try {
          const networkRes = await fetch(request);
          if (networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) {
            const headers = new Headers(cached.headers);
            headers.set('X-LifeOS-Offline', 'true');
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            });
          }
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'ارتباط اینترنت قطع است. داده‌ها از حافظه محلی بازیابی می‌شوند.',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            }
          );
        }
      })
    );
    return;
  }

  // Tier 2: Core HTML Navigation (request.mode === 'navigate') -> Stale-While-Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_PAGES).then(async (cache) => {
        const cachedResponse = await cache.match(request, { ignoreSearch: true });

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(async () => {
            if (cachedResponse) return cachedResponse;
            const staticCache = await caches.open(CACHE_STATIC);
            return (
              (await staticCache.match('/offline.html')) ||
              (await staticCache.match('/today')) ||
              new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
            );
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Tier 1: Static Icons & Images (/icons/... or static extensions) -> Cache-First
  if (url.pathname.startsWith('/icons/') || url.pathname.match(/\.(png|svg|ico|jpg|webp)$/)) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          return cached || new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Default passthrough
  event.respondWith(fetch(request));
});
