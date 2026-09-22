# Handoff Report: Survey of Unified Notifications, D-1 Reminders, Theme Compliance, API Routes & E2E Test Architecture

**Agent**: `survey_explorer_3_8` (teamwork_preview_explorer)  
**Parent**: `8b12c48d-2bb0-4aca-aca4-c020ee52775b` (parent orchestrator)  
**Date**: 2026-09-14T00:57:00+03:30  
**Workspace**: `d:/my life`  
**Working Directory**: `d:/my life/.agents/survey_explorer_3_8`  
**Status**: Hard Handoff (Investigation Complete)

---

## Executive Summary
This investigation performed a comprehensive architectural, schema, API, UI, and test infrastructure audit of Life OS in accordance with `ORIGINAL_REQUEST.md` (specifically the follow-up under `2026-09-13T20:09:45Z`) and `DISPATCH.md`.

Key discoveries:
1. **D-1 Advance Reminders Gap**: `/api/reminders/tomorrow` currently queries only `CalendarBlock`, `Task`, `Workout`, `UniversityEvent`, and course weekly schedules. It completely omits **Bank Checks** (`Cheque` model) and **University Exams** (`UniversityExam` model), leaving users unaware of critical financial commitments and academic exams in their Header Bell (`Header.tsx`) and Tomorrow Widgets.
2. **Missing System API Endpoints**: While the UI pages exist, 5 of the 10 API endpoints specified in DISPATCH.md (`/api/dashboard`, `/api/today`, `/api/finance`, `/api/reviews/daily`, `/api/calendar`) do not exist as route files in `src/app/api/` and return HTTP 404 if queried directly. Sub-routes exist under different paths (e.g. `/api/finance/accounting`, `/api/reviews`, `/api/planner`), so compatibility/aggregator endpoints are needed.
3. **Theme & Styling Compliance**: The pure minimal white theme (`#ffffff` background, `#09090b` crisp black text, high-contrast monochrome buttons, Vazirmatn font loaded via Google Fonts and Tailwind, RTL direction, and Persian digit formatting helpers in `src/lib/utils.ts`) is well-established but requires strict enforcement in newly introduced reminder and test components.
4. **Automated E2E Test Suite Architecture**: Node.js v22.19.0 natively supports TypeScript execution via `node --experimental-strip-types`. A comprehensive E2E test suite (`scripts/test-e2e-all.ts` or expanded `scripts/test-e2e-suite.mjs`) is designed to validate all 10 API endpoints, full CRUD lifecycles, cross-module ripple effects, zero 500 errors, and clean TypeScript compilation (`node node_modules/typescript/bin/tsc --noEmit`).

---

## 1. Observations

### 1.1 Header Notification Bell & D-1 Reminders Architecture
- **Header Component** (`src/components/layout/Header.tsx`):
  - Lines 14–25: State `reminderData` holds `tomorrowPersianDate`, `summary`, `blocks`, `tasks`, `workouts`.
  - Lines 29–41: Fetches `/api/reminders/tomorrow` on mount.
  - Lines 48–55: Registers a `reminders-updated` window event listener for reactive real-time updates.
  - Lines 104–120: Header bell button displays a badge counter with `toPersianDigits(totalTomorrowCount)`.
  - Lines 121–237: Dropdown popover renders 3 categories:
    - Calendar Blocks (`Clock` icon, lines 156–179)
    - Tasks with Due Date Tomorrow (`CheckSquare` icon, lines 182–211)
    - Workouts (`Dumbbell` icon, lines 214–234)
  - **Verified Observation**: The dropdown has NO section, icon, or badge for Bank Checks (`Cheque`) or University Exams (`UniversityExam`).

- **Tomorrow Reminders API** (`src/app/api/reminders/tomorrow/route.ts`):
  - Lines 10–24: Computes tomorrow's 24-hour window from `00:00:00.000` to `23:59:59.999` local time.
  - Lines 34–52: Queries `prisma.calendarBlock.findMany`.
  - Lines 55–75: Queries `prisma.task.findMany` where `status != "completed"` and due/scheduled tomorrow.
  - Lines 78–86: Queries `prisma.workout.findMany` for tomorrow.
  - Lines 89–99: Queries `prisma.universityEvent.findMany` where `dueDate` is tomorrow.
  - Lines 102–106: Checks weekly recurring classes from `prisma.universityCourse.findMany`.
  - Lines 151–165: Formats university events into `formattedTasks`.
  - **Verified Observation**: There is NO query for `prisma.cheque` (bank checks), NO query for `prisma.universityExam` (exams), NO query for `prisma.universityAssignment`, and NO query for `prisma.milestone`.

