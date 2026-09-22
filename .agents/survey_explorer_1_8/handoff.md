# Architectural Survey & Investigation Report: Goals, Today, Big 3, Rollover & Learning-Planner Integration

**Explorer**: `survey_explorer_1_8`  
**Date**: 2026-09-14  
**Working Directory**: `d:/my life/.agents/survey_explorer_1_8`  
**Status**: Comprehensive Investigation Complete (Read-Only Analysis)

---

## 1. Observation

### 1.1 Goals Architecture (`/goals`, `/api/goals`, `/api/goals/daily-dispatcher`)
- **Database Models** (`prisma/schema.prisma` lines 73–122):
  - `Objective`: has `dailyAction` (String?), `dailyDuration` (Int @default(60)), `preferredTimeSlot` (String?), `weeklyDays` (String?), `targetMetric` (String?), `targetValue` (Float?), `currentValue` (Float?), `autoSchedule` (Boolean @default(true)), `progress` (Int @default(0)), relations to `KeyResult[]`, `Project[]`, `Task[]`.
  - `KeyResult`: `metric`, `baseline`, `target`, `currentValue`, `progress`, `objectiveId`.
  - `Task`: has `objectiveId`, `isBigThree` (Boolean @default(false)), `eisenhowerQuadrant` ("Q1".."Q4"), `status` ("inbox", "today", "next", "waiting", "delegated", "someday", "completed"), `dueDate`, `workType`.
- **Goal Creation & Immediate Dispatch** (`src/app/api/goals/route.ts` lines 151–169):
  - When an `Objective` is created via POST, if `dailyAction` is defined and `autoSchedule !== false`, it immediately creates a Task:
    ```typescript
    // src/app/api/goals/route.ts:154-168
    await prisma.task.create({
      data: {
        title: `🎯 [هدف: ${title}] ${dailyAction}`,
        objectiveId: obj.id,
        areaId: areaId || undefined,
        workType: preferredTimeSlot?.includes("عمیق") ? "Deep Work" : "Deep Work",
        eisenhowerQuadrant: priority === "urgent" ? "Q1" : "Q2",
        priority: priority === "urgent" ? "urgent" : "high",
        isBigThree: true,
        status: "today",
        dueDate: today,
        estimatedMinutes: Number(dailyDuration) || 60,
        notes: strategyNotes ? `استراتژی: ${strategyNotes}` : undefined,
      },
    });
    ```
- **Autonomous Daily Dispatcher & Slip Recovery** (`src/app/api/goals/daily-dispatcher/route.ts` lines 20–65, 78–125):
  - `GET /api/goals/daily-dispatcher`:
    - Checks active objectives (`status: "in_progress"`).
    - If no task was created today for this objective, creates one with `isBigThree: true`, `status: "today"`.
    - Detects missed goal tasks: `where: { objectiveId: { not: null }, status: { not: "completed" }, dueDate: { lt: startOfToday } }`.
    - Calculates today's unoccupied candidate windows (`08:30-10:00`, `11:00-12:30`, `14:00-15:30`, `16:30-18:00`, `19:00-20:30`, `21:00-22:30`) against `prisma.calendarBlock`.
    - Returns `availableFreeSlots` (up to 4 empty slots).
  - `POST /api/goals/daily-dispatcher` (lines 128–184):
    - Updates task: `dueDate: new Date(), status: "today", isBigThree: true, eisenhowerQuadrant: "Q1", priority: "urgent"`.
    - Creates `CalendarBlock`: `title: [جبران عقب‌افتادگی هدف] ${task.title}`, `type: "Deep Work"`, `status: "scheduled"`.
- **UI Widget** (`src/components/goals/DailyGoalRecoveryWidget.tsx`):
  - Mounted on both `/today` (`src/app/today/page.tsx:294`) and `/goals` (`src/app/goals/page.tsx:450`).
  - Renders alert with available today's slots and dispatches `reminders-updated` event upon 1-click slot booking.
- **Critical Observed Gaps in Goals Architecture**:
  1. *Progress feedback loop missing*: When a user marks a task completed in `/api/tasks` (`PATCH` lines 77–82), it sets `status: "completed", completedAt: new Date()`. It does **not** update `KeyResult.currentValue` or `Objective.progress`, nor does it record to `DailyReview.big3Completed`.
  2. *Only handles today's recovery*: Slip recovery only looks for today's open slots. It does not handle rolling over to tomorrow.

