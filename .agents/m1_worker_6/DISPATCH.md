# Task Assignment — M1 Worker

## Objective
Implement Milestone 1: D-1 Advance Reminders & Future Events for Life OS.

## 🔒 Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements
1. **API Harmonization (`src/app/api/reminders/tomorrow/route.ts`)**:
   - Query Prisma SQLite database for tomorrow's events:
     - `CalendarBlock` where date matches tomorrow's date or start timestamp falls on tomorrow (00:00:00 to 23:59:59 local).
     - `Task` where dueDate matches tomorrow or incomplete tasks scheduled for tomorrow.
     - `WorkoutLog` or workout schedule matching tomorrow.
   - Return standard JSON matching interface contract in `PROJECT.md`:
     ```typescript
     {
       success: true,
       tomorrowDate: string, // YYYY-MM-DD
       tomorrowPersianDate: string, // e.g. "یکشنبه ۱۶ شهریور"
       summary: { totalItems: number, blocksCount: number, tasksCount: number, workoutsCount: number },
       blocks: Array<{ id: string, title: string, start: string, end: string, type: string, timeFormatted: string, notes?: string }>,
       tasks: Array<{ id: string, title: string, priority: string, isBigThree: boolean, dueDate: string, area?: { name: string } }>,
       workouts: Array<{ id: string, title: string, durationMinutes: number }>,
       reminders: { blocks, tasks, workouts } // backwards compatibility
     }
     ```
   - Ensure proper Persian date calculation and formatting (using Intl.DateTimeFormat with fa-IR or jalaali helpers).

2. **Header Bell Notification & Dropdown (`src/components/layout/Header.tsx`)**:
   - Dynamic badge counter on the Bell button displaying `summary.totalItems` (hide if 0).
   - Rich dropdown menu when clicked:
     - Header displaying tomorrow's Persian date (e.g. «برنامه فردا - یکشنبه ۱۶ شهریور»).
     - Scrollable list of items categorized by type (بلوک‌های زمانی, وظایف مهم, تمرین ورزشی).
     - Quick link to `/planner` and `/today`.
   - Event listener: `window.addEventListener('reminders-updated', ...)` to re-fetch immediately whenever events or tasks are modified across the app.

3. **Dashboard & Today Widgets (`src/app/dashboard/page.tsx` & `src/app/today/page.tsx`)**:
   - Polish or add dedicated «برنامه و رویدادهای فردا (D-1)» card.
   - Display tomorrow's blocks, Big 3 tasks, and planned workout.
   - Listen to `reminders-updated` event to re-fetch when new items are created.
   - Strictly adhere to minimal pure white (`#ffffff`), crisp black contrast, and Vazirmatn font.

4. **Future Date Registration (`src/app/api/planner/route.ts` & `src/app/planner/page.tsx`)**:
   - Support registering events, meetings, and deep work blocks for any future date.
   - When a block is created, dispatch `window.dispatchEvent(new CustomEvent('reminders-updated'))`.
   - Ensure `/api/planner` GET supports date query parameter (e.g. `?date=YYYY-MM-DD`) and correctly returns blocks for any requested date.

5. **Verification & Quality**:
   - Run `node node_modules/typescript/bin/tsc --noEmit` to verify exit code 0.
   - Verify server on port 3050 responds with 200 OK. DO NOT touch or restart port 3000.
   - Document changes in `changes.md` and `handoff.md` in `d:/my life/.agents/m1_worker_6/`.

## 2026-09-06T16:02:07Z
You are the Milestone 1 Worker (m1_worker_6) for the Life OS platform.
Tasks:
1. Initialize your BRIEFING.md and progress.md in `d:/my life/.agents/m1_worker_6/`.
2. Inspect and implement:
   - `src/app/api/reminders/tomorrow/route.ts`
   - `src/components/layout/Header.tsx`
   - `src/app/dashboard/page.tsx` & `src/app/today/page.tsx`
   - `src/app/api/planner/route.ts` & `src/app/planner/page.tsx`
3. Verify: tsc exit code 0, test endpoints on port 3050, NEVER touch port 3000.
4. Write changes.md and handoff.md in `d:/my life/.agents/m1_worker_6/`.
5. Send completion message and handoff report back to parent orchestrator.

## 2026-09-06T16:13:33Z
**Context**: Milestone 1 Implementation
**Content**: Checking on your progress. How is the implementation and verification proceeding?
**Action**: Please provide a quick status update on your current step.