- **Tomorrow Agenda Widget** (`src/components/dashboard/TomorrowAgendaWidget.tsx`):
  - Lines 27–41: Fetches `/api/reminders/tomorrow` and listens to `reminders-updated`.
  - Lines 101–191: Renders calendar blocks, tasks, and workouts.
  - Integrated on `/dashboard` (`src/app/dashboard/page.tsx:286`) and `/today` (`src/app/today/page.tsx:649`).

- **Autonomous Daily Goal Dispatcher & Slip Recovery** (`src/app/api/goals/daily-dispatcher/route.ts`):
  - Lines 13–54: Autonomous daily goal task dispatcher: checks active objectives with `dailyAction` and creates today's task if not already created.
  - Lines 56–65: Slip recovery assistant: detects uncompleted goal tasks from yesterday or earlier.
  - Lines 67–100: Computes available free calendar windows (e.g. 08:30–10:00, 11:00–12:30, 14:00–15:30) avoiding occupied `CalendarBlock`s.
  - Integrated via `DailyGoalRecoveryWidget` (`src/components/goals/DailyGoalRecoveryWidget.tsx`) on `/today` (`src/app/today/page.tsx:294`).

### 1.2 Styling, Theme & Typography Standards
- **Global Theme & Colors** (`src/app/globals.css`):
  - Line 1: `@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@200;300;400;500;600;700;800;900&display=swap');`
  - Line 8: `--font-vazirmatn: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`
  - Lines 15–25: `body { font-family: var(--font-vazirmatn); direction: rtl; text-align: right; background-color: #ffffff; color: #09090b; }`
  - Lines 47–60: `.glass-panel` and `.glass-card` defined with clean white surfaces, subtle border `rgba(0, 0, 0, 0.08)` and `#e4e4e7`.
- **Tailwind Configuration** (`tailwind.config.ts`):
  - Lines 12–14: `fontFamily: { sans: ["var(--font-vazirmatn)", "Vazirmatn", ...] }`
  - Lines 15–23: Monochrome surface palette (`50: #fafafa`, `100: #f4f4f5`, `800: #27272a`, `900: #18181b`, `950: #09090b`).
- **Persian Formatting & Math Utilities** (`src/lib/utils.ts`):
  - Lines 8–12: `toPersianDigits(n)` converts `0-9` to `۰-۹`.
  - Lines 14–22: `formatCurrency(amount, currency, usePersianDigits)` formats currency in Tomans/Rials with Persian digits.
  - Lines 24–43: `formatPersianDate(date, options)` formats Gregorian dates into Jalali with Persian numbering system.
  - Lines 45–53: `formatPersianDateTime(date)`.
  - Lines 55–62: `getTodayPersianString()`.
  - Lines 64–74: `calculateSleepEfficiency` and `calculateProgress`.
  - Lines 76–100: `PERSIAN_MONTH_NAMES` and `isJalaliLeapYear`.

### 1.3 System Routes & API Endpoints Status
A filesystem audit revealed the following status for the 10 requested endpoints:

| Endpoint Specified in R3 | File Path in Codebase | Route Status | Notes & Underlying Handler |
|---|---|---|---|
| `/api/dashboard` | `src/app/api/dashboard/route.ts` | ❌ **Missing** (404) | `/dashboard` page is a Server Component (`src/app/dashboard/page.tsx`) querying Prisma directly. Needs an API endpoint. |
| `/api/today` | `src/app/api/today/route.ts` | ❌ **Missing** (404) | `/today` page is client-side (`src/app/today/page.tsx`). Needs an API endpoint aggregating today's state. |
| `/api/goals` | `src/app/api/goals/route.ts` | ✅ **Exists** (200) | Full CRUD for Objectives & KeyResults, auto-schedule dispatch, progress calculations. |
| `/api/projects` | `src/app/api/projects/route.ts` | ✅ **Exists** (200) | Full CRUD for Projects and Milestones. |
| `/api/tasks` | `src/app/api/tasks/route.ts` | ✅ **Exists** (200) | Full CRUD for Tasks, Kanban columns, Big 3, and `action="auto_forward"`. |
| `/api/finance` | `src/app/api/finance/route.ts` | ❌ **Missing** (404) | Sub-routes exist at `/api/finance/accounting`, `/api/finance/cash-register`, `/api/finance/sales`, `/api/finance/transactions`, `/api/finance/products`. Needs a root `/api/finance` aggregator/alias. |
| `/api/reviews/daily` | `src/app/api/reviews/daily/route.ts` | ❌ **Missing** (404) | Endpoint exists at `src/app/api/reviews/route.ts` (handles GET, POST daily review with 4 energy levels, PATCH questions). Needs alias `/api/reviews/daily`. |
| `/api/learning` | `src/app/api/learning/route.ts` | ✅ **Exists** (200) | Full CRUD for university courses, events (syncs to tasks), books, learning skills. |
| `/api/calendar` | `src/app/api/calendar/route.ts` | ❌ **Missing** (404) | Endpoint exists at `src/app/api/planner/route.ts` (`/calendar` web page redirects to `/planner`). Needs alias `/api/calendar`. |
| `/api/analytics` | `src/app/api/analytics/route.ts` | ✅ **Exists** (200) | Full aggregation for daily trends, energy levels, deep work, Eisenhower distribution, cost center financials linked to cash registers. |

### 1.4 Database Schema Models for Target Entities
From `prisma/schema.prisma`:
- **Bank Checks** (`model Cheque`, lines 463–480):
  `id`, `chequeNumber`, `bankName`, `amount`, `dueDate`, `dueDateShamsi`, `payeeOrPayer`, `chequeType: "PAYABLE" | "RECEIVABLE"`, `status: "PENDING" | "CLEARED" | "BOUNCED" | "CANCELLED"`, `bankAccountId`, `costCenterId`.
- **University Exams** (`model UniversityExam`, lines 843–856):
  `id`, `courseId`, `title`, `examDate`, `room`, `weight`, `score`, `notes`.
- **University Assignments** (`model UniversityAssignment`, lines 828–841):
  `id`, `courseId`, `title`, `dueDate`, `status: "pending" | "submitted" | "graded"`, `score`, `weight`.
- **University Events** (`model UniversityEvent`, lines 858–874):
  `id`, `courseId`, `title`, `type`, `dueDate`, `time`, `location`, `weight`, `priority`, `status`.
- **Milestones** (`model Milestone`, lines 124–135):
  `id`, `projectId`, `title`, `dueDate`, `status: "pending" | "completed"`.
- **Shop Cash Register** (`model ShopCashRegister`, lines 800–816):
  `id`, `date`, `openingCash`, `salesCash`, `expensesCash`, `withdrawalsCash`, `expectedClosingCash`, `actualClosingCash`, `difference`, `reconciled`, `costCenterId`.
- **Daily Review** (`model DailyReview`, lines 317–344):
  `id`, `date`, `big3Completed`, `productivityScore`, `mood`, `deepWorkHours`, `energyPhysical`, `energyEmotional`, `energyMental`, `energySpiritual`, `bottleneck`.

### 1.5 Test Infrastructure & Environment
- **TypeScript Compiler**: `node node_modules/typescript/bin/tsc --noEmit` executed with **0 errors (Exit code 0)**.
- **Node.js Environment**: Node `v22.19.0`. Supports native TypeScript stripping: `node --experimental-strip-types <script.ts>`.
- **Next.js Server**: Running on port **3050** (PID 4872). Verified response from `http://localhost:3050/api/reminders/tomorrow`.
- **Port 3000 Isolation**: Port 3000 is occupied by the user's cafe application and must never be accessed or stopped.
- **Existing Test Scripts** in `scripts/`:
  - `scripts/test-core.mjs`: Tests core math formulas (sleep efficiency, balance sheet equation, P&L, cash register difference, inventory movement, KR progress). Passed 100%.
  - `scripts/test-e2e-suite.mjs`: 1509-line runner with 86 assertions across 4 tiers. Tests isolated features, boundary cases, ripple effects, and 20 web routes.

---

## 2. Logic Chain