---

### 1.2 Today Architecture (`/today`, `/api/today`)
- **UI Component** (`src/app/today/page.tsx`):
  - `fetchTasks()` (line 107): calls `GET /api/tasks` and filters:
    ```typescript
    // src/app/today/page.tsx:113
    setTasks(data.tasks.filter((t: any) => t.status === "today" || t.isBigThree));
    ```
  - Big 3 separation: `const big3 = tasks.filter((t) => t.isBigThree);` (line 262).
  - Other tasks: `const otherTasks = tasks.filter((t) => !t.isBigThree);` (line 263).
- **Critical Observed Gaps in Today Architecture**:
  1. *Missing `/api/today` endpoint*:
     - In `src/app/api`, there is **no** `today` folder or `today/route.ts`.
     - `/today/page.tsx` makes multiple client-side requests: `/api/tasks`, `/api/habits`, `/api/goals/daily-dispatcher` (via widget), `/api/health`.
     - Requirement R3 in `ORIGINAL_REQUEST.md` (line 117) explicitly requires `/api/today` for the automated test suite.
  2. *Hardcoded Timeline Blocks* (`src/app/today/page.tsx` lines 622–630):
     - The "جدول زمانی و بلوک‌های تمرکز امروز" section renders a **hardcoded static array**:
       ```typescript
       // src/app/today/page.tsx:623-630
       {[
         { time: "۰۶:۰۰ - ۰۷:۰۰", title: "روتین بیداری، هیدراتاسیون، صبحانه و فعال‌سازی زیستی", type: "Health", badge: "badge-health" },
         { time: "۰۸:۰۰ - ۱۰:۳۰", title: "بلوک کار عمیق ۱: توسعه سیستم و کدنویسی پروژه شرکت رایش", type: "Deep Work", badge: "badge-deep-work" },
         { time: "۱۱:۰۰ - ۱۳:۳۰", title: "مدیریت بوفه باشگاه، سرو شیک‌های پروتئینی و بررسی انبار", type: "Admin", badge: "badge-admin" },
         { time: "۱۴:۰۰ - ۱۵:۰۰", title: "ناهار غنی از پروتئین و استراحت کوتاه", type: "Rest", badge: "badge-health" },
         { time: "۱۶:۰۰ - ۱۸:۰۰", title: "سرکشی به فروشگاه لوازم آرایشی، فاکتورها و چیدمان استند نوتروژینا", type: "Admin", badge: "badge-admin" },
         { time: "۱۸:۳۰ - ۲۰:۰۰", title: "تمرین سنگین بدنسازی در باشگاه (زیربغل و سرشانه)", type: "Health", badge: "badge-health" },
         { time: "۲۱:۰۰ - ۲۲:۰۰", title: "بستن دخل روزانه بوفه و فروشگاه آرایشی در Life OS", type: "Admin", badge: "badge-admin" },
         { time: "۲۲:۰۰ - ۲۲:۴۵", title: "روتین شبانه، ژورنال ۳ سؤاله و خاموشی", type: "Routine", badge: "badge-shallow-work" },
       ]}
       ```
     - It does **not** fetch today's `CalendarBlock` records from SQLite! Newly created blocks (from auto-scheduler, goal dispatcher, or planner) do not appear here.

---

### 1.3 Rollover Mechanism (`/planner`, `/today`, `/api/tasks`)
- **Current Task Forwarding Logic** (`src/app/api/tasks/route.ts` lines 49–66):
  ```typescript
  // src/app/api/tasks/route.ts:50-65
  if (body.action === "auto_forward") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const forwarded = await prisma.task.updateMany({
      where: {
        status: { not: "completed" },
        dueDate: { lt: today },
      },
      data: {
        dueDate: new Date(),
        status: "today",
      },
    });

    return NextResponse.json({ success: true, forwardedCount: forwarded.count });
  }
  ```
