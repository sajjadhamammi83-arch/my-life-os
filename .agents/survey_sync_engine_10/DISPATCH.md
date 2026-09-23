## 2026-09-23T00:49:30Z
You are survey_sync_engine_10 (Explorer).
Working directory: d:/my life/.agents/survey_sync_engine_10
Workspace root: d:/my life
Original request path: d:/my life/.agents/ORIGINAL_REQUEST.md

MANDATORY INSTRUCTION:
Read d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the section under timestamp 2026-09-23T00:45:30Z) before starting work. Do not skip this step.

Your Mission:
Investigate R3: Offline-to-Online Sync Engine, Outbox Queue & Header Status Indicator.
- Inspect current API endpoints and mutation patterns across the system (e.g., src/app/api/tasks, src/app/api/today, src/app/api/finance, src/app/api/reviews).
- Design the Outbox Queue pattern:
  - Data structure for pending mutations (id, endpoint, method, payload, createdAt, status: 'pending'|'syncing'|'failed', retryCount).
  - Persistence of Outbox in IndexedDB so pending mutations survive browser reloads and device restarts.
- Design the Sync Engine:
  - Online connectivity detection (window 'online'/'offline' events, plus periodic lightweight server ping/heartbeat to check real server reachability).
  - Chronological replay: sequentially processing the outbox queue when connectivity is restored, sending mutations to backend APIs, handling responses and removing completed items.
  - Conflict resolution & idempotency: timestamps and handling concurrent updates.
  - Inbound synchronization: refreshing local IndexedDB stores from backend after replay.
- Design Header Connectivity & Sync Indicator in src/components/layout/Header.tsx:
  - Visual states: 'online' (green/synced), 'offline' (gray/disconnected), 'saving'/'syncing' (pulsing/blue, showing pending outbox items count).
  - Persian labels & minimal design (#ffffff theme, high contrast).
- Output requirements:
  Write your comprehensive findings and technical design to d:/my life/.agents/survey_sync_engine_10/analysis.md and write your completion handoff report to d:/my life/.agents/survey_sync_engine_10/handoff.md.
  Notify orchestrator_10 when complete.
