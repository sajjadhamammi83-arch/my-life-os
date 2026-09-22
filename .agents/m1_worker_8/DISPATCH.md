# Dispatch: Worker M1 (System API Endpoints & D-1 Reminders Expansion)

## 2026-09-13T21:29:18Z
Working directory: `d:/my life/.agents/m1_worker_8`
Original Request: `d:/my life/.agents/ORIGINAL_REQUEST.md` (read follow-up under 2026-09-13T20:09:45Z)
Scope document: `d:/my life/PROJECT.md`
Survey reports:
- `d:/my life/.agents/survey_explorer_1_8/handoff.md`
- `d:/my life/.agents/survey_explorer_2_8/handoff.md`
- `d:/my life/.agents/survey_explorer_3_8/handoff.md`

Your Role: `teamwork_preview_worker`

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope of Work for Milestone 1:
1. Create `src/app/api/dashboard/route.ts` (GET):
   - Query active Cycle90Day / Objectives, today's Big 3 tasks from `prisma.task`, today's review from `prisma.dailyReview`, liquid balance from `prisma.financialAccount`, today's income/expense from `prisma.transaction`, and tomorrow reminders summary. Return clean JSON with `{ success: true, ... }`.
2. Create `src/app/api/today/route.ts` (GET, POST):
   - GET: Query today's date range, Big 3 tasks, other tasks, live `prisma.calendarBlock`s, today's `prisma.habitLog`s / habits, today's `prisma.shopCashRegister`, hydration from `prisma.healthMetric`.
   - POST: Allow creating a today task or quick capture.
3. Create `src/app/api/finance/route.ts` (GET, POST):
   - GET: Query `prisma.costCenter`, `prisma.financialAccount`, recent `prisma.transaction`s, `prisma.shopCashRegister`s, and calculate summary (totalLiquidBalance, totalIncomes, totalExpenses, netProfit).
   - POST: Support creating transactions/expenses or forward to accounting.
4. Create `src/app/api/reviews/daily/route.ts` (GET, POST, PATCH):
   - Proxy / implement daily review operations matching `src/app/api/reviews/route.ts` with 4 energy levels, deep work hours, productivity score, mood, and bottlenecks.
5. Create `src/app/api/calendar/route.ts` (GET, POST, DELETE):
   - Proxy / implement calendar blocks CRUD matching `src/app/api/planner/route.ts`.
6. Extend `src/app/api/reminders/tomorrow/route.ts`:
   - Query `prisma.cheque.findMany` where `dueDate` is tomorrow and `status === "PENDING"`.
   - Query `prisma.universityExam.findMany` where `examDate` is tomorrow, including course info.
   - Include `cheques` and `exams` in `summary` (`chequesCount`, `examsCount`) and top-level response.
7. Update `src/components/layout/Header.tsx`:
   - In Header Bell dropdown, add display for Bank Checks (amount, bank, due date, payee/payer) and University Exams (course, title, room, time) with proper icons, Persian digits, and `#ffffff` minimal white design.
8. Update `src/components/dashboard/TomorrowAgendaWidget.tsx`:
   - Render cheques and exams alongside blocks, tasks, and workouts.
9. Update `src/app/today/page.tsx`:
   - In the "جدول زمانی و بلوک‌های تمرکز امروز" section, replace the static hardcoded array with live `CalendarBlock`s fetched from DB.
10. Verify:
   - Run `node node_modules/typescript/bin/tsc --noEmit` and confirm 0 errors (exit code 0).
   - Test endpoints via HTTP on port 3050 (remember: DO NOT TOUCH PORT 3000).

Write a detailed handoff report `d:/my life/.agents/m1_worker_8/handoff.md` with verification commands and evidence, then send a message back.