- **Observations on Rollover Limitations**:
  1. *Direction is past -> today only*: There is **no** mechanism to roll over today's unfinished tasks to **tomorrow** (or next day).
  2. *No Calendar Slot Allocation*: When tasks are forwarded, they only get `status = "today"`. No `CalendarBlock` is proposed, no time slot is calculated, and no capacity check is performed.
  3. *Planner Page Absence*: In `src/app/planner/page.tsx`, there is no drawer, sidebar, or button to view unfinished/rollover tasks and insert them into empty timeline gaps.
  4. *Today Page Absence*: In `src/app/today/page.tsx`, at the end of the day or when preparing for tomorrow, there is no button or prompt to "انتقال وظایف ناتمام به فردا و تخصیص اسلات تقویم".

---

### 1.4 Learning Architecture (`/learning`, `/api/learning`, Planner Integration)
- **Database Models** (`prisma/schema.prisma` lines 924–989):
  - `UniversityCourse`: `code` (unique), `title`, `instructor`, `credits`, `semester`, `targetGrade`, `actualGrade`, `daysOfWeek` ("شنبه، دوشنبه"), `startTime` ("08:00"), `endTime` ("10:00"), `location`, `notes`.
  - `UniversityAssignment`: `courseId`, `title`, `dueDate`, `weight`, `status`, `score`.
  - `UniversityExam`: `courseId`, `title`, `examDate`, `room`, `weight`, `score`.
  - `UniversityEvent`: `courseId`, `title`, `type` ("تکلیف", "امتحان", "ارائه", "پروژه", "کوئیز", "کلاس جبرانی", "آزمایشگاه", "سایر"), `dueDate`, `time`, `location`, `weight`, `priority`, `status`.
- **Learning API** (`src/app/api/learning/route.ts` lines 105–162):
  - When an event is created via `POST /api/learning` with `type === "event"`:
    1. It creates `UniversityEvent`.
    2. It creates a `Task` with:
       - `title`: `[دانشگاه: ${course?.title || "درس"}] ${event.type}: ${event.title}`
       - `areaId`: university area
       - `priority`: `event.priority === "high" ? "urgent" : "medium"`
       - `eisenhowerQuadrant`: `event.priority === "high" ? "Q1" : "Q2"`
       - `workType`: `"Learning"`
       - `status`: `"next"`
       - `kanbanColumn`: `"Ready"`
       - `dueDate`: `parsedDueDate`
- **Critical Observed Gaps in Learning Architecture**:
  1. *Blindness in `/api/planner`*:
     - `src/app/api/planner/route.ts` (lines 61–65) queries **only** `prisma.calendarBlock.findMany()`.
     - It does **not** query `UniversityCourse` (recurring classes on that weekday) or `UniversityEvent` / `UniversityExam` (exams/deadlines on that date).
     - Result: In `/planner/page.tsx`, on days with classes (e.g. Saturday/Monday 08:00–10:00), the calendar shows empty time! The Smart Scheduler could schedule a 2-hour Deep Work block during a university lecture because `existingBlocks` does not include course hours.
  2. *Status `"next"` hides events from `/today`*:
     - `POST /api/learning` creates tasks with `status: "next"`.
     - `/today/page.tsx` line 113 filters `t.status === "today" || t.isBigThree`.
     - Result: Even if an assignment or exam has `dueDate` equal to today, it will **not** appear in `/today` unless explicitly updated to `status: "today"` or `isBigThree: true`!
  3. *No `CalendarBlock` creation*:
     - Neither creating a course nor creating an event generates any `CalendarBlock`.
  4. *Exams not elevated to Big 3*:
     - In `src/app/api/reminders/tomorrow/route.ts` line 159, tomorrow's reminders already note: `isBigThree: ev.type.includes("امتحان") || ev.type.includes("ارائه")`. But in `/api/learning` and `/api/tasks`, exams are not set to `isBigThree: true`.

---

### 1.5 Missing API Endpoints Audit (from `ORIGINAL_REQUEST.md`)
The follow-up request specifically specifies the following API endpoints to be validated via automated test suite (`ORIGINAL_REQUEST.md` line 117):
> `/api/dashboard, /api/today, /api/goals, /api/projects, /api/tasks, /api/finance, /api/reviews/daily, /api/learning, /api/calendar, /api/analytics`

