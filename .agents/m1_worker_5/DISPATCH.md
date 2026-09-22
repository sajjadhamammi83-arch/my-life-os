# DISPATCH LOG — M1 Worker

## 2026-09-06T11:22:00Z
Role: Worker for Milestone 1: D-1 Advance Reminders & Future Events
Working directory: d:/my life/.agents/m1_worker_5
Authoritative request: `d:/my life/.agents/ORIGINAL_REQUEST.md` (read `## Follow-up — 2026-09-05T22:47:22Z`)
Project architecture: `d:/my life/PROJECT.md`
Survey reports: `d:/my life/.agents/survey_explorer_ui_5/handoff.md` and `d:/my life/.agents/survey_explorer_data_5/handoff.md`

### MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### File Ownership:
You own and have exclusive write permission to:
- `src/app/api/reminders/tomorrow/route.ts`
- `src/app/api/planner/route.ts`
- `src/components/layout/Header.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/today/page.tsx`

### Tasks for Milestone 1:
1. **Harmonize `/api/reminders/tomorrow/route.ts`**:
   - Provide both top-level and nested properties in response:
     - `blocks`: mapped with `id`, `title`, `start`, `end`, `type`, `timeFormatted` (e.g. "09:00 - 10:30"), `notes`
     - `tasks`: mapped with `id`, `title`, `priority`, `isBigThree`, `dueDate`, `area` ({ name: ... })
     - `workouts`: mapped with `id`, `title`, `durationMinutes`
     - `tomorrowPersianDate`: formatted string (e.g., Persian weekday and day/month using `Intl.DateTimeFormat("fa-IR", ...)` or helper)
     - `summary`: `{ totalItems, blocksCount, tasksCount, workoutsCount }`
     - Keep `reminders: { blocks, tasks, workouts }` for backwards compatibility.
2. **Header Bell Notification (`src/components/layout/Header.tsx`)**:
   - Verify that Header Bell queries `/api/reminders/tomorrow` and displays the badge counter when `totalTomorrowCount > 0`.
   - Ensure the dropdown displays tomorrow's items (blocks with formatted times, tasks with priorities, workouts).
   - Add `window.addEventListener("reminders-updated", fetchTomorrowReminders)` so other components can trigger an instant refresh via `window.dispatchEvent(new Event("reminders-updated"))`.
3. **Dashboard & Today Widgets (`src/app/dashboard/page.tsx` and `src/app/today/page.tsx`)**:
   - In `/dashboard`, ensure the "Tomorrow's Agenda & Events" widget renders blocks, tasks, and workouts cleanly with pure white theme (`#ffffff`), crisp black contrast, and Vazirmatn font.
   - In `/today`, ensure the "Tomorrow's Agenda" widget correctly displays tomorrow's items and reflects live data from `/api/reminders/tomorrow`.
4. **Future Date Registration in Planner (`src/app/api/planner/route.ts`)**:
   - Update `POST /api/planner` so that when a block is created, if `date` (or `start`/`end`) is passed in the request body, it sets the block's `start` and `end` to that specific future date rather than forcing it to today.
   - Support `date` query parameter in `GET /api/planner?date=YYYY-MM-DD` if provided, or return all blocks if not specified.
5. **Verification**:
   - Run `node node_modules/typescript/bin/tsc --noEmit` and confirm 0 errors.
   - Run verification curl or node script to test registering a block for tomorrow and verifying `/api/reminders/tomorrow` immediately returns it.

Write your changes in `changes.md` and complete a 5-component `handoff.md` in `d:/my life/.agents/m1_worker_5/`.
Notify parent via `send_message` when done.
