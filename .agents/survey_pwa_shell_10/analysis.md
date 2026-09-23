# Technical Investigation & Architecture Design: PWA Shell & iOS Native Integration (R1)

**Agent**: `survey_pwa_shell_10` (Explorer)  
**Date**: 2026-09-23  
**Status**: Completed  
**Target Milestone**: R1: PWA Shell & iOS Native Integration  
**Workspace**: `d:/my life`  

---

## 1. Executive Summary

This document establishes the complete architectural specification and technical design for transforming the **Life OS** platform into an enterprise-grade Progressive Web Application (PWA) with native iOS Safari integration.

Life OS is a Next.js 14 App Router application styled with Tailwind CSS, utilizing Persian typography (Vazirmatn) and an ultra-clean minimal white aesthetic (`#ffffff` background with `#09090b` high-contrast accents). To achieve native app parity on Apple iPhone devices and enable seamless offline operation, this specification addresses five critical pillars:
1. **PWA Web App Manifest (`manifest.webmanifest` / `manifest.json`)**: Full compliance with W3C Web App Manifest specification, configured for standalone display, portrait orientation, RTL text direction, and contextual app shortcuts.
2. **iOS Safari Native Integration & Notch Adaptation**: Migration to Next.js 14 separated `Viewport` and `Metadata` APIs, accurate `apple-mobile-web-app-*` configuration, and dynamic safe-area insets (`env(safe-area-inset-*)`) for iPhone screen notches and Dynamic Islands.
3. **High-DPI Vector and Raster Icon Asset Generation**: Pixel-exact master vector (`icon.svg`) and raster icons (180x180 Apple Touch Icon, 192x192 PWA, 512x512 Splash/Store, and maskable variants) generated via a zero-dependency pure Node.js generator.
4. **Multi-Tiered Service Worker (`public/sw.js`)**: A custom-engineered caching engine utilizing Stale-While-Revalidate for core application pages, Cache-First for static chunks (`/_next/static/`) and Vazirmatn fonts, Network-First with Cache-Fallback for read APIs, and non-blocking outbox routing.
5. **Sub-Millisecond Offline Shell (`public/offline.html`) & Client Hydration**: A zero-latency offline fallback architecture guaranteeing instant boot on cold starts in airplane mode or during server outages.

---

## 2. Current State Audit & Gap Analysis

An inspection of the existing workspace yielded the following findings:

| Component / File | Current Status | Deficiencies & Gaps Identified | Required Architectural Fix |
|---|---|---|---|
| `public/` directory | **Non-existent** | No static assets directory exists at the root. PWA manifests, icons, and service workers cannot be resolved. | Create `public/`, `public/icons/`, and root static files. |
| `src/app/layout.tsx` | Partial metadata only | Uses legacy unified `metadata` without `viewport` export. Contains `className="dark"` on `<html>` despite the UI being pure white (`#ffffff`). No manifest link, no Apple mobile web app tags, no service worker registration. | Extract `viewport` export (`themeColor`, `viewportFit="cover"`). Remove `dark` class conflict. Add `metadata.manifest`, `metadata.appleWebApp`, and `<ServiceWorkerRegister />`. |
| `src/app/globals.css` | Basic styles | Loads Vazirmatn via external Google Fonts `@import`. No CSS safe-area insets (`env(safe-area-inset-*)`). iOS rubber-band bounce and touch delays unhandled. | Add CSS safe area variables, utility classes, iOS standalone touch gestures, and configure SW font caching. |
| `Sidebar.tsx` & Layout | Desktop-oriented | `Sidebar.tsx` has fixed `w-64` without mobile collapsible drawer or mobile bottom bar. Header lacks safe area top padding for iPhone notch. | Add safe-area top padding to `Header.tsx` and design mobile viewport adaptations. |
| Icons & Branding | Lucide `Layers` in code | Brand identity uses `Layers` icon on black rounded box in `Sidebar.tsx:63`, but no external `.ico`, `.png`, or `.svg` files exist. | Generate complete suite of 180x180, 192x192, 512x512, and SVG icons matching the exact brand identity. |
| Service Worker | **Missing** | No service worker or caching logic exists. Offline navigation results in standard browser connection error. | Implement `public/sw.js` with 5 distinct caching strategies and precaching lifecycle. |