| Endpoint in Request | Current Codebase Status | Existing Location / File | Action Required |
|---------------------|-------------------------|--------------------------|-----------------|
| `/api/today` | **Missing** | None (split across `/api/tasks`, `/api/habits`) | Create `src/app/api/today/route.ts` |
| `/api/calendar` | **Missing** | Handled at `/api/planner/route.ts` | Create `src/app/api/calendar/route.ts` (or proxy/forward to `/api/planner`) |
| `/api/dashboard` | **Missing** | Rendered only server-side in `dashboard/page.tsx` | Create `src/app/api/dashboard/route.ts` |
| `/api/reviews/daily` | **Missing** | Handled at `/api/reviews/route.ts` | Create `src/app/api/reviews/daily/route.ts` (forwarder to `/api/reviews`) |
| `/api/finance` | **Missing Root** | Only sub-routes exist (`accounting`, `cash-register`, etc.) | Create `src/app/api/finance/route.ts` root aggregator |
| `/api/goals` | **Present** | `src/app/api/goals/route.ts` | Complete |
| `/api/projects` | **Present** | `src/app/api/projects/route.ts` | Complete |
| `/api/tasks` | **Present** | `src/app/api/tasks/route.ts` | Complete |
| `/api/learning` | **Present** | `src/app/api/learning/route.ts` | Enhance with Task/Calendar sync |
| `/api/analytics` | **Present** | `src/app/api/analytics/route.ts` | Complete |

- **TypeScript Compilation Health**:
  - Command: `node node_modules/typescript/bin/tsc --noEmit`
  - Result: **Exit code 0, 0 errors**.

---

## 2. Logic Chain

```
[Observation 1.1: Objective.dailyAction & autoSchedule]
        │
        ▼ (Generates Task with isBigThree: true and status: today)
[Observation 1.2: Today Page Big 3 Filter]
        │
        ├────────────────────────────────────────┐
        ▼ (Task completed by user)               ▼ (Task NOT completed by end of day)
[Observation 1.1: Task PATCH in /api/tasks]    [Observation 1.3: Task left in status: today / dueDate: today]
        │                                                │
        ▼ (Gaps)                                         ▼ (Gaps)
- Objective.progress NOT updated               - No auto-rollover to tomorrow
- KeyResult.currentValue NOT updated           - No empty slot suggestions in tomorrow's planner
- DailyReview.big3Completed NOT updated        - Existing auto_forward only moves past -> today
                                                         │
                                                         ▼
                                               [Rollover Engine Required]
                                               - Detect unfinished tasks from today
                                               - Check tomorrow's CalendarBlocks
                                               - Zero-overlap slot recommendation
                                               - 1-click rollover to tomorrow's Big 3 & Calendar
```

```
[Observation 1.4: UniversityCourse with daysOfWeek & UniversityEvent with dueDate]
        │
        ▼
[POST /api/learning creates UniversityEvent + Task]
        │
        ├────────────────────────────────────────┐
        ▼ (Task created with status: "next")     ▼ (No CalendarBlock created)
[Observation 1.2: /today filters status: today]  [Observation 1.4: /api/planner only reads CalendarBlock]
        │                                                │
        ▼ (Gaps)                                         ▼ (Gaps)
- Event due today is INVISIBLE on /today       - Recurring classes INVISIBLE on /planner
- Exams NOT elevated to isBigThree             - Capacity engine schedules over class hours
- User misses deadline on daily view           - Calendar timeline displays blank on lecture days
                                                         │
                                                         ▼
                                               [Harmonization Required]
                                               1. If event dueDate is today -> status = "today"
                                               2. If event is Exam/Presentation -> isBigThree = true
                                               3. /api/planner GET must include:
                                                  - CalendarBlocks
                                                  - Recurring course classes for that weekday
                                                  - University events/exams for that date
                                               4. /today timeline must query DB blocks, not hardcoded!
```

---

## 3. Schema & API Changes Required

### 3.1 Database Schema Evaluation
The existing Prisma schema (`prisma/schema.prisma`) already possesses rich relational fields:
- `Objective` has `dailyAction`, `dailyDuration`, `preferredTimeSlot`, `autoSchedule`, `progress`, `keyResults`, `tasks`.
- `Task` has `objectiveId`, `isBigThree`, `eisenhowerQuadrant`, `status`, `dueDate`, `workType`, `kanbanColumn`.
- `CalendarBlock` has `start`, `end`, `plannedDuration`, `type`, `taskId`, `notes`.
- `UniversityCourse` has `daysOfWeek`, `startTime`, `endTime`, `location`.
- `UniversityEvent` has `type`, `dueDate`, `time`, `location`, `priority`, `status`.
- `DailyReview` has `big3Completed`, `deepWorkHours`, `productivityScore`.

