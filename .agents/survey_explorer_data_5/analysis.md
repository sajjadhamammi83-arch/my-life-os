# Comprehensive Data & API Investigation: Auto-Scheduler & D-1 Reminders

**Explorer**: Data & API Explorer (`survey_explorer_data_5`)  
**Date**: 2026-09-06  
**Workspace**: `d:/my life`  
**Integrity Mode**: Development (Strict Port 3050 Binding; Port 3000 Isolated)  
**Target Capabilities**: Intelligent Life OS Auto-Scheduler, Capacity & Feasibility Engine, D-1 Advance Reminders (Header Bell, Dashboard, Today), 1-Click Batch Calendar Persistence.

---

## 1. Executive Summary

This investigation analyzed the Prisma schema, existing API routes, database state, server configuration, and test infrastructure in preparation for the Auto-Scheduler and D-1 Advance Reminders follow-up requirements.

### Key Discoveries:
1. **Schema Sufficiency**: The existing `CalendarBlock` and `Task` models in `prisma/schema.prisma` already possess all required fields (`start`, `end`, `plannedDuration`, `type`, `dayType`, `energyRequirement`, `status`, `notes`, `taskId`, `projectId`, `areaId`). No disruptive database schema migration is needed. Everything can be cleanly represented using existing fields.
2. **Existing Baseline APIs**:
   - `src/app/api/planner/smart-schedule/route.ts` already contains an initial auto-scheduling feasibility and slot-finding algorithm that checks collisions and supports a `confirm: true` batch-commit flag.
   - `src/app/api/reminders/tomorrow/route.ts` already exists to query tomorrow's calendar blocks, tasks, and workouts.
3. **Critical Payload Contract Mismatch Identified**:
   - `src/app/api/reminders/tomorrow/route.ts` currently returns its arrays under a nested `reminders: { blocks, tasks, workouts }` object and lacks `tomorrowPersianDate`, `timeFormatted`, and specific task/workout attributes.
   - Meanwhile, consumers (`src/components/layout/Header.tsx` and `src/app/today/page.tsx`) expect `data.blocks`, `data.tasks`, `data.workouts`, `data.tomorrowPersianDate`, `b.timeFormatted`, `t.area.name`, `w.name`, and `w.focusArea` directly at the top level of the JSON response!
   - This causes the Header Bell and Today widgets to render 0 items even when tomorrow has events.
4. **Planner Route Limitation**:
   - `src/app/api/planner/route.ts`'s `POST` handler hardcodes `new Date()` (today) for `start` and `end`, making it impossible to manually register future events on arbitrary dates through this endpoint without passing date parameters.
5. **Server & Port 3000 Isolation Verified**:
   - Port 3050 is actively running Next.js (`PID 13660`).
   - Port 3000 is running the user's cafe project (`PID 8600`).
   - Both are completely isolated and operating normally.
6. **Codebase Health**:
   - `node node_modules/typescript/bin/tsc --noEmit` exits with 0 errors.
   - Core test suite (`scripts/test-core.mjs`) passes 100%.

---

## 2. Prisma Schema Deep Dive (`prisma/schema.prisma`)

### 2.1 Model Analysis

#### A. `CalendarBlock` (Lines 194–218)
```prisma
model CalendarBlock {
  id                String    @id @default(cuid())
  title             String
  areaId            String?
  area              Area?     @relation(fields: [areaId], references: [id], onDelete: SetNull)
  projectId         String?
  project           Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  taskId            String?
  task              Task?     @relation(fields: [taskId], references: [id], onDelete: SetNull)
  
  start             DateTime
  end               DateTime
  plannedDuration   Int       @default(60) // minutes
  actualDuration    Int       @default(0)
  
  type              String    @default("Deep Work") // Deep Work, Shallow Work, Admin, Learning, Health, Routine, Buffer, Rest, Commute
  dayType           String    @default("روز عادی") // روز طلایی, روز سنگین, روز دانشگاه, روز امتحان, روز بحران, جمعه / CEO Day
  location          String?
  energyRequirement String    @default("medium")
  notes             String?
  recurrence        String?
  status            String    @default("scheduled") // scheduled, in_progress, completed, missed
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```
- **Time Representation**: Exact UTC DateTime for `start` and `end`, allowing minute-level precision for overlap prevention.
- **Classification**: `type` supports all work categories required by the prompt ("Deep Work", "Learning", "Admin", etc.).
- **Relations**: Direct foreign keys to `Task`, `Project`, and `Area`.
- **Status Lifecycle**: `scheduled`, `in_progress`, `completed`, `missed`.
- **Metadata Flexibility**: `notes` can store session numbering (e.g. `جلسه ۱ از ۴`), Persian time strings (`۰۸:۳۰ - ۱۰:۰۰`), or custom tags.

