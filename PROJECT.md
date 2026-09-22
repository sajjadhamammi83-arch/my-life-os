# Project: Life OS Comprehensive Cross-Module Integration & Universal E2E Test Suite

## Architecture
- Framework: Next.js 14.2.16 (App Router) with React 18 & TypeScript 5.6
- ORM & Database: Prisma 5.22.0 with SQLite (`prisma/dev.db`)
- Styling: Tailwind CSS 3.4, Vazirmatn font, Minimal Pure White (`#ffffff`) theme
- Server: Port 3050 strictly enforced (`next dev -p 3050`); Port 3000 strictly isolated (user cafe platform, PID 8600)
- Core System Modules:
  - Header Bell & D-1 Reminders (`src/components/layout/Header.tsx`, `/api/reminders/tomorrow`)
  - Dashboard Page & API (`src/app/dashboard/page.tsx`, `src/app/api/dashboard/route.ts`)
  - Today Page & API (`src/app/today/page.tsx`, `src/app/api/today/route.ts`)
  - Goals & OKRs (`src/app/goals/page.tsx`, `src/app/api/goals/route.ts`, `src/app/api/goals/daily-dispatcher/route.ts`)
  - Tasks & Rollover (`src/app/tasks/page.tsx`, `src/app/api/tasks/route.ts`)
  - Planner & Calendar (`src/app/planner/page.tsx`, `src/app/api/planner/route.ts`, `src/app/api/calendar/route.ts`)
  - Learning & University (`src/app/learning/page.tsx`, `src/app/api/learning/route.ts`)
  - Finance & Accounting (`src/app/finance/page.tsx`, `src/app/api/finance/route.ts`, `src/app/api/finance/accounting/route.ts`, `src/app/api/finance/cash-register/route.ts`)
  - Reviews & Energy (`src/app/review/page.tsx`, `src/app/api/reviews/route.ts`, `src/app/api/reviews/daily/route.ts`)
  - Analytics & Reports (`src/app/analytics/page.tsx`, `src/app/api/analytics/route.ts`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Missing Root & Compatibility API Endpoints | Create `/api/dashboard`, `/api/today`, `/api/finance`, `/api/reviews/daily`, `/api/calendar` to satisfy API contracts | M1 | Survey Explorers 1, 2, 3 |
| 2 | Comprehensive D-1 Advance Reminders API | Extend `/api/reminders/tomorrow` to query bank cheques (`Cheque`), university exams (`UniversityExam`), assignments, and milestones | M1 | Survey Explorer 3 |
| 3 | Header Bell D-1 UI for Cheques & Exams | Add cheque amount/bank and exam course/room badges and items in `Header.tsx` dropdown popover | M1 | Survey Explorer 3 |
| 4 | Tomorrow Agenda Widget Enhancement | Extend `TomorrowAgendaWidget.tsx` on `/dashboard` and `/today` to display cheques and exams | M1 | Survey Explorer 3 |
| 5 | Today Page Live Calendar Block Timeline | Replace hardcoded mock array in `src/app/today/page.tsx` with live DB `CalendarBlock` records | M1 | Survey Explorer 1 |
| 6 | Goals to Today & Big 3 Feedback Loop | Synchronize task completion in `PATCH /api/tasks` with KeyResult/Objective progress and `DailyReview.big3Completed` | M2 | Survey Explorer 1 |
| 7 | Unfinished Tasks Rollover to Tomorrow | Implement rollover logic moving today's uncompleted tasks to tomorrow and suggesting empty calendar slots | M2 | Survey Explorer 1 |
| 8 | Learning to Planner & Calendar Sync | Auto-generate `CalendarBlock`s for university classes/exams and incorporate into `/planner` and capacity engine | M2 | Survey Explorer 1 |
| 9 | Learning to Today Task Elevation | Ensure university events and exams with today's deadline appear in `/today` and exams set `isBigThree: true` | M2 | Survey Explorer 1 |
| 10 | Finance Cash Register P&L Sync | Fix `/api/analytics` to include cash register expenses and prevent revenue double-counting | M2 | Survey Explorer 2 |
| 11 | Reviews to Dashboard & Analytics Sync | Connect `/dashboard` to today's `DailyReview` (deep work hours, productivity, 4 energy levels) and expand analytics trends | M2 | Survey Explorer 2 |
| 12 | Visual Standards & Theme Stability | Strict pure white (`#ffffff`), crisp black contrast, Vazirmatn font, and Persian digits (`toPersianDigits`, `formatCurrency`) | M1, M2 | Survey Explorer 3 |
| 13 | Universal Automated E2E Test Suite | Implement `scripts/test-e2e-all.ts` testing all 10 endpoints, full CRUD scenarios, cross-module ripple effects, zero 500s | M3 | Survey Explorers 1, 2, 3 |
| 14 | TypeScript Compilation Zero Errors | Ensure `node node_modules/typescript/bin/tsc --noEmit` runs with 0 errors (exit code 0) | M3 | Survey Explorer 3 |
| 15 | Multi-Agent Independent Verification & Audit | 2 Reviewers, 2 Challengers, and Forensic Auditor verification | M4 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | System API Endpoints & D-1 Reminders Expansion | Create 5 missing endpoints (`/api/dashboard`, `/api/today`, `/api/finance`, `/api/reviews/daily`, `/api/calendar`), extend `/api/reminders/tomorrow` (cheques & exams), update `Header.tsx` & `TomorrowAgendaWidget.tsx`, connect `/today` timeline to live DB blocks | none | DONE |
| M2 | Cross-Module Synchronization & Data Flow | Goal-to-Today completion feedback, task rollover to tomorrow with slot suggestion, learning-to-planner calendar sync, finance cash register P&L fix, reviews-to-dashboard/analytics sync | M1 | IN_PROGRESS |
| M3 | Universal Automated E2E Test Suite & Clean Typecheck | Develop and verify `scripts/test-e2e-all.ts` testing all 10 endpoints, CRUD, ripple effects, zero 500s, `tsc --noEmit` exit 0 | M1, M2 | PLANNED |
| M4 | Independent Reviews, Challengers & Forensic Audit | 2 Reviewers, 2 Challengers, 1 Forensic Auditor, full test execution, Sentinel completion handoff | M1, M2, M3 | PLANNED |

## Interface Contracts

### 1. `/api/dashboard` (GET)
- Response JSON:
  ```typescript
  {
    success: true,
    activeCycle: { id: string, title: string, progress: number },
    todayTasks: Array<{ id: string, title: string, isBigThree: boolean, status: string }>,
    todayReview: { productivityScore: number, deepWorkHours: number, energyPhysical: number, energyEmotional: number, energyMental: number, energySpiritual: number } | null,
    financialSummary: { totalLiquidBalance: number, todayIncome: number, todayExpense: number, unreconciledRegisters: number },
    tomorrowRemindersSummary: { totalItems: number, blocksCount: number, tasksCount: number, chequesCount: number, examsCount: number }
  }
  ```

### 2. `/api/today` (GET, POST)
- GET Response JSON:
  ```typescript
  {
    success: true,
    todayDate: string,
    todayPersianDate: string,
    big3: Array<{ id: string, title: string, status: string, estimatedMinutes: number }>,
    otherTasks: Array<{ id: string, title: string, status: string, priority: string }>,
    calendarBlocks: Array<{ id: string, title: string, start: string, end: string, type: string }>,
    habits: Array<{ id: string, title: string, completed: boolean }>,
    cashRegister: { openingCash: number, salesCash: number, actualClosingCash: number, reconciled: boolean } | null,
    waterLiters: number,
    reviewCompleted: boolean
  }
  ```

### 3. `/api/finance` (GET, POST)
- GET Response JSON:
  ```typescript
  {
    success: true,
    summary: { totalLiquidBalance: number, totalIncomes: number, totalExpenses: number, netProfit: number },
    accounts: Array<{ id: string, name: string, balance: number, type: string }>,
    costCenters: Array<{ id: string, name: string, code: string }>,
    recentTransactions: Array<{ id: string, title: string, amount: number, type: string, date: string }>,
    cashRegisters: Array<{ id: string, date: string, salesCash: number, difference: number, reconciled: boolean }>
  }
  ```

### 4. `/api/reviews/daily` (GET, POST, PATCH)
- Handles same payload as `/api/reviews`, ensuring full CRUD for daily reviews with 4 energy levels.

### 5. `/api/calendar` (GET, POST)
- Wraps/delegates to `/api/planner`, querying/creating `CalendarBlock` records with optional date filters.

### 6. `/api/reminders/tomorrow` (GET)
- Response JSON includes:
  ```typescript
  {
    success: true,
    tomorrowDate: string,
    tomorrowPersianDate: string,
    summary: { totalItems: number, blocksCount: number, tasksCount: number, workoutsCount: number, chequesCount: number, examsCount: number },
    blocks: Array<...>,
    tasks: Array<...>,
    workouts: Array<...>,
    cheques: Array<{ id: string, chequeNumber: string, bankName: string, amount: number, payeeOrPayer: string, chequeType: string }>,
    exams: Array<{ id: string, title: string, courseTitle: string, examDate: string, room: string, weight: number }>
  }
  ```

## Code Layout
- `src/app/api/dashboard/route.ts` — Dashboard aggregator API
- `src/app/api/today/route.ts` — Today aggregator & daily overview API
- `src/app/api/finance/route.ts` — Finance aggregator API
- `src/app/api/reviews/daily/route.ts` — Daily review alias API
- `src/app/api/calendar/route.ts` — Calendar blocks alias API
- `src/app/api/reminders/tomorrow/route.ts` — Enhanced D-1 Reminders API with cheques and exams
- `src/components/layout/Header.tsx` — Header Bell with badges for cheques and exams
- `src/components/dashboard/TomorrowAgendaWidget.tsx` — Enhanced widget with cheques and exams
- `src/app/today/page.tsx` — Today page with live calendar blocks and rollover action
- `src/app/planner/page.tsx` — Planner page with university class blocks and rollover slot suggestions
- `src/app/api/tasks/route.ts` — Enhanced tasks API with rollover and OKR sync
- `src/app/api/learning/route.ts` — Enhanced learning API with CalendarBlock generation
- `src/app/api/analytics/route.ts` — Fixed P&L analytics with cash register expense accounting
- `src/app/dashboard/page.tsx` — Dashboard connected to live DailyReview metrics
- `scripts/test-e2e-all.ts` — Universal automated E2E test suite