**No breaking database migration is required.** All enhancements can be achieved via clean API and service logic using existing tables.

### 3.2 New & Enhanced API Specifications

#### A. Dedicated `/api/today` (GET, POST, PATCH)
- **Path**: `src/app/api/today/route.ts`
- **GET Response**:
  ```typescript
  {
    success: true,
    date: string, // YYYY-MM-DD
    persianDate: string,
    summary: {
      big3Total: number,
      big3Completed: number,
      totalTasks: number,
      completedTasks: number,
      habitsDone: number,
      habitsTotal: number,
      deepWorkMinutes: number
    },
    big3Tasks: Array<Task & { area: Area, objective: Objective }>,
    otherTasks: Array<Task & { area: Area }>,
    calendarBlocks: Array<CalendarBlock & { timeFormatted: string }>, // REAL DB BLOCKS + TODAY'S CLASSES
    habits: Array<Habit & { todayDone: boolean, streak: number }>,
    missedGoalTasks: Array<Task>,
    tomorrowPreview: { totalItems: number, blocksCount: number, tasksCount: number }
  }
  ```
- **POST Action**:
  - Quick-add task for today with Eisenhower quadrant, Big 3 toggle, and optional direct calendar slot reservation.
- **PATCH Action**:
  - Toggle task completion: if task has `objectiveId`, optionally increments KR or recalculates Objective progress; if `isBigThree`, updates today's `DailyReview.big3Completed`.

#### B. Dedicated `/api/calendar` (GET, POST, DELETE)
- **Path**: `src/app/api/calendar/route.ts`
- Direct compatibility alias / wrapper for `/api/planner`:
  - **GET**: Accepts `?date=YYYY-MM-DD` or `?startDate=...&endDate=...`. Returns consolidated blocks (including recurring university classes matching the Persian weekday and university exam deadlines).
  - **POST**: Creates a `CalendarBlock` (supporting `date`, `startTime`, `endTime`, `title`, `type`).
  - **DELETE**: Deletes a `CalendarBlock` by `?id=...`.

#### C. Unfinished Tasks Rollover Endpoint `/api/tasks/rollover`
- **Path**: `src/app/api/tasks/rollover/route.ts`
- **GET `?targetDate=YYYY-MM-DD` (defaults to tomorrow)**:
  - Fetches incomplete tasks where `dueDate <= today` or `status === "today"` and `status !== "completed"`.
  - Analyzes existing `CalendarBlock`s and university classes on `targetDate`.
  - Calculates candidate non-overlapping free slots (e.g. `08:30-10:00`, `11:00-12:30`, `14:00-15:30`, `16:30-18:00`).
  - Returns:
    ```typescript
    {
      success: true,
      targetDate: string,
      targetPersianDate: string,
      unfinishedTasksCount: number,
      unfinishedTasks: Array<Task & { objective?: Objective }>,
      suggestedSlots: Array<{
        id: string,
        label: string,
        startTime: string,
        endTime: string,
        startIso: string,
        endIso: string,
        durationMinutes: number
      }>
    }
    ```
- **POST**:
  - Request body:
    ```typescript
    {
      taskIds: string[],
      targetDate: string, // YYYY-MM-DD (tomorrow)
      assignToSlot?: {
        taskId: string,
        startIso: string,
        endIso: string
      },
      keepBigThree?: boolean
    }
    ```
  - Updates `Task.dueDate` to `targetDate`.
  - If `assignToSlot` is provided, creates a `CalendarBlock` in that free slot.
  - Emits `reminders-updated` event.

#### D. Unified Course & Event Synchronization in `/api/learning` & `/api/planner`
- In `src/app/api/learning/route.ts`:
  - When `type === "event"`:
    - If `dueDate` is today (`startOfToday <= dueDate <= endOfToday`), set `status: "today"` instead of `"next"`.
    - If `type` includes "امتحان" or "ارائه", set `isBigThree: true` and `priority: "urgent"`.
    - Create a corresponding `CalendarBlock` on `dueDate` at `time` (default 90 min) with `type: "Learning"`.