### 2.1 Why Bank Checks and Exams Are Missing from D-1 Reminders
1. `src/app/api/reminders/tomorrow/route.ts` was initially written to fulfill the Calendar Auto-Scheduler requirements (milestones M1–M2), which focused on `CalendarBlock`, `Task`, `Workout`, and weekly recurring university courses.
2. In the follow-up of `2026-09-13T20:09:45Z`, requirement R2 expanded the scope to:
   > "بررسی عملکرد سراسری زنگوله اعلان هدر (Header Notification Bell) و یادآورهای روز قبل (D-1) برای سررسیدها، امتحانات دانشگاه، چک‌های بانکی و رویدادهای تقویم."
3. The Prisma schema defines `Cheque` and `UniversityExam` as distinct tables independent of `Task`.
4. Because `src/app/api/reminders/tomorrow/route.ts` does not query `prisma.cheque` or `prisma.universityExam`, these events never enter the JSON response payload.
5. Consequently, `Header.tsx` and `TomorrowAgendaWidget.tsx` have no data to display for cheques or exams, and their badge count remains under-reported.

### 2.2 Why Root/Alias Endpoints Must Be Created
1. Requirement R3 explicitly mandates testing:
   `/api/dashboard`, `/api/today`, `/api/goals`, `/api/projects`, `/api/tasks`, `/api/finance`, `/api/reviews/daily`, `/api/learning`, `/api/calendar`, `/api/analytics`.
2. Currently, `/api/dashboard`, `/api/today`, `/api/finance`, `/api/reviews/daily`, and `/api/calendar` return HTTP 404.
3. Any automated test suite targeting these literal endpoints will fail with 404 errors unless compatibility route handlers are created:
   - `src/app/api/dashboard/route.ts`: Returns high-level dashboard data (active cycle, Big 3 tasks, cash balances, sleep efficiency, low stock products).
   - `src/app/api/today/route.ts`: Returns today's active tasks, daily habits, cash register status, and water hydration.
   - `src/app/api/finance/route.ts`: Proxies or aggregates `GET /api/finance/accounting`, providing liquid balances, income, expense, and cost center summaries.
   - `src/app/api/reviews/daily/route.ts`: Delegates to the existing review logic in `src/app/api/reviews/route.ts`.
   - `src/app/api/calendar/route.ts`: Delegates to `src/app/api/planner/route.ts`.

### 2.3 Cross-Module Ripple Effect Validation Logic
To prove full system cohesion without deadlocks, the following 5 data chains must be verified end-to-end:
- **Chain 1: Goal -> Daily Big 3 -> Slip Recovery**:
  1. POST `/api/goals` creates an Objective with `dailyAction="تست اقدام روزانه"` and `autoSchedule=true`.
  2. A linked Task is auto-created with `status="today"` and `isBigThree=true`.
  3. If a past goal task remains incomplete, GET `/api/goals/daily-dispatcher` detects it and calculates available free calendar slots.
  4. POST `/api/goals/daily-dispatcher` reschedules the task into an open calendar block.
- **Chain 2: University Exam & Event -> Task -> D-1 Advance Reminder**:
  1. POST `/api/learning` (type="event") creates a university event and auto-creates a linked `Task` with area "دانشگاه".
  2. POST `/api/learning` or direct DB creation registers an exam for tomorrow.
  3. GET `/api/reminders/tomorrow` immediately reflects the exam and assignment under tomorrow's agenda.
- **Chain 3: Bank Cheque -> D-1 Advance Reminder & Finance Summary**:
  1. POST `/api/finance/accounting` (type="cheque") registers a cheque with `dueDate` set to tomorrow and `status="PENDING"`.
  2. GET `/api/reminders/tomorrow` returns the cheque in `cheques` list and increments `summary.totalItems` and `summary.chequesCount`.
  3. Header Bell badge increases accordingly.
- **Chain 4: Cash Register Balancing -> Cost Centers -> Analytics**:
  1. POST `/api/finance/cash-register` records daily drawer cash with `actualClosingCash === expectedClosingCash` (difference = 0, reconciled = true).
  2. GET `/api/analytics?range=30` reflects the register's sales within `costCenterFinancials`.
- **Chain 5: Daily Review -> Analytics Energy Trends**:
  1. POST `/api/reviews` records a daily review with `energyPhysical=9`, `energyMental=8`, `deepWorkHours=5`.
  2. GET `/api/analytics` reflects these exact values in `dailyTrends`.

