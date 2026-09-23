# Project: Life OS PWA Local-First Transformation & Universal Mobile Architecture

## Architecture
- Framework: Next.js 14.2.16 (App Router) with React 18 & TypeScript 5.6
- Database: Prisma 5.22.0 with SQLite (`prisma/dev.db`) on server
- Client-Side Persistence: Native IndexedDB (`LifeOS_LocalDB`) with 10 object stores
- PWA & iOS Safari Native Integration:
  - W3C Web App Manifest (`public/manifest.webmanifest`, `public/manifest.json`)
  - iOS Safari standalone tags (`apple-mobile-web-app-capable`, `apple-touch-icon`, `viewport-fit=cover`)
  - Dedicated Service Worker (`public/sw.js`) with 5 isolated caching tiers (Stale-While-Revalidate, Cache-First, Network-First, Mutation Passthrough, Offline Shell)
  - Offline Fallback Shell (`public/offline.html`)
  - Registration component (`src/components/pwa/ServiceWorkerRegister.tsx`)
- Offline-to-Online Sync Engine:
  - Outbox Queue (`outbox_queue` in IndexedDB) with FIFO chronological replay
  - Two-layer connectivity monitor (`navigator.onLine` + `/api/ping` lightweight heartbeat)
  - Mutual exclusion sync lock, `X-Idempotency-Key`, and temporary ID remapping
  - Header Connectivity & Sync Indicator in `src/components/layout/Header.tsx` (3 visual states with Persian digits)
- Ports:
  - Life OS Server: Port 3050 strictly enforced (`next dev -p 3050`)
  - User Cafe Server: Port 3000 strictly isolated (NEVER touch or terminate)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | W3C Web App Manifest & App Metadata | `manifest.webmanifest` & `manifest.json` with standalone display, portrait orientation, pure white theme `#ffffff`, and 4 contextual Persian shortcuts | M1 | Survey Explorer 1 |
| 2 | High-DPI Brand Icons & Generator | Pure Node.js icon generator (`scripts/generate-pwa-icons.mjs`) generating 180x180, 192x192, 512x512 PNGs and vector `public/icons/icon.svg` based on Layers emblem | M1 | Survey Explorer 1 |
| 3 | iOS Safari Notch & Safe-Area Adaptation | Next.js 14 layout refactor separating `Viewport` from `Metadata`, `appleWebApp` configuration, and CSS safe-area insets (`--sat`) in `globals.css` and `Header.tsx` | M1 | Survey Explorer 1 |
| 4 | Multi-Tier Service Worker & Caching | `public/sw.js` with Stale-While-Revalidate for HTML routes, Cache-First for static bundles & Vazirmatn fonts, Network-First for GET APIs, and mutation bypass | M1 | Survey Explorer 1 |
| 5 | Instantaneous Offline Fallback Shell | `public/offline.html` self-contained white fallback page with Persian typography and retry button for cold offline boots | M1 | Survey Explorer 1 |
| 6 | Native IndexedDB Local Storage Wrapper | Zero-dependency TypeScript wrapper (`src/lib/pwa/db.ts`) managing `LifeOS_LocalDB` with 10 object stores | M2 | Survey Explorer 2 |
| 7 | Local-First Zero-Latency Data Reading | Client pages read from IndexedDB first for instant rendering with background cache revalidation | M2 | Survey Explorer 2 |
| 8 | Offline Mutation Resilience & Unhandled Catch Fix | Fix missing `catch` blocks in `fetchTasks` / `createTask` in `src/app/today/page.tsx` and `src/app/tasks/page.tsx`, storing mutations locally when offline | M2 | Survey Explorer 2 |
| 9 | Finance & Review Offline Persistence | Persist cash register reconciliation, daily reviews, and financial transactions to IndexedDB when network is unavailable | M2 | Survey Explorer 2 |
| 10 | Server Ping Heartbeat Endpoint | Lightweight `GET /api/ping` endpoint without database queries returning 200 OK with `Cache-Control: no-store` | M3 | Survey Explorer 3 |
| 11 | Persistent Outbox Queue Architecture | Atomic transactional persistence of offline mutations (`OutboxMutation`) in IndexedDB surviving reloads | M3 | Survey Explorer 3 |
| 12 | Chronological FIFO Replay & Idempotency | Sequential mutation processor with mutex locks, `X-Idempotency-Key` headers, and client temp ID remapping | M3 | Survey Explorer 3 |
| 13 | Dual-Layer Online Detection & Inbound Refresh | Window `online`/`offline` listeners combined with `/api/ping` heartbeat, triggering post-drain inbound data refresh | M3 | Survey Explorer 3 |
| 14 | Header Connectivity & Sync Indicator UI | 3-state visual status indicator in `src/components/layout/Header.tsx` (Online, Offline, Syncing with pending count in Persian digits) and popover | M3 | Survey Explorer 3 |
| 15 | Universal PWA E2E Test Suite | Automated test suite `scripts/test-pwa-local-first.ts` covering manifests, SW, IndexedDB, offline mutations, sync replay, and ports | M4 | E2E Testing Track |
| 16 | TypeScript Compilation Zero Errors | Verification that `node node_modules/typescript/bin/tsc --noEmit` exits with 0 errors | M4 | Project Requirement |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | PWA Shell, iOS Safari Integration & Service Worker | Manifests, brand icons, Next.js layout & viewport, iOS safe-areas, `sw.js` with 5 cache tiers, `offline.html`, `ServiceWorkerRegister.tsx` | none | DONE |
| M2 | Native IndexedDB Local Store & Offline Resilience | `db.ts` wrapper with 10 stores, local-first reading, unhandled catch fixes, offline task/habit/finance persistence | M1 | IN_PROGRESS |
| M3 | Sync Engine, Outbox Mutation Queue & Header Status UI | `/api/ping`, `outbox.ts`, `sync-engine.ts`, FIFO replay, temp ID remapping, Header 3-state sync indicator | M2 | PLANNED |
| M4 | E2E Testing, Adversarial Verification & Clean Build | `test-pwa-local-first.ts`, 100% test pass (existing 49 tests + PWA suite), zero TypeScript errors, port 3050 & 3000 verification | M1, M2, M3 | PLANNED |