- In `src/app/api/planner/route.ts`:
  - When `GET` is called for `dateParam`:
    - Determine Persian weekday of `dateParam` (e.g. "شنبه").
    - Query `prisma.universityCourse.findMany()` where `daysOfWeek.includes(weekday)`.
    - Query `prisma.universityEvent.findMany()` where `dueDate` matches `dateParam`.
    - Merge virtual blocks into `blocks` so `/planner` displays class schedules and exam deadlines automatically!

#### E. Forwarder / Aggregator Endpoints for E2E Suite Compliance
- `/api/dashboard/route.ts`: Aggregates active 90-day cycle, Big 3 tasks, accounts balance, low-stock products, latest sleep, today's cash register.
- `/api/finance/route.ts`: Root aggregator combining accounts, cash registers, fixed expenses, transactions.
- `/api/reviews/daily/route.ts`: Proxies GET/POST to `src/app/api/reviews/route.ts`.

---

## 4. UI Changes Required

### 4.1 `/today` Page (`src/app/today/page.tsx`)
1. **Replace Hardcoded Timeline with Live DB Blocks**:
   - Remove the static mock array (lines 622–630).
   - Fetch today's blocks from `/api/today` (or `/api/planner?date=today`).
   - Render real `CalendarBlock` items with time, title, type badge, and status.
2. **Rollover Action Banner / Drawer**:
   - When unfinished tasks exist in today's list, display an actionable banner:
     *"۲ اقدام طلایی انجام‌نشده باقی مانده است. آیا مایلید به برنامه فردا منتقل شده و در اسلات‌های خالی تقویم قرار گیرند؟"*
   - Button: `انتقال خودکار کارهای انجام‌نشده به فردا (Rollover)`.
   - On click, opens a modal or confirms batch rollover with auto-allocation to tomorrow's calendar slots.
3. **Goal Task Connection Badge**:
   - If a task is linked to an Objective (`task.objectiveId`), display a clean badge: `🎯 [هدف: ...]`.
   - Clicking it navigates to `/goals`.

### 4.2 `/planner` Page (`src/app/planner/page.tsx`)
1. **University Schedule & Events Overlay**:
   - When viewing any date, automatically display recurring course classes (e.g. "شنبه، دوشنبه" 08:00–10:00) with a distinct `badge-university` style.
   - Display university exams/deadlines in a dedicated alert row or timeline block.
2. **Rollover & Unscheduled Tasks Dock**:
   - Add an expandable side-drawer or bottom bar: "تسک‌های معوق و بدون زمان‌بندی".
   - Lists incomplete tasks from previous days or today.
   - 1-click button: "تخصیص هوشمند به اولین اسلات خالی امروز/فردا".