---

## 3. PWA Manifest Architecture (`manifest.webmanifest`)

The manifest must be placed in `public/manifest.webmanifest` and aliased to `public/manifest.json`.

### 3.1 Design Decisions
- **`id` & `start_url`**: Set to `/today` (with fallback `/dashboard`). The primary entry point for a daily user is the Today overview (`Big 3`, calendar blocks, quick capture).
- **`display`**: `"standalone"` removes all browser chrome on iOS and Android.
- **`orientation`**: `"portrait"` enforces standard smartphone orientation.
- **`theme_color` & `background_color`**: Both set to `#ffffff` to match the minimal clean design system and prevent gray/black flashes during launch.
- **`dir` & `lang`**: `"rtl"` and `"fa-IR"` to natively inform OS app launchers of Persian language direction.
- **`shortcuts`**: Provides quick app launch actions directly from the home screen icon long-press menu on iOS and Android.

### 3.2 Manifest Specification
```json
{
  "$schema": "https://json.schemastore.org/web-manifest-combined.json",
  "id": "/?source=pwa",
  "name": "Life OS — سیستم‌عامل جامع مدیریت زندگی و حسابداری",
  "short_name": "Life OS",
  "description": "مرکز فرماندهی یکپارچه برای مدیریت اهداف، زمان، سلامت، یادگیری، پروژه‌ها و حسابداری کامل دوبل/مالی",
  "start_url": "/today?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": [
    "standalone",
    "window-controls-overlay",
    "minimal-ui"
  ],
  "orientation": "portrait",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "lang": "fa-IR",
  "dir": "rtl",
  "categories": [
    "productivity",
    "finance",
    "lifestyle",
    "utilities"
  ],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ],
  "shortcuts": [
    {
      "name": "اقدامات امروز",
      "short_name": "امروز",
      "description": "مشاهده اقدامات سه گانه طلایی و بلوک‌های زمانی امروز",
      "url": "/today?source=shortcut",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "پیشخوان فرماندهی",
      "short_name": "پیشخوان",
      "description": "مرکز کنترل و شاخص‌های کلیدی زندگی",
      "url": "/dashboard?source=shortcut",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "مالی و حسابداری",
      "short_name": "مالی",
      "description": "ثبت سریع تراکنش‌ها و دخل صندوق",
      "url": "/finance?source=shortcut",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "ماتریس وظایف",
      "short_name": "وظایف",
      "description": "مدیریت تسک‌ها در ماتریس آیزنهاور",
      "url": "/tasks?source=shortcut",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    }
  ],
  "prefer_related_applications": false
}
```

---

## 4. iOS Safari Native Integration & Notch Safe Areas

### 4.1 Next.js 14 Viewport & Metadata Configuration
In Next.js 14, viewport properties must be exported separately via `Viewport` to comply with App Router specifications.

```typescript
// File: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents unintended zoom on inputs and keeps native app responsiveness
  viewportFit: "cover", // Vital for iPhone screen notches and Dynamic Island
};

export const metadata: Metadata = {
  title: "Life OS — سیستم‌عامل جامع مدیریت زندگی و حسابداری",
  description: "مرکز فرماندهی یکپارچه برای مدیریت اهداف، زمان، سلامت، یادگیری، پروژه‌ها و حسابداری کامل دوبل/مالی",
  manifest: "/manifest.webmanifest",
  applicationName: "Life OS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // CRITICAL: 'default' renders black text on white status bar (#ffffff)
    title: "Life OS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-touch-fullscreen": "yes",
  },
};
```

### 4.2 Status Bar Style Analysis: Why `default` is Mandatory
- If `black-translucent` were used: The web view expands behind the iOS status bar and iOS forces status bar text/icons (time, battery, Wi-Fi) to white. Since our UI is minimal white (`#ffffff`), white status bar text against a white background becomes completely invisible to the user.
- Using `default`: The status bar background matches `#ffffff` and iOS renders high-contrast dark text and indicators, ensuring 100% legibility.