## Interface Contracts

### 1. Web App Manifest (`/manifest.webmanifest`, `/manifest.json`)
```json
{
  "name": "Life OS — سیستم‌عامل جامع مدیریت زندگی",
  "short_name": "Life OS",
  "start_url": "/today?source=pwa",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "dir": "rtl",
  "lang": "fa-IR",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 2. Service Worker (`public/sw.js`)
- Cache namespaces: `life-os-static-v1`, `life-os-pages-v1`, `life-os-assets-v1`, `life-os-fonts-v1`
- Navigation strategy: Stale-While-Revalidate with fallback to `/offline.html`
- Static & Fonts: Cache-First
- API GET: Network-First with Cache-Fallback
- Mutations (POST/PUT/PATCH/DELETE): Direct network passthrough

### 3. Native IndexedDB Local Store (`LifeOS_LocalDB`, version 1)
- Object stores:
  - `tasks` (keyPath: `id`)
  - `habits` (keyPath: `id`)
  - `habit_logs` (keyPath: `id`)
  - `projects` (keyPath: `id`)
  - `daily_reviews` (keyPath: `id`)
  - `cash_registers` (keyPath: `id`)
  - `transactions` (keyPath: `id`)
  - `calendar_blocks` (keyPath: `id`)
  - `outbox_queue` (keyPath: `id`, index: `status`, `createdAt`)
  - `metadata` (keyPath: `key`)

### 4. Outbox Mutation Record (`OutboxMutation`)
```typescript
interface OutboxMutation {
  id: string;              // Client UUID
  endpoint: string;        // Target URL e.g. "/api/tasks"
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload: any;            // JSON body
  createdAt: number;       // Timestamp ms
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  tempEntityId?: string;   // For mapping client ID to server ID
  idempotencyKey: string;  // X-Idempotency-Key
}
```

### 5. Server Heartbeat (`GET /api/ping`)
- Response: `{ success: true, timestamp: number }`
- Header: `Cache-Control: no-store, no-cache, must-revalidate`
- Response time: < 2ms, zero database calls

### 6. Header Connectivity Indicator State
- `status`: `'online' | 'offline' | 'syncing'`
- `pendingCount`: number of pending mutations in `outbox_queue`
- Persian formatting via `toPersianDigits`
- Visual styling strictly adhering to `#ffffff` minimal black & white design

## Code Layout
- `public/manifest.webmanifest` & `public/manifest.json` — W3C PWA manifests
- `public/sw.js` — Service worker script
- `public/offline.html` — Offline fallback shell
- `public/icons/` — Application raster and vector icons
- `scripts/generate-pwa-icons.mjs` — Pure Node.js icon generator
- `src/components/pwa/ServiceWorkerRegister.tsx` — Service worker registration component
- `src/app/layout.tsx` — Next.js 14 layout with Viewport & Apple meta configuration
- `src/app/globals.css` — Safe-area insets and PWA CSS rules
- `src/lib/pwa/db.ts` — Native IndexedDB client wrapper
- `src/lib/pwa/local-store.ts` — Local-first caching layer and domain abstractions
- `src/lib/pwa/outbox.ts` — Outbox queue persistence and operations
- `src/lib/pwa/sync-engine.ts` — Online detection and FIFO replay engine
- `src/app/api/ping/route.ts` — Lightweight heartbeat ping endpoint
- `src/components/layout/Header.tsx` — Header with connectivity & sync status indicator
- `scripts/test-pwa-local-first.ts` — Universal PWA & Local-First automated test suite
