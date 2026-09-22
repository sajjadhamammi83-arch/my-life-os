# BRIEFING — 2026-09-14T16:47:00Z

## Mission
Investigate Defect #2: Rollover "Ghost Tasks" in Today's Agenda (task-rollover.ts and /api/today/route.ts)

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigator, synthesizer
- Working directory: d:/my life/.agents/m1_fix_explorer_2
- Original parent: f25cab86-2fe2-40c1-87c9-cc25e649904d
- Milestone: M1 Defect #2 Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code or run destructive operations
- Must read d:/my life/.agents/ORIGINAL_REQUEST.md before starting work
- Deliver findings in d:/my life/.agents/m1_fix_explorer_2/handoff.md

## Current Parent
- Conversation ID: f25cab86-2fe2-40c1-87c9-cc25e649904d
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `prisma/schema.prisma` (Task model: status is plain String, default "inbox", documented values)
  - `src/lib/task-rollover.ts` (lines 10-18 uncompletedTasks query, lines 89-95 status: "today" mutation)
  - `src/app/api/today/route.ts` (lines 22-43 OR query matching { dueDate: today } or { status: "today" })
  - `src/app/today/page.tsx` (lines 134-145 fetchTasks filter logic)
  - `src/app/api/tasks/rollover/route.ts` (GET and POST handlers)
  - `src/app/api/reminders/tomorrow/route.ts` (tasks query for tomorrow's 24h window)
  - `scripts/test-e2e-all.ts` (Chain 2 rollover test) & `scripts/test-adversarial-challenger.ts` (edge cases)
- **Key findings**:
  - Root cause confirmed: Setting `status: "today"` in `task-rollover.ts:93` causes rolled-over tasks (whose dueDate is tomorrow) to continue matching `{ status: "today" }` in `/api/today` queries and `tasks/page.tsx`.
  - In `schema.prisma`, `status` is a `String` field with default `"inbox"`. Setting `status: "scheduled"` is completely valid and aligns with `CalendarBlock.status: "scheduled"`.
  - Setting `status: "scheduled"` eliminates ghost tasks from `/api/today` because neither `dueDate: today` nor `status: "today"` matches.
  - On the Today UI (`src/app/today/page.tsx`), filtering should also ignore `status: "scheduled"`.
  - Re-running `rolloverTasks()` must not re-process rolled-over tasks. In `task-rollover.ts` and `tasks/rollover/route.ts`, removing or scoping the unconstrained `{ isBigThree: true }` in `OR` ensures tasks moved to tomorrow with `dueDate: tomorrowStart` are not re-processed on Day D, while remaining eligible for future rollover on Day D+1.
- **Unexplored areas**: None. Problem boundary, call chain, side effects, and exact diffs established.

## Key Decisions Made
- Confirmed fix recommendation: change `status: "today"` to `status: "scheduled"` in `src/lib/task-rollover.ts:93`.
- Identified secondary cleanup: remove unconstrained `{ isBigThree: true }` from `uncompletedTasks` OR in `src/lib/task-rollover.ts:16` and `src/app/api/tasks/rollover/route.ts:20` to prevent infinite re-processing on re-running rollover.
- Identified UI safeguard: update `src/app/today/page.tsx:140` to exclude `status === "scheduled"`.

## Artifact Index
- d:/my life/.agents/m1_fix_explorer_2/DISPATCH.md — Initial dispatch message
- d:/my life/.agents/m1_fix_explorer_2/BRIEFING.md — Working memory and status
- d:/my life/.agents/m1_fix_explorer_2/progress.md — Liveness heartbeat and step log
- d:/my life/.agents/m1_fix_explorer_2/handoff.md — Final handoff report