#### B. `Task` (Lines 151–192)
```prisma
model Task {
  id                 String    @id @default(cuid())
  title              String
  description        String?
  areaId             String?
  area               Area?     @relation(fields: [areaId], references: [id], onDelete: SetNull)
  projectId          String?
  project            Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  objectiveId        String?
  objective          Objective?@relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  milestoneId        String?
  milestone          Milestone?@relation(fields: [milestoneId], references: [id], onDelete: SetNull)
  
  priority           String    @default("medium") // urgent, high, medium, low
  urgency            String    @default("normal") // high, normal, low
  eisenhowerQuadrant String    @default("Q2") // Q1: Do, Q2: Schedule, Q3: Delegate, Q4: Eliminate
  workType           String    @default("Deep Work")
  estimatedMinutes   Int       @default(30)
  actualMinutes      Int       @default(0)
  energyRequirement  String    @default("medium")
  
  dueDate            DateTime?
  scheduledStart     DateTime?
  scheduledEnd       DateTime?
  recurrence         String?
  
  status             String    @default("inbox") // inbox, today, next, waiting, delegated, someday, completed
  kanbanColumn       String    @default("Ready")
  
  assignedTo         String?
  waitingFor         String?
  dependencies       String?
  tags               String?
  notes              String?
  isBigThree         Boolean   @default(false)
  completedAt        DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  calendarBlocks     CalendarBlock[]
}
```
- Fully equipped with `dueDate` for deadline-driven auto-scheduling.
- Tracks `workType`, `estimatedMinutes`, `eisenhowerQuadrant`, and `isBigThree`.
- One-to-many relation to `CalendarBlock[]` allows a large task to have multiple scheduling blocks.

#### C. Domain Models: `Book` and `UniversityCourse`
- `Book` (Lines 885–897): Has `title`, `author`, `pages`, `currentPage`, `status`, `notes`. Reading goals can directly compute required hours: `(pages - currentPage) / pagesPerHour`.
- `UniversityCourse` (Lines 841–856) & `UniversityAssignment` (Lines 858–869): Tracks course assignments and exams with `dueDate` and `deepWorkHours`.

### 2.2 Schema Evolution Assessment
- **Do we need new fields or models?**
  - **Conclusion: No new models or schema migrations are needed.**
  - Altering the Prisma schema in SQLite requires running `prisma db push` or migrations, which carries risk of table recreation or altering foreign keys.
  - The existing schema satisfies all needs:
    - Task/Project/Book scheduling -> `CalendarBlock` with `type: "Deep Work" | "Learning"`, `notes: "جلسه X"`, and optional `taskId` / `projectId`.
    - D-1 query -> filtered by `CalendarBlock.start` and `Task.dueDate`.
    - No changes to `prisma/schema.prisma` are necessary.

---

## 3. Existing API Routes & Integration Analysis

### 3.1 Review of `/api/planner/route.ts`
- **Current Behavior**:
  - `GET`: Returns all `CalendarBlock` records ordered by `start asc`. It does not accept date parameters (`?date=...` or `?startDate=...&endDate=...`).
  - `POST`: Contains an architectural limitation:
    ```typescript
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    ```
    Regardless of what the user wants to schedule, it locks the block to "today".
  - `DELETE`: Deletes by `?id=...`.
- **Recommended Enhancements**:
  1. Update `POST` to accept an explicit `date` (e.g. `2026-09-07`) or full `start` / `end` ISO strings, falling back to today only if no date is specified.
  2. Update `GET` to optionally accept `?date=YYYY-MM-DD` or `?from=...&to=...` to support date-specific calendar views without downloading all 300+ blocks.

### 3.2 Review of `/api/planner/smart-schedule/route.ts`
- **Current Baseline Implementation**:
  - Accepts `POST` with payload:
    ```typescript
    interface SmartScheduleRequest {
      title: string;
      category?: "Book" | "Project" | "University" | "Deep Work" | "General";
      totalHours?: number;
      totalPages?: number;
      pagesPerHour?: number;
      deadline: string; // ISO date or YYYY-MM-DD
      sessionDurationMinutes?: number; // e.g. 45, 60, 90
      preferredSlot?: "morning" | "afternoon" | "evening" | "auto";
      confirm?: boolean; // If true, commits directly to DB
    }
    ```
  - Calculates required minutes from `totalHours` or `totalPages / pagesPerHour`.
  - Determines time windows based on Chronotype / Focus Type:
    - **Morning** (08:30 – 12:00): Deep Work, heavy projects.
    - **Afternoon** (15:00 – 18:00): Buffers, general tasks.
    - **Evening** (19:30 – 22:00): Book reading, light learning.
  - Checks collisions against `existingBlocks` and `proposedSessions` to guarantee `Zero Overlap`:
    ```typescript
    const hasCollision = existingBlocks.some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      const cStart = candidateStart.getTime();
      const cEnd = candidateEnd.getTime();
      return cStart < bEnd && cEnd > bStart;
    });
    ```
  - Computes `feasibility`: `FEASIBLE` (100% scheduled), `TIGHT` (>0% scheduled, remaining > 0), or `IMPOSSIBLE` (0% scheduled).
  - Persian advice string generated.
  - If `confirm: true`, creates `CalendarBlock` records in SQLite.
