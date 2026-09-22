# Scope: Victory Audit Defect Remediation

## Architecture
- `scripts/test-adversarial-challenger.ts`: Adversarial test suite causing TS2531 null-check compiler error.
- `src/lib/task-rollover.ts`: Task rollover engine. Must mark tasks moved to tomorrow as "scheduled" rather than "today".
- `src/app/api/today/route.ts`: Today endpoint querying today's tasks.
- `src/app/api/tasks/route.ts`: Task completion and goal progress linkage. Needs symmetric rollback on unchecking.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | TS Compilation | Add null safety in scripts/test-adversarial-challenger.ts:454 so tsc --noEmit exits 0 | M1-Fixes | Victory Audit #1 |
| 2 | Rollover Ghost Tasks | Set status="scheduled" when rolling tasks to tomorrow in src/lib/task-rollover.ts | M1-Fixes | Victory Audit #2 |
| 3 | Goals Ratchet Rollback | Decrement KeyResult/Objective progress when task isCompleted=false in src/app/api/tasks/route.ts | M1-Fixes | Victory Audit #3 |
| 4 | Verifications | Ensure tsc --noEmit exits 0, test-e2e-all.ts passes 100%, ports 3050 & 3000 untouched | M1-Fixes | Victory Audit #4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1-Fixes | TS compile error, rollover ghost tasks, goal feedback rollback | none | IN_PROGRESS |

## Interface Contracts
- TypeScript compiler `node node_modules/typescript/bin/tsc --noEmit` must exit code 0.
- When `rolloverTasks()` moves tasks to tomorrow, task status is updated to "scheduled" so `/api/today` does not return them.
- In `src/app/api/tasks/route.ts`, when a task with `keyResultId` is toggled to `isCompleted: false`, the associated KeyResult `currentValue` is decremented and Objective `progress` is updated symmetrically.
- Server on port 3050 and port 3000 remain untouched and running cleanly.
