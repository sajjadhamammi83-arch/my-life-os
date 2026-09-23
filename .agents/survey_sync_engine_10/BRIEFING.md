# BRIEFING — 2026-09-23T00:59:30Z

## Mission
Investigate and design R3: Offline-to-Online Sync Engine, Outbox Queue & Header Status Indicator for offline-first resilience.

## 🔒 My Identity
- Archetype: Explorer
- Roles: investigation, synthesis, technical architecture
- Working directory: d:/my life/.agents/survey_sync_engine_10
- Original parent: 0d220a06-78ed-4a58-b7b7-9e22377a7b8b
- Milestone: R3 Offline-to-Online Sync Engine & Header Status Indicator

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Inspect API endpoints & mutation patterns
- Design Outbox Queue pattern & IndexedDB schema
- Design Sync Engine (connectivity, chronological replay, conflict resolution, inbound sync)
- Design Header Status Indicator in src/components/layout/Header.tsx with Persian labels and #ffffff theme

## Current Parent
- Conversation ID: 0d220a06-78ed-4a58-b7b7-9e22377a7b8b
- Updated: 2026-09-23T00:59:30Z

## Investigation State
- **Explored paths**:
  - `src/app/api/` (all 32 route handlers, with deep focus on tasks, today, habits, finance/accounting, finance/cash-register, finance/transactions, reviews/daily, quick-capture, calendar, health)
  - `src/components/layout/Header.tsx` & `AppLayout.tsx`
  - `src/app/today/page.tsx`, `src/app/tasks/page.tsx`, `src/app/finance/page.tsx`
  - `prisma/schema.prisma`
  - Checked `survey_local_store_10` workspace for database and store naming alignment
- **Key findings**:
  - Current client pages use volatile React `useState` for optimistic mutations; network drops cause unhandled fetch rejections and mutations are lost on page reload.
  - No heartbeat/ping endpoint currently exists; `/api/health` carries heavy DB load for biometrics. A dedicated lightweight `/api/ping` route is required.
  - Full Outbox Queue data structure and IndexedDB schema (`life_os_local_db` -> `outbox_queue`) designed.
  - Chronological replay protocol with FIFO ordering, `X-Idempotency-Key`, client temporary ID generation (`tempEntityId`) and remapping completed.
  - Header Connectivity & Sync Indicator UI designed with 3 high-contrast states (Online & Synced, Offline / Local Storage, Syncing with pending count) adhering to the `#ffffff` minimal aesthetic and Vazirmatn font.
- **Unexplored areas**: None for R3 investigation scope.

## Key Decisions Made
- Outbox store named `outbox_queue` within `life_os_local_db`, aligning with `survey_local_store_10`.
- Dual-layer connectivity detection designed (window events + lightweight `/api/ping` heartbeat).
- Last-Write-Wins (LWW) conflict resolution with Optimistic Overrule (uncommitted local changes never overwritten by server sync).
- Verification confirmed: `tsc --noEmit` exits with 0 errors.

## Artifact Index
- d:/my life/.agents/survey_sync_engine_10/DISPATCH.md
- d:/my life/.agents/survey_sync_engine_10/BRIEFING.md
- d:/my life/.agents/survey_sync_engine_10/progress.md
- d:/my life/.agents/survey_sync_engine_10/analysis.md
- d:/my life/.agents/survey_sync_engine_10/handoff.md
