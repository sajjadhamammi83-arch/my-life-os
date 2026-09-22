# Master Orchestration Plan — Intelligent Life OS Auto-Scheduler

## Objective
Implement and verify the complete Intelligent Life OS Auto-Scheduler (سیستم فوق‌هوشمند زمان‌بندی خودکار تقویم) satisfying R1 (D-1 Advance Reminders & Tomorrow's Agenda), R2 (Intelligent Capacity & Feasibility Engine), R3 (Interactive UI & 1-Click Calendar Registration), and R4 (Visual Standards & Stability on port 3050).

## Execution Strategy (Project Pattern)

### Step 1: Survey (Phase 0)
Dispatch 3 parallel Explorers:
- **Explorer 1 (Calendar & Data Layer)**: Schema, models (CalendarBlock, Task, Event), DB queries, API endpoints for calendar/events, existing routines and shifts (gym, cosmetics, rayesh, university).
- **Explorer 2 (UI & Reminders)**: Header Bell component, notification badges, `/dashboard`, `/today`, `/planner` pages and existing widgets.
- **Explorer 3 (Scheduler Logic & Capacity Requirements)**: Algorithm design for chronotype/energy matching (deep work vs shallow work), capacity deduction (sleep, workouts, shifts), feasibility scoring, and preview modal.

### Step 2: Architecture & Milestones (Phase 1)
Synthesize Explorer reports into `PROJECT.md` and `TEST_INFRA.md`:
- Feature Inventory mapping all requirements to milestones.
- Milestone decomposition:
  - M1: D-1 Advance Reminder Engine & Header Bell / Tomorrow Agenda Widgets (`/dashboard`, `/today`).
  - M2: Capacity & Feasibility Engine + Energy / Chronotype Slot Allocation Algorithm (Core Logic + API).
  - M3: Interactive UI Assistant & 1-Click Calendar Registration Modal in `/planner` & `/dashboard`.
- Parallel E2E Test Suite design (Tiers 1-4).

### Step 3: Execution Loop (Phase 2)
Per milestone:
- Explorer -> Worker -> Reviewer -> Challenger -> Auditor gate check.
- In parallel, E2E Test Writer establishes automated test suites.

### Step 4: Verification & Acceptance (Phase 3)
- Execute complete E2E test suite (100% pass).
- Validate zero overlap, full persistence in SQLite, correct page/hour coverage.
- Validate `tsc --noEmit` passes with 0 errors.
- Confirm all routes return 200 on port 3050.

### Step 5: Handoff & Reporting (Phase 4)
- Compile final handoff report and notify parent sentinel.