### 4.3 Safe Area Inset Management & iOS CSS Touch Rules
Add the following rules to `src/app/globals.css`:

```css
/* ==========================================================================
   iOS PWA Standalone & Safe Area Configuration
   ========================================================================== */

:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

/* Standalone PWA adjustments for iOS Safari */
@supports (-webkit-touch-callout: none) {
  body {
    /* Prevent iOS rubber-banding bounce glitch */
    overscroll-behavior-y: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }

  /* Prevent Safari from automatically zooming into inputs with font-size < 16px */
  input, select, textarea {
    font-size: 16px !important;
  }
}

/* Safe area padding helper classes */
.pt-safe {
  padding-top: max(1rem, env(safe-area-inset-top, 0px));
}

.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
}

.pl-safe {
  padding-left: max(1rem, env(safe-area-inset-left, 0px));
}

.pr-safe {
  padding-right: max(1rem, env(safe-area-inset-right, 0px));
}

/* Header Safe Area Notch Adaptation */
header.sticky-header {
  padding-top: env(safe-area-inset-top, 0px);
}
```

In `src/components/layout/Header.tsx`, apply the safe area top padding:
```tsx
<header className="h-16 md:h-18 border-b border-zinc-200 bg-white sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 select-none shadow-sm pt-[env(safe-area-inset-top)]">
```

---

## 5. Icon Asset Generation Requirements

### 5.1 Visual Specification
- **Icon Motif**: The official Life OS geometric `Layers` emblem, derived directly from `src/components/layout/Sidebar.tsx:63-65`.
- **Composition**:
  - Base canvas: Pure white (`#ffffff`).
  - Central squircle/rounded container: Pure deep black (`#09090b`), corner radius = 22.5% of badge width.
  - Geometry: 3 isometric stacked layer plates rendered in crisp pure white (`#ffffff`).
  - Maskable Variant: Contains an outer 20% safe-zone margin to prevent cropping on Android squircle/circular icon masks.
  - Apple Touch Icon (180x180): Strictly non-transparent (iOS converts transparent pixels into pitch black blocks).

### 5.2 Vector Master: `public/icons/icon.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#09090b"/>
  <g transform="translate(106, 106) scale(12.5)" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </g>
</svg>
```

### 5.3 Zero-Dependency PNG Generator Script (`scripts/generate-pwa-icons.mjs`)
Because `sharp` and native image libraries are not installed in the workspace, we design a pure Node.js icon generator script using Node's standard `zlib` library and basic PNG chunk serialization (`IHDR`, `IDAT`, `IEND`). It creates valid, standard 32-bit RGBA PNG files for:
- `public/icons/apple-touch-icon.png` (180x180)
- `public/icons/icon-192x192.png` (192x192)
- `public/icons/icon-maskable-192x192.png` (192x192 with safe zone)
- `public/icons/icon-512x512.png` (512x512)
- `public/icons/icon-maskable-512x512.png` (512x512 with safe zone)

```javascript
// File: scripts/generate-pwa-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawPixelFn) {
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Icon generator logic with pure geometric layers emblem
function drawLifeOsIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates (-1 to 1)
  const margin = isMaskable ? 0.35 : 0.15;
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Background is pure white (#ffffff)
  let r = 255, g = 255, b = 255, a = 255;

  // Badge squircle: radius ~ 0.75
  const badgeLimit = 1.0 - margin;
  const radius = 0.22;
  const qx = Math.max(0, Math.abs(nx) - (badgeLimit - radius));
  const qy = Math.max(0, Math.abs(ny) - (badgeLimit - radius));
  const dist = Math.sqrt(qx * qx + qy * qy);

  if ((Math.abs(nx) <= badgeLimit && Math.abs(ny) <= badgeLimit - radius) ||
      (Math.abs(ny) <= badgeLimit && Math.abs(nx) <= badgeLimit - radius) ||
      dist <= radius) {
    // Inside Black Badge (#09090b)
    r = 9; g = 9; b = 11; a = 255;

    // Render 3 Isometric Layers
    // Layer 1 (Top diamond): ny between -0.4 and 0
    // Layer 2 (Middle chevron): ny between -0.05 and 0.25
    // Layer 3 (Bottom chevron): ny between 0.2 and 0.5
    const layerScaleX = 0.5;
    const isoX = Math.abs(nx) / layerScaleX;

    // Check layer 1 (polygon 12 2, 22 7, 12 12, 2 7)
    const l1CenterY = -0.15;
    const l1Dist = Math.abs(ny - l1CenterY);
    if (isoX <= 0.65 && Math.abs(isoX * 0.45 + (ny - l1CenterY)) <= 0.04) {
      r = 255; g = 255; b = 255;
    }
    if (isoX <= 0.65 && Math.abs(-isoX * 0.45 + (ny - l1CenterY)) <= 0.04) {
      r = 255; g = 255; b = 255;
    }

    // Check layer 2 (polyline 2 12, 12 17, 22 12)
    const l2CenterY = 0.05;
    if (isoX <= 0.65 && Math.abs(isoX * 0.45 - (ny - l2CenterY)) <= 0.04 && ny >= l2CenterY) {
      r = 255; g = 255; b = 255;
    }

    // Check layer 3 (polyline 2 17, 12 22, 22 17)
    const l3CenterY = 0.25;
    if (isoX <= 0.65 && Math.abs(isoX * 0.45 - (ny - l3CenterY)) <= 0.04 && ny >= l3CenterY) {
      r = 255; g = 255; b = 255;
    }
  }

  return [r, g, b, a];
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate targets
const targets = [
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'icon-192x192.png', size: 192, maskable: false },
  { name: 'icon-maskable-192x192.png', size: 192, maskable: true },
  { name: 'icon-512x512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512x512.png', size: 512, maskable: true },
];

