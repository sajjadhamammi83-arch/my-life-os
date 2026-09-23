# Dispatch to Project Orchestrator (orchestrator_10)

## Objective
تبدیل کامل پلتفرم Life OS به یک وباپلیکیشن پیشرونده (PWA) با معماری محلیمحور (Local-First)، با قابلیت اجرای کاملاً مستقل و آفلاین روی آیفون و موبایل، ذخیرهسازی پایدار تمام دادهها در حافظه داخلی گوشی (IndexedDB)، و همگامسازی خودکار دوطرفه به محض دسترسی به سرور یا اینترنت.

## Workspace & Context
- Workspace: `d:/my life`
- Agent Directory: `d:/my life/.agents/orchestrator_10`
- Verbatim Request: `d:/my life/.agents/ORIGINAL_REQUEST.md` (see timestamp 2026-09-23T00:45:30Z)
- Integrity Mode: development

## Key Requirements
1. **R1. PWA Shell & iOS Native Integration**:
   - Web App Manifest (`manifest.json` / `manifest.webmanifest`) with standalone display, portrait orientation, theme color, Apple Safari meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`).
   - High-resolution raster & vector app icons for iPhone home screen.
   - Dedicated Service Worker (`sw.js`) with intelligent caching strategies (Stale-While-Revalidate and Network-First with Cache-Fallback) for all core pages, styles, scripts, and Vazirmatn font to open in milliseconds offline.

2. **R2. Local-First Persistence & IndexedDB**:
   - Client-side local storage using IndexedDB / Storage API to store user state & data (tasks, habits, today page actions, projects, shop cash register & financial transactions, notes, reviews).
   - Fully functional offline forms, checkboxes, expense logging without network errors or UI crashes.

3. **R3. Offline-to-Online Sync Engine & Outbox**:
   - Offline mutation queue (Outbox Queue) tracking creates, updates, and deletes while offline.
   - Automatic chronological replay & sync to backend APIs upon network/server reconnection (`navigator.onLine` & ping).
   - Visual header connectivity & sync status indicator (online & synced / saving to device / offline).

4. **R4. Code Stability & Verification**:
   - Local server stable on port 3050 (never touch port 3000).
   - 100% clean TypeScript compilation (`node node_modules/typescript/bin/tsc --noEmit` Exit code 0).
   - Passing integration & E2E tests for online, offline, and reconnect sync scenarios.