- **Identified Improvement Opportunities**:
  1. **Daily Distribution**: Currently greedily packs up to 3 sessions into day 1 (evening, afternoon, morning) before moving to day 2. An auto-scheduler should preferably distribute 1 session per day across the available horizon unless days are limited, preserving user energy.
  2. **Chronological Ordering**: In the current greedy loop for "Book", it evaluates evening first, then afternoon, then morning, resulting in sessions within day 1 being sequenced backward in time. Sessions within a day should always be ordered chronologically.
  3. **Custom Batch Confirm**: Allow `confirm: true` to accept an optional array of `sessions: [...]` so if the user edits proposed blocks in the preview UI, their modified slots are persisted.

### 3.3 Review of `/api/reminders/tomorrow/route.ts` & Critical Contract Mismatch
- **Current Live Output**:
  ```json
  {
    "success": true,
    "tomorrowDate": "2026-09-06T20:30:00.000Z",
    "summary": {
      "totalItems": 0,
      "blocksCount": 0,
      "tasksCount": 0,
      "workoutsCount": 0
    },
    "reminders": {
      "blocks": [],
      "tasks": [],
      "workouts": []
    }
  }
  ```
- **Consumer Expectations**:
  - `src/components/layout/Header.tsx` (Lines 21–25, 126, 148, 162, 174, 189, 218):
    - Reads: `data.tomorrowPersianDate`
    - Reads: `data.blocks` directly (NOT `data.reminders.blocks`)
    - Reads: `data.tasks` directly (NOT `data.reminders.tasks`)
    - Reads: `data.workouts` directly (NOT `data.reminders.workouts`)
    - In blocks: expects `b.timeFormatted` (e.g. `۰۸:۳۰ - ۱۰:۰۰`)
    - In tasks: expects `t.isBigThree`, `t.area.name`
    - In workouts: expects `w.name`, `w.focusArea`
  - `src/app/today/page.tsx` (Lines 311, 330, 344):
    - Reads: `tomorrowAgenda?.tomorrowPersianDate`
    - Reads: `tomorrowAgenda?.blocks?.map(...)`
    - Reads: `tomorrowAgenda?.tasks?.map(...)`
    - Expects `b.timeFormatted`, `t.area.name`
- **Contract Mismatch Matrix**:

| Expected by UI (`Header.tsx` & `today/page.tsx`) | Provided by `/api/reminders/tomorrow` | Result / Impact |
|---|---|---|
| `data.blocks` | `data.reminders.blocks` | UI receives `undefined`, displays "no events" |
| `data.tasks` | `data.reminders.tasks` | UI receives `undefined`, displays "no tasks" |
| `data.workouts` | `data.reminders.workouts` | UI receives `undefined`, displays "no workouts" |
| `data.tomorrowPersianDate` | Missing (only `tomorrowDate` ISO) | UI falls back to "فردا" |
| `b.timeFormatted` | Missing (only `start` & `end` ISO) | UI renders blank time badge |
| `t.isBigThree` | Missing | Big 3 indicator never activates |
| `t.area.name` | `area: string` | Potential rendering bug if object expected |
| `w.name`, `w.focusArea` | `title`, `duration` | Workout name renders undefined |

- **Remedy**:
  Update `src/app/api/reminders/tomorrow/route.ts` to return both top-level and nested properties (`blocks`, `tasks`, `workouts`, `reminders`), compute `tomorrowPersianDate` using `formatPersianDate(tomorrowStart)`, format `b.timeFormatted`, and include all expected fields.

---

## 4. Server Environment & Port 3050 Verification

### 4.1 Configuration Verification
- `package.json`:
  ```json
  "scripts": {
    "dev": "next dev -p 3050",
    "start": "next start -p 3050",
    "test": "node scripts/test-core.mjs"
  }
  ```
- `scripts/start-server.mjs`:
  ```javascript
  const p = spawn('npx.cmd', ['next', 'dev', '-p', '3050'], ...);
  ```