---

## 3. Gaps Identified

| # | Gap Area | Current Behavior | Required Specification | Impact |
|---|---|---|---|---|
| **G1** | **Bank Checks in D-1 Reminders** | `/api/reminders/tomorrow` does not query `prisma.cheque`. | Query all cheques where `dueDate` is tomorrow and `status === 'PENDING'`. Expose `cheques: []` and `chequesCount`. | High (User misses critical payment/collection alerts) |
| **G2** | **University Exams in D-1 Reminders** | `/api/reminders/tomorrow` does not query `prisma.universityExam`. | Query all exams where `examDate` is tomorrow. Expose `exams: []` and `examsCount`. | High (User misses university exam alerts) |
| **G3** | **Header Bell UI Dropdown** | `Header.tsx` only renders blocks, tasks, and workouts. | Add dedicated visual sections for `چک‌های بانکی سررسید فردا` and `امتحانات دانشگاه`. | High (UI blindspot) |
| **G4** | **Tomorrow Widget UI** | `TomorrowAgendaWidget.tsx` only renders blocks, tasks, and workouts. | Add cheque and exam cards with badges and amounts/locations. | Medium |
| **G5** | **Missing API Route Files** | `/api/dashboard`, `/api/today`, `/api/finance`, `/api/reviews/daily`, `/api/calendar` return 404. | Create the 5 missing route handlers or compatibility redirects returning 200 OK with valid JSON. | High (Test suite & external callers fail) |
| **G6** | **E2E Test Suite Scope** | `scripts/test-e2e-suite.mjs` only tests 8 endpoints and omits `/api/reminders/tomorrow`, `/api/learning`, `/api/reviews`, `/api/analytics`, `/api/projects`. | Create `scripts/test-e2e-all.ts` (or expand `test-e2e-suite.mjs`) to test all 10 endpoints, full CRUD, cross-module chains, and `tsc --noEmit`. | High (Requirement R3) |

---

## 4. Proposed Architecture for Automated E2E Test Suite

### 4.1 Test Runner Command
To satisfy requirement R3 while ensuring zero extra dependencies, the test runner should be implemented as:
```bash
node --experimental-strip-types scripts/test-e2e-all.ts
```
*(Alternatively, an ESM script `node scripts/test-e2e-all.mjs` or unified `node scripts/test-e2e-suite.mjs` can be executed directly.)*

### 4.2 Test Suite Structure & Modules
The suite should be organized into 5 sequential phases:

```
scripts/test-e2e-all.ts
├── Phase 0: Pre-flight & Build Verification
│   ├── Check port 3050 liveness (abort if unreachable)
│   ├── Verify port 3000 is untouched
│   └── Run TypeScript compilation: node node_modules/typescript/bin/tsc --noEmit
│
├── Phase 1: All 10 Required API Endpoints Sweep (HTTP GET 200 OK)
│   ├── GET /api/dashboard
│   ├── GET /api/today
│   ├── GET /api/goals
│   ├── GET /api/projects
│   ├── GET /api/tasks
│   ├── GET /api/finance (and /api/finance/accounting)
│   ├── GET /api/reviews/daily (and /api/reviews)
│   ├── GET /api/learning
│   ├── GET /api/calendar (and /api/planner)
│   └── GET /api/analytics
│
├── Phase 2: Full CRUD Lifecycles & Zero 500 Errors
│   ├── CRUD Goals: POST objective -> POST keyResult -> PATCH progress -> DELETE
│   ├── CRUD Projects: POST project -> POST milestone -> PATCH -> DELETE
│   ├── CRUD Tasks: POST task -> PATCH status -> PATCH auto_forward -> DELETE
│   ├── CRUD Learning: POST course -> POST event -> PATCH -> DELETE
│   ├── CRUD Planner/Calendar: POST block -> GET date filter -> DELETE
│   ├── CRUD Finance: POST sale -> POST cash register -> POST cheque -> POST expense
│   └── CRUD Reviews: POST daily review with 4 energy scores -> PATCH questions
│
├── Phase 3: Unified Notifications & D-1 Reminders Verification
│   ├── Seed test CalendarBlock for tomorrow -> verify in /api/reminders/tomorrow
│   ├── Seed test Task due tomorrow -> verify in /api/reminders/tomorrow
│   ├── Seed test Cheque due tomorrow -> verify in /api/reminders/tomorrow
│   ├── Seed test UniversityExam tomorrow -> verify in /api/reminders/tomorrow
│   └── Verify summary.totalItems equals sum of all tomorrow items
│
├── Phase 4: Cross-Module Ripple Effects & Synchronization
│   ├── Chain 1: Goal autoSchedule -> Today Big 3 task creation -> Slip recovery
│   ├── Chain 2: University event creation -> automatic Task generation
│   ├── Chain 3: Store sale -> stock deduction -> audit movement -> account balance
│   ├── Chain 4: Cash register reconciliation -> analytics costCenterFinancials
│   └── Chain 5: Daily review energy ratings -> analytics dailyTrends
│
└── Phase 5: Web Routes Liveness Sweep & Cleanup
    ├── Sweep all 20 web routes (/, /today, /dashboard, /tasks, /planner, /calendar, ...)
    └── Execute LIFO cleanup stack (delete all [E2E-...] tagged records)
```

