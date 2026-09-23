## 2026-09-23T01:02:00Z
You are m1_worker_10 (Worker).
Working directory: d:/my life/.agents/m1_worker_10
Workspace root: d:/my life
Original request path: d:/my life/.agents/ORIGINAL_REQUEST.md
Specification & Explorer Analysis path: d:/my life/.agents/survey_pwa_shell_10/analysis.md
PROJECT document: d:/my life/PROJECT.md

MANDATORY INSTRUCTION:
Read d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the section under timestamp 2026-09-23T00:45:30Z) before starting work. Do not skip this step. Also read d:/my life/.agents/survey_pwa_shell_10/analysis.md for exact specifications and code references.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission: Implement Milestone 1: PWA Shell, iOS Safari Native Integration & Service Worker (R1).
Exclusive write ownership for this milestone:
- `public/manifest.webmanifest` and `public/manifest.json` (W3C standard PWA manifests with standalone display, portrait orientation, #ffffff theme/background, Persian metadata, 4 shortcuts).
- `scripts/generate-pwa-icons.mjs` (pure Node.js script using built-in node:zlib to generate 180x180, 192x192, 512x512 PNGs and vector `public/icons/icon.svg` matching the Life OS brand). Run this script to generate all icons in `public/icons/`.
- `public/sw.js` (dedicated Service Worker with 5 caching tiers: Stale-While-Revalidate for core HTML pages, Cache-First for static assets and Vazirmatn fonts, Network-First for GET APIs, mutation passthrough for POST/PUT/PATCH/DELETE, and offline fallback).
- `public/offline.html` (instant offline fallback page with clean minimal #ffffff styling, Persian text, and retry button).
- `src/components/pwa/ServiceWorkerRegister.tsx` (client component to register /sw.js in browser).
- `src/app/layout.tsx` (Next.js 14 layout refactor separating `viewport: Viewport` from `metadata: Metadata`, appleWebApp tags, apple-touch-icon, manifest link, and mounting ServiceWorkerRegister).
- `src/app/globals.css` (CSS safe-area variables `--sat: env(safe-area-inset-top)` and PWA rules).
- `src/components/layout/Header.tsx` (support safe-area top padding `pt-[env(safe-area-inset-top)]`).

Verification Requirements:
1. Run `node scripts/generate-pwa-icons.mjs` and verify all icon files are generated.
2. Run `node node_modules/typescript/bin/tsc --noEmit` and verify exit code 0 (zero errors).
3. Verify files and HTTP endpoints on localhost:3050 (manifests, sw.js, offline.html, icons).
4. Do NOT touch port 3000 under any circumstances.
5. Write your complete work report and verification results to `d:/my life/.agents/m1_worker_10/handoff.md`. Notify orchestrator_10 when complete.
