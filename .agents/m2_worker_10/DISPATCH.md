## 2026-09-22T22:02:26Z
You are m2_worker_10 (Worker).
Working directory: d:/my life/.agents/m2_worker_10
Workspace root: d:/my life
Original request path: d:/my life/.agents/ORIGINAL_REQUEST.md
Specification & Explorer Analysis path: d:/my life/.agents/survey_local_store_10/analysis.md
PROJECT document: d:/my life/PROJECT.md

MANDATORY INSTRUCTION:
Read d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the section under timestamp 2026-09-23T00:45:30Z) before starting work. Do not skip this step. Also read d:/my life/.agents/survey_local_store_10/analysis.md for exact specifications and schema references.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission: Implement Milestone 2: Native IndexedDB Local Store & Offline Resilience (R2).
Exclusive write ownership for this milestone:
1. `src/lib/pwa/db.ts`:
   - Native zero-dependency TypeScript wrapper for IndexedDB (`LifeOS_LocalDB`, version 1).
   - 10 Object stores: `tasks`, `habits`, `habit_logs`, `projects`, `daily_reviews`, `cash_registers`, `transactions`, `calendar_blocks`, `outbox_queue`, `metadata`.
   - Methods: `initDB()`, `get()`, `set()`, `getAll()`, `deleteItem()`, `clear()`, `putBatch()`.
   - SSR safe (`typeof window !== 'undefined'`).
2. `src/lib/pwa/local-store.ts`:
   - High-level client-side domain storage helper functions (tasks, habits, today data, finance data, daily reviews).
   - Local-first reading and writing: updates local store immediately and queues mutations in `outbox_queue` when offline.
   - Helper `queueOfflineMutation(endpoint, method, payload, tempEntityId?)`.
3. Fix unhandled `fetch` rejections and add offline resilience in client pages:
   - `src/app/today/page.tsx`:
     - Hydrate from IndexedDB on initial mount before network fetch.
     - Add `catch` block to task creation (`fetch('/api/tasks')`). If network fails / offline, create local task with temporary ID, save to IndexedDB, update React state, and queue mutation in `outbox_queue`.
     - In `toggleTask` and `toggleHabit`: persist change to IndexedDB immediately, and queue in `outbox_queue` if network fetch fails.
   - `src/app/tasks/page.tsx`:
     - Hydrate from IndexedDB on initial mount.
     - Add `catch` block to `handleCreateTask`. If network fails / offline, save task to IndexedDB, update UI state, queue in `outbox_queue`.
   - `src/app/finance/page.tsx`:
     - Hydrate from IndexedDB on initial mount.
     - In `handleSaveCashRegister` and transaction submission: catch network errors, save locally to IndexedDB, update UI state, queue in `outbox_queue`.
   - `src/app/review/page.tsx`:
     - Hydrate review data from IndexedDB; save locally on submit and queue in outbox if offline.
4. Also apply two M1 Reviewer refinements:
   - In `src/components/layout/Header.tsx`, adjust header height to `h-[calc(4rem+env(safe-area-inset-top,0px))]` to ensure full breathing room under iPhone Dynamic Island notches.
   - In `public/sw.js`, in the navigate fetch handler, add `{ ignoreSearch: true }` to `cache.match(request, { ignoreSearch: true })` so query params like `?source=pwa` resolve to cached routes.

Verification Requirements:
1. Run `node node_modules/typescript/bin/tsc --noEmit` and verify exit code 0 (zero errors).
2. Create and run `scripts/test-m2-local-store.mjs` verifying IndexedDB schema, operations, offline error catching, and outbox queuing.
3. Verify on `http://127.0.0.1:3050`. Strict constraint: DO NOT touch or kill port 3000 under any circumstances.
4. Write completion report to `d:/my life/.agents/m2_worker_10/handoff.md`. Notify orchestrator_10 when complete.