### 4.3 Proposed Implementation Plan for Builder Agents
1. **Reminders & Header Builder**:
   - Edit `src/app/api/reminders/tomorrow/route.ts`:
     - Query `prisma.cheque.findMany` for tomorrow where `status === "PENDING"`.
     - Query `prisma.universityExam.findMany` for tomorrow.
     - Include `cheques` and `exams` in JSON response and update `summary.totalItems`.
   - Edit `src/components/layout/Header.tsx`:
     - Add Cheques section with `CreditCard` icon and amount.
     - Add Exams section with `GraduationCap` icon and room/time.
   - Edit `src/components/dashboard/TomorrowAgendaWidget.tsx`:
     - Add Cheques and Exams visual cards.
2. **Routes & Endpoints Builder**:
   - Create `src/app/api/dashboard/route.ts` (returns summary metrics).
   - Create `src/app/api/today/route.ts` (returns today's composite status).
   - Create `src/app/api/finance/route.ts` (aggregates or proxies accounting overview).
   - Create `src/app/api/reviews/daily/route.ts` (alias to reviews).
   - Create `src/app/api/calendar/route.ts` (alias to planner).
3. **Test Architect Builder**:
   - Implement `scripts/test-e2e-all.ts` (or update `scripts/test-e2e-suite.mjs`).
   - Run tests and verify 100% pass rate.
   - Run `node node_modules/typescript/bin/tsc --noEmit` to confirm 0 errors.

---

## 5. Verification Commands

### 5.1 TypeScript Compilation Verification
```powershell
node node_modules/typescript/bin/tsc --noEmit
```
*Expected: Exit code 0, zero errors.*

### 5.2 Core Math Verification
```powershell
node scripts/test-core.mjs
```
*Expected: All 7 core business rule formulas pass.*

### 5.3 Verify Tomorrow Reminders Endpoint (Live Server)
```powershell
node -e "fetch('http://localhost:3050/api/reminders/tomorrow').then(r => r.json()).then(d => console.log('Status:', d.success, 'Total Items:', d.summary.totalItems));"
```
*Expected: `Status: true`.*

### 5.4 Verify All 10 Target API Endpoints (Current vs Future)
```powershell
node -e "
const endpoints = [
  '/api/dashboard',
  '/api/today',
  '/api/goals',
  '/api/projects',
  '/api/tasks',
  '/api/finance',
  '/api/reviews/daily',
  '/api/learning',
  '/api/calendar',
  '/api/analytics'
];
Promise.all(endpoints.map(ep => 
  fetch('http://localhost:3050' + ep)
    .then(r => ({ ep, status: r.status, ok: r.ok }))
    .catch(e => ({ ep, error: e.message }))
)).then(console.table);
"
```
*Expected after implementing missing routes: All 10 return status 200.*

### 5.5 Run Full E2E Test Suite
```powershell
node --experimental-strip-types scripts/test-e2e-all.ts
# or
node scripts/test-e2e-suite.mjs
```
*Expected: 100% assertions pass, zero 500 errors, zero unhandled rejections.*

---
*Report completed and stored at `d:/my life/.agents/survey_explorer_3_8/handoff.md`.*
