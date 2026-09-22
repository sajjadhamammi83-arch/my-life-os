# Dispatch: Worker M2 Replacement (Cross-Module Synchronization & Data Flow)

Working directory: `d:/my life/.agents/m2_worker_8_rep`
Original Request: `d:/my life/.agents/ORIGINAL_REQUEST.md` (read follow-up under 2026-09-13T20:09:45Z)
Scope document: `d:/my life/PROJECT.md`
Survey reports:
- `d:/my life/.agents/survey_explorer_1_8/handoff.md`
- `d:/my life/.agents/survey_explorer_2_8/handoff.md`
- `d:/my life/.agents/m1_worker_8/handoff.md`

Your Role: `teamwork_preview_worker`

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope of Work for Milestone 2:
1. **Goals to Today & Big 3 Feedback Loop**:
   - In `src/app/api/tasks/route.ts` (PATCH):
     - When a task is marked completed (`isCompleted === true` or `status === "completed"`):
       - If `task.objectiveId` is set: find the Objective and related KeyResults, increment current progress or value, update `Objective.progress` via `calculateProgress`.
       - If `task.isBigThree === true`: update or create today's `DailyReview` record incrementing `big3Completed`.
2. **Unfinished Tasks Rollover to Tomorrow with Calendar Slots**:
   - In `src/app/api/tasks/route.ts` (and/or `src/app/api/tasks/rollover/route.ts`):
     - Add action `rollover_to_tomorrow`:
       - Finds uncompleted tasks from today (`status != "completed"` and `dueDate <= today` or `status == "today"`).
       - Moves them to tomorrow (`dueDate = tomorrow`, `status = "today"`).
       - Queries tomorrow's existing `CalendarBlock`s, finds empty non-overlapping slots (e.g. 09:00-10:00, 11:00-12:00, 14:00-15:00, 16:30-17:30, 20:00-21:00).
       - Automatically creates or proposes `CalendarBlock`s for these rolled tasks with `status = "scheduled"` and `type = task.workType || "Deep Work"`.
       - Returns `{ success: true, forwardedCount, proposedSlots, tasks }`.
   - In `src/app/today/page.tsx` and `src/app/planner/page.tsx`:
     - Add a clean button/banner: "انتقال کارهای انجام‌نشده به فردا و زمان‌بندی هوشمند" that calls this rollover API, updates the view, and triggers `reminders-updated`.
3. **Learning to Planner & Today Integration**:
   - In `src/app/api/learning/route.ts`:
     - When a `UniversityEvent` is created (POST):
       - Automatically create a `CalendarBlock` on `parsedDueDate` with start time `event.time || "10:00"` and duration based on event type (e.g. 90 mins for exams/classes), type: `"Learning"`, title: `[دانشگاه] ${course?.title || "درس"}: ${event.title}`.
       - If `event.dueDate` is today, set the created `Task` status to `"today"` so it immediately appears in `/today`.
       - If `event.type` includes "امتحان" or "ارائه", set `isBigThree: true` and `priority: "urgent"` on the task.
     - When a `UniversityCourse` is created with `daysOfWeek`, `startTime`, `endTime`:
       - Create recurring or initial `CalendarBlock`s for this course or ensure `/api/planner` generates blocks for that weekday.
   - In `src/app/api/planner/route.ts`:
     - Merge university schedule events and class blocks into calendar blocks so the capacity engine and planner view never double-book university hours.
4. **Finance Cash Register P&L Sync**:
   - In `src/app/api/analytics/route.ts`:
     - Include cash register expenses (`cr.expensesCash`) in the cost center operating expenses.
     - Ensure: `profit = totalIncome - totalExpense;`
     - Avoid double-counting when individual sales transactions exist.
5. **Reviews to Dashboard & Analytics Sync**:
   - In `src/app/dashboard/page.tsx`:
     - Replace hardcoded `4.5` hours deep work with live `todayReview?.deepWorkHours || 0`, show today's productivity score, and display the 4 energy levels badges (physical, emotional, mental, spiritual) in Card 4.
   - In `src/app/api/analytics/route.ts`:
     - Allow 30 and 90-day range for `dailyTrends` so long-term trends are visible.
6. **Compile & Verify**:
   - `node node_modules/typescript/bin/tsc --noEmit` must pass with 0 errors (Exit code 0).
   - Test rollover, learning-planner sync, and review-dashboard integration on port 3050. Port 3000 must remain untouched.

Write handoff report to `d:/my life/.agents/m2_worker_8_rep/handoff.md` with complete verification details and send a message back.

## 2026-09-14T13:28:41Z
Read d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the latest follow-up under 2026-09-13T20:09:45Z), d:/my life/PROJECT.md, and your assignment at d:/my life/.agents/m2_worker_8_rep/DISPATCH.md.
Also refer to survey reports in d:/my life/.agents/survey_explorer_1_8/handoff.md, survey_explorer_2_8/handoff.md, and m1_worker_8/handoff.md.

Your working directory is d:/my life/.agents/m2_worker_8_rep.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope of Work:
1. Goals to Today & Big 3 completion feedback loop in src/app/api/tasks/route.ts (update Objective/KeyResult progress & DailyReview.big3Completed).
2. Unfinished tasks rollover to tomorrow with empty calendar slot allocation in src/app/api/tasks/route.ts (or src/app/api/tasks/rollover/route.ts) and UI trigger in /today and /planner.
3. Learning to Planner & Today integration in src/app/api/learning/route.ts and src/app/api/planner/route.ts (auto-create CalendarBlocks, elevate exam tasks to Big 3, integrate class schedule).
4. Finance Cash Register P&L sync in src/app/api/analytics/route.ts (include expensesCash, correct net profit).
5. Reviews to Dashboard & Analytics sync in src/app/dashboard/page.tsx (live deep work, productivity, 4 energy levels) and 90-day trends in /api/analytics.
6. Verify TypeScript compilation with `node node_modules/typescript/bin/tsc --noEmit` (0 errors).

Write a comprehensive handoff report at d:/my life/.agents/m2_worker_8_rep/handoff.md with all verification outputs. When finished, send a message back.