### 4.3 `/goals` Page (`src/app/goals/page.tsx`)
1. **Daily Action Execution Tracker**:
   - In each Goal card, display today's status of its `dailyAction`:
     - `تکمیل شد` (Green checkmark if today's dispatched task is completed).
     - `در انتظار اجرا در امروز` (Blue pulse if dispatched and pending).
     - `عقب‌افتاده از دیروز` (Amber alert with 1-click recovery button).

### 4.4 `/learning` Page (`src/app/learning/page.tsx`)
1. **Sync Badges on Events & Schedule**:
   - Add an indicator to events: *"همگام‌شده با تقویم روزانه و اقدامات ۳گانه"*.
   - When creating an exam or assignment, confirm that a calendar slot and today/tomorrow reminder was established.

---

## 5. Recommendations for Implementation Milestones

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION ROADMAP                          │
├────────────────────────────────────────────────────────────────────────┤
│ M1: API Harmonization & Bridge Routes                                  │
│     - Create /api/today/route.ts                                       │
│     - Create /api/calendar/route.ts (proxy to planner)                 │
│     - Create /api/dashboard/route.ts, /api/finance/route.ts            │
│     - Create /api/reviews/daily/route.ts                               │
├────────────────────────────────────────────────────────────────────────┤
│ M2: Goals-to-Today Big 3 & Live DB Timeline Synchronization            │
│     - Connect /today to live DB CalendarBlocks                         │
│     - Link Task completion to Objective/KR progress & DailyReview      │
│     - Enforce Big 3 golden action indicators                           │
├────────────────────────────────────────────────────────────────────────┤
│ M3: Rollover Engine & Calendar Slot Allocation                         │
│     - Implement /api/tasks/rollover (GET candidate slots, POST commit) │
│     - Add Rollover Assistant modal & banner to /today and /planner     │
│     - Auto-schedule uncompleted tasks into tomorrow's free slots       │
├────────────────────────────────────────────────────────────────────────┤
│ M4: Learning Module Deep Integration                                   │
│     - Inject university classes into /api/planner & /api/today         │
│     - Auto-elevate exams to isBigThree on exam date and D-1            │
│     - Sync university events into CalendarBlock upon creation          │
├────────────────────────────────────────────────────────────────────────┤
│ M5: Universal E2E Test Suite & Verification                            │
│     - Execute comprehensive E2E test suite across all 10 endpoints     │
│     - Verify clean build (tsc --noEmit exit 0)                         │
│     - Confirm Port 3050 stability and Port 3000 isolation             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Caveats

1. **Local System Date & Timezone**:
   - SQLite dates are stored in UTC ISO format. The application runs in Iran Standard Time (`UTC+03:30`). All date boundary comparisons (`00:00:00` to `23:59:59`) must compute using local date values (`getFullYear()`, `getMonth()`, `getDate()`) to prevent midnight UTC boundary misalignments.
2. **Read-Only Investigation Role**:
   - As an explorer subagent, this investigation modified **no** source code or database records. All findings reflect the exact current state of the workspace.
3. **Capacity Engine Non-Collision Rule**:
   - When adding recurring university classes into the calendar stream, the Auto-Scheduler (`src/lib/capacity-engine.ts` and `/api/planner/smart-schedule`) must consider university classes as non-negotiable fixed blocks, equivalent to gym shifts or sleep hours.

---

## 7. Conclusion

The Life OS platform has a well-structured foundation in Prisma, with working models for Objectives, Tasks, CalendarBlocks, and University entities. However, three critical functional disconnects currently prevent seamless daily flow:
1. **Goals -> Today**: While the daily dispatcher can create tasks, `/today` renders a static hardcoded timeline rather than querying DB blocks, and completing tasks does not ripple back to Goal/KR progress.
2. **Rollover**: Only past-due tasks can be forwarded to "today" without slot allocation; no mechanism exists to roll today's uncompleted tasks forward to tomorrow or calculate empty calendar slots in `/planner` and `/today`.
3. **Learning -> Planner**: University course schedules and events exist in isolation; they do not appear in `/planner` or `/today`'s schedule, and tasks are created with status `"next"`, making them invisible on `/today`.
4. **Missing Endpoints**: `/api/today`, `/api/calendar`, `/api/dashboard`, `/api/finance`, and `/api/reviews/daily` must be instantiated to satisfy the universal E2E test suite contract.

Resolving these through the 5 recommended milestones will complete the end-to-end integration and satisfy all requirements of the user request.

---

## 8. Verification Method

### 8.1 TypeScript Typecheck
To independently verify that the codebase remains completely free of syntax and type errors:
```powershell
node node_modules/typescript/bin/tsc --noEmit
```
*Pass condition*: Exit code 0, 0 errors.

### 8.2 Endpoint Availability Verification
Once the milestone routes are implemented, verify all 10 endpoints return HTTP 200 OK:
```powershell
node -e "
const endpoints = [
  'http://localhost:3050/api/dashboard',
  'http://localhost:3050/api/today',
  'http://localhost:3050/api/goals',
  'http://localhost:3050/api/projects',
  'http://localhost:3050/api/tasks',
  'http://localhost:3050/api/finance',
  'http://localhost:3050/api/reviews/daily',
  'http://localhost:3050/api/learning',
  'http://localhost:3050/api/calendar',
  'http://localhost:3050/api/analytics'
];
Promise.all(endpoints.map(u => fetch(u).then(r => console.log(r.status, u))))
"
```

### 8.3 Invalidation Conditions
This analysis would be invalidated if:
- Prisma schema is radically refactored with new non-nullable fields.
- The project moves away from Next.js App Router API route conventions.