### 4.2 Live Port Inspection
Verified using Windows PowerShell `Get-NetTCPConnection`:
```
LocalAddress LocalPort  State   OwningProcess
------------ ---------  -----   -------------
::                3050  Listen  13660  (Life OS Next.js Server)
0.0.0.0           3000  Listen   8600  (User's Cafe Server)
```
- **Port 3000 Isolation**: Process `8600` is active and undisturbed. Life OS strictly operates on port `3050`.
- All requests, tests, and API interactions must target `http://localhost:3050`.

---

## 5. Test Infrastructure & Acceptance Criteria

### 5.1 Current Test Infrastructure Status
1. `scripts/test-core.mjs`: Fast, lightweight assert-based unit tests for math and accounting formulas (sleep efficiency, balance sheet, P&L, shop cash register, inventory movement, OKR progress, cash flow neutrality). Exits 0.
2. `scripts/test-e2e-suite.mjs`: Comprehensive 4-tier E2E runner (1509 lines) running against `http://localhost:3050`. Tier 4 Scenario 6 conducts an HTTP 200 sweep of all 20 system routes.
3. `tsc --noEmit`: Passes with 0 TypeScript compilation errors.

### 5.2 Required Automated Tests for Follow-up Acceptance Criteria

To satisfy the follow-up acceptance criteria, the following test coverage should be implemented:

```
┌────────────────────────────────────────────────────────────────────────┐
│              Follow-up Acceptance Criteria Test Suite                  │
├────────────────────────────────┬───────────────────────────────────────┤
│ Acceptance Criterion           │ Test Implementation & Method          │
├────────────────────────────────┼───────────────────────────────────────┤
│ 1. D-1 Advance Reminder Alert  │ - Register a CalendarBlock tomorrow   │
│    (Header bell, Today widget) │ - Register a Task with dueDate=tmrw   │
│                                │ - Query GET /api/reminders/tomorrow   │
│                                │ - Assert summary.totalItems >= 2      │
│                                │ - Assert blocks and tasks contain items│
│                                │ - Assert tomorrowPersianDate populated│
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Zero Overlap Guarantee      │ - Seed a fixed block (08:30-11:30)    │
│    (No time collision)         │ - Request auto-schedule for Deep Work │
│                                │ - Assert for every proposed session S:│
│                                │   !(S.start < B.end && S.end > B.start)│
│                                │ - Assert no session overlaps another  │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Capacity & Session Math     │ - Request: 6 hours, 60-min sessions   │
│    (Exact hour/page coverage)  │ - Assert sessionsCount === 6          │
│                                │ - Assert total duration === 360 min   │
│                                │ - Test Book: 100 pages @ 25 p/h = 4h │
├────────────────────────────────┼───────────────────────────────────────┤
│ 4. 1-Click DB Persistence      │ - POST /api/planner/smart-schedule    │
│    (SQLite database commit)    │   with confirm: true                  │
│                                │ - Query Prisma calendarBlock.findMany │
│                                │ - Assert records exist in SQLite db   │
│                                │ - Query GET /api/planner, assert items│
├────────────────────────────────┼───────────────────────────────────────┤
│ 5. TypeScript & HTTP 200       │ - node node_modules/.../tsc --noEmit  │
│    (Stability & Port 3050)     │ - Fetch all routes & endpoints on 3050│
│                                │ - Assert exit code 0, all HTTP 200    │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 6. Recommendations & Implementation Blueprint

### Step 1: Harmonize `/api/reminders/tomorrow/route.ts`
- Fix payload shape: Return top-level `blocks`, `tasks`, `workouts`, and `tomorrowPersianDate`.
- Include `b.timeFormatted` (e.g. `formatPersianDate` or formatted HH:mm).
- Include `t.isBigThree`, `t.area` (with `id` and `name`).
- Include `w.name` and `w.focusArea`.

### Step 2: Refine `/api/planner/route.ts`
- In `POST`, accept `date` or `start`/`end` ISO strings so future events can be added on any date.
- In `GET`, optionally filter by `?date=YYYY-MM-DD`.

### Step 3: Polish `/api/planner/smart-schedule/route.ts`
- Ensure sessions within each day are placed in chronological order (morning -> afternoon -> evening).
- Add balanced daily distribution (1 session per day until deadline, unless tight).
- Support receiving modified `sessions` in `confirm: true` payload.

### Step 4: Add Automated Validation Script
- Create `scripts/test-scheduler-suite.mjs` verifying:
  - D-1 reminder response structure and count.
  - Zero-overlap mathematical guarantee across 10 randomized test schedules.
  - DB persistence and cleanup.
  - Port 3050 liveness sweep.