for (const target of targets) {
  const filePath = path.join(iconsDir, target.name);
  const buf = createPng(target.size, target.size, (x, y, w, h) => drawLifeOsIcon(x, y, w, h, target.maskable));
  fs.writeFileSync(filePath, buf);
  console.log(`Generated: ${filePath} (${buf.length} bytes)`);
}
```

---

## 6. Service Worker Architecture (`public/sw.js`)

### 6.1 Multi-Tier Caching Strategy Specification
The Service Worker manages five isolated caches to prevent collision and guarantee high performance:

1. `life-os-static-v1` (**Precaching Core Shell**):
   - Pre-cached immediately during `install`:
     - `/offline.html`
     - `/manifest.webmanifest`
     - `/manifest.json`
     - `/icons/icon-192x192.png`
     - `/icons/icon-512x512.png`
     - `/icons/apple-touch-icon.png`
     - `/icons/icon.svg`
   - Uses `self.skipWaiting()` for zero-delay activation.

2. `life-os-pages-v1` (**Stale-While-Revalidate for HTML Pages**):
   - Scope: All primary HTML navigation routes (`/today`, `/dashboard`, `/tasks`, `/finance`, `/planner`, `/goals`, `/review`, `/analytics`, `/inbox`, `/projects`, `/health`, `/learning`).
   - Strategy:
     - Instantly return cached response from disk/memory (< 5ms).
     - In the background, fetch fresh HTML from the server and update the cache.
     - If both cache and network fail (or for unvisited pages during complete network blackout), fall back seamlessly to `/offline.html`.

3. `life-os-assets-v1` (**Cache-First for Static Chunks**):
   - Scope: `/_next/static/` JavaScript and CSS bundles.
   - Strategy:
     - Since Next.js bundles include unique content hashes in filenames (immutable), return immediately from cache if present.
     - If not cached, fetch from network, populate cache, and return.

4. `life-os-fonts-v1` (**Cache-First for Typography**):
   - Scope: Requests to `fonts.googleapis.com`, `fonts.gstatic.com`, and `/_next/static/media/*.woff2`.
   - Strategy:
     - Return cached font file instantly. Fonts do not mutate. Prevents FOIT (Flash of Invisible Text) and FOUT (Flash of Unstyled Text) on offline iPhone launches.

5. `life-os-api-v1` (**Network-First with Cache-Fallback for Read APIs**):
   - Scope: `GET /api/...`
   - Strategy:
     - Attempt fresh network fetch first.
     - On successful response (200 OK), clone and store in `life-os-api-v1`.
     - On network failure (offline), return cached API data with custom header `x-served-from-cache: true`.
   - Mutation Scope: `POST`, `PUT`, `PATCH`, `DELETE` are passed through directly to network, integrating with the IndexedDB Outbox Engine (R2 & R3).

### 6.2 Complete Service Worker Implementation (`public/sw.js`)
```javascript
// File: public/sw.js
const VERSION = 'v1.0.0';
const CACHE_STATIC = `life-os-static-${VERSION}`;
const CACHE_PAGES = `life-os-pages-${VERSION}`;
const CACHE_ASSETS = `life-os-assets-${VERSION}`;
const CACHE_FONTS = `life-os-fonts-${VERSION}`;
const CACHE_API = `life-os-api-${VERSION}`;

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

// 1. Install Event: Precache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async (cache) => {
      console.log('[SW] Precaching essential shell and routes');
      // Use settled map to prevent one failed asset from breaking service worker installation
      const promises = PRECACHE_ASSETS.map((url) =>
        fetch(url, { cache: 'no-cache' })
          .then((res) => {
            if (res.ok) return cache.put(url, res);
            return Promise.resolve();
          })
          .catch((err) => console.warn('[SW] Precache failed for:', url, err))
      );
      await Promise.all(promises);
    })
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_STATIC, CACHE_PAGES, CACHE_ASSETS, CACHE_FONTS, CACHE_API];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            console.log('[SW] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Non-GET requests (mutations): Direct pass-through (handled by IndexedDB Outbox)
  if (request.method !== 'GET') {
    return;
  }

  // A. Vazirmatn Fonts (Google CDN or Next.js static font files)
  if (url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com' ||
      url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    event.respondWith(
      caches.open(CACHE_FONTS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // B. Next.js Static Chunks & Bundles (/_next/static/...)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // C. API Endpoints (/api/...) -> Network-First with Cache-Fallback
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
          // Return structured offline JSON fallback
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

  // D. Core HTML Navigation (request.mode === 'navigate') -> Stale-While-Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_PAGES).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(async () => {
            // If network fails, return cached response or offline shell
            if (cachedResponse) return cachedResponse;
            const staticCache = await caches.open(CACHE_STATIC);
            return (await staticCache.match('/offline.html')) || (await staticCache.match('/today'));
          });

        // Instant startup: return cached HTML if present, else wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // E. Icons & Images -> Cache-First
  if (url.pathname.startsWith('/icons/') || url.pathname.match(/\.(png|svg|ico|jpg|webp)$/)) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
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
```

---

## 7. Offline Fallback Shell (`public/offline.html`)

To provide a native-app feel when a user launches the app in airplane mode before a specific page has been cached, an ultra-lightweight, self-contained Persian offline shell is pre-cached.

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>حالت آفلاین | Life OS</title>
  <meta name="theme-color" content="#ffffff">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #ffffff;
      color: #09090b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: max(2rem, env(safe-area-inset-top)) 1.5rem max(2rem, env(safe-area-inset-bottom));
      text-align: center;
      -webkit-user-select: none;
      user-select: none;
    }
    .badge {
      width: 72px;
      height: 72px;
      background-color: #09090b;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .badge svg {
      width: 36px;
      height: 36px;
      stroke: #ffffff;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 0.875rem;
      color: #71717a;
      line-height: 1.6;
      max-width: 320px;
      margin-bottom: 2rem;
    }
    .btn {
      background-color: #09090b;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0.75rem 2rem;
      border-radius: 9999px;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.1s ease;
    }
    .btn:active {
      transform: scale(0.96);
    }
    .status-pill {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #a1a1aa;
      background-color: #f4f4f5;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #f59e0b;
    }
  </style>
</head>
<body>
  <div class="badge">
    <svg viewBox="0 0 24 24">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
  </div>
  <h1>حالت آفلاین محلی</h1>
  <p>ارتباط با سرور برقرار نیست، اما ساختار Life OS در حافظه دستگاه شما فعال است. داده‌های محلی محافظت شده‌اند.</p>
  <button class="btn" onclick="window.location.reload()">تلاش مجدد اتصال</button>
  <div class="status-pill">
    <span class="status-dot"></span>
    <span>همگام‌سازی محلی (Local-First Active)</span>
  </div>
</body>
</html>
```

---

## 8. Client Registration Component (`ServiceWorkerRegister.tsx`)

A dedicated React client component handles service worker registration, lifecycle updates, and dispatches native browser events for online/offline transitions.

```typescript
// File: src/components/pwa/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Handle update discovery
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[PWA] Update ready. New shell cached.");
                window.dispatchEvent(new CustomEvent("pwa-update-ready"));
              }
            });
          }
        });

        console.log("[PWA] Service Worker active with scope:", registration.scope);
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
```

---

## 9. Next.js 14 Root Layout Refactor (`src/app/layout.tsx`)

The refactored `src/app/layout.tsx` consolidates all R1 requirements:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Life OS — سیستم‌عامل جامع مدیریت زندگی و حسابداری",
  description: "مرکز فرماندهی یکپارچه برای مدیریت اهداف، زمان، سلامت، یادگیری، پروژه‌ها و حسابداری کامل دوبل/مالی",
  manifest: "/manifest.webmanifest",
  applicationName: "Life OS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Life OS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-touch-fullscreen": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased selection:bg-blue-600 selection:text-white bg-white text-zinc-950">
        <ServiceWorkerRegister />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
```

---

## 10. File Creation & Modification Plan

| File Path | Action | Description / Rationale |
|---|---|---|
| `public/manifest.webmanifest` | **Create** | Primary W3C web app manifest specification. |
| `public/manifest.json` | **Create** | Compatibility alias/copy for older web clients. |
| `public/sw.js` | **Create** | Production Service Worker with 5 caching tiers. |
| `public/offline.html` | **Create** | Standalone Persian offline fallback page. |
| `public/icons/icon.svg` | **Create** | Master SVG icon with `Layers` motif. |
| `public/icons/*.png` | **Create** | 180x180, 192x192, 512x512 PNGs generated via script. |
| `scripts/generate-pwa-icons.mjs` | **Create** | Zero-dependency pure Node script generating PNG icon assets. |
| `src/components/pwa/ServiceWorkerRegister.tsx` | **Create** | Client component registering the Service Worker in the browser. |
| `src/app/layout.tsx` | **Modify** | Add `viewport`, update `metadata`, mount `ServiceWorkerRegister`, clean `className="dark"`. |
| `src/app/globals.css` | **Modify** | Add safe-area CSS rules, overscroll prevention, and touch settings. |
| `src/components/layout/Header.tsx` | **Modify** | Add top padding `pt-[env(safe-area-inset-top)]` for iPhone notch / Dynamic Island. |

---

## 11. Verification & Test Plan

1. **Manifest Validation**:
   - Check HTTP GET `/manifest.webmanifest` returns status 200 with MIME `application/manifest+json`.
   - Validate JSON syntax, icon resolutions (192, 512, 180), start_url (`/today?source=pwa`), and standalone mode.
2. **iOS Safari Meta Validation**:
   - Inspect HTML output of `/today`:
     - `<meta name="apple-mobile-web-app-capable" content="yes">`
     - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
     - `<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">`
     - `<meta name="viewport" content="...viewport-fit=cover...">`
3. **Service Worker Registration & Offline Startup Test**:
   - Open browser on `http://localhost:3050`. Verify `navigator.serviceWorker.ready` resolves.
   - Inspect Cache Storage in DevTools: verify `life-os-static-v1`, `life-os-pages-v1`, `life-os-assets-v1`, `life-os-fonts-v1` are populated.
   - Switch DevTools network mode to "Offline" (or simulate airplane mode).
   - Refresh `/today` and `/dashboard`. The pages must load instantaneously (< 50ms) from service worker cache with no broken layout, no missing fonts, and zero HTTP errors.
   - Navigate to an unvisited route while offline: verify `/offline.html` is displayed with Persian text and retry button.
4. **TypeScript & Build Integrity**:
   - Execute `node node_modules/typescript/bin/tsc --noEmit`. Exit code must be 0 with zero type errors.
