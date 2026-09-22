# Master Execution Plan — Orchestrator Generation 2

## Objective
Execute the full 3-month realistic Life OS usage simulation, fix all incomplete and dead buttons across 17 modules, implement R1-R5 requirements, maintain minimal white `#ffffff` design and port 3050 isolation, achieving 0 TypeScript errors and 100% HTTP 200 OK routes.

---

## Milestone Breakdown & Execution Steps

### Milestone 1: DB Schema & 3-Month Simulation Seeding (Gate Resolution)
- **Problem**: `scripts/simulate-90-days-lifecycle.mjs` desynchronizes `ShopCashRegister` with `Invoice` and `NutritionLog` with `FoodEntry`, and hardcodes KeyResult values, failing `verify-m1-integrity.mjs`.
- **Step 1.1**: Dispatch Worker to update `scripts/simulate-90-days-lifecycle.mjs`:
  - Calculate cash register sales directly from actual seeded invoices per cost center, or delegate/harmonize with relational records.
  - Calculate nutrition logs directly from food entries respecting Atwater equation ($4P + 4C + 9F$).
  - Compute KeyResult values dynamically from actual database aggregations.
  - Verify `simulate-90-days-lifecycle.mjs` executes and subsequent `verify-m1-integrity.mjs` passes 36/36 assertions.
  - Verify `node node_modules/typescript/bin/tsc --noEmit` exits with 0 errors.
- **Step 1.2**: Dispatch 2 Reviewers, 2 Challengers, and 1 Forensic Auditor.
- **Step 1.3**: Complete M1 Gate in `GATE_STATUS.md`.

### Milestone 2: R1 Financial, Register & Inventory Integration
- **Features**: Features 4-9 in PROJECT.md:
  - Products API (`/api/finance/products`) with stock and reorder point status.
  - Multi-Center Cash Register API (`GET/POST /api/finance/cash-register`) & UI for Buffet, Cosmetics, Rayesh. Fix dead `handleSaveCashRegister` button.
  - Link Sales & Quick Capture directly to `Invoice`, `InvoiceItem`, inventory stock deduction, and daily cash register.
  - Low stock & reorder point warning banners.
  - Daily, weekly, monthly cash audit & true gross profit reconciliation (Revenue - COGS).
- **Iteration Loop**: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate check.

### Milestone 3: R2 Calendar, Time-blocking & Deep Work
- **Features**: Features 10-14 in PROJECT.md:
  - Wire `/planner` to `CalendarBlock` DB persistence (`GET/POST/DELETE /api/planner`).
  - Task rescheduling & auto-forwarding uncompleted tasks to next day.
  - Deep work vs shallow work tracking in calendar blocks and summary in `/review` (Night Review).
  - Connect Eisenhower Matrix Q1-Q4 tasks to 90-day OKR Objectives & Key Results.
  - Wire `/routines` checklist steps to `/api/routines` persistence.
- **Iteration Loop**: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate check.

### Milestone 4: R3 Health, Workout Logging & Biometrics
- **Features**: Features 15-18 in PROJECT.md:
  - Live health and sleep data fetching in `/health` and `/sleep` from API.
  - Gym workout logging modal/form in `/health` (exercises, sets, reps, weights, RPE) persisted to Prisma.
  - Rolling 7-day nutrition averages (calories, protein, water).
  - Sleep efficiency & morning energy correlation analysis.
- **Iteration Loop**: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate check.

### Milestone 5: R4 Analytics & R5 Minimal Design Polish
- **Features**: Features 19-23 in PROJECT.md:
  - Minimal white `#ffffff` re-theming of `/analytics` and eliminating `dark` classes / dark slate components.
  - 4 interactive Recharts charts on `/analytics` (Financial trends, Habit completion, Sleep/Energy correlation, OKR burnup).
  - Proactive target deviation warning alerts.
  - Contrast bug fixes across all 17 modules (e.g. invisible icons on buttons).
  - Route redirects `/calendar` -> `/planner` and `/inventory` -> `/finance`.
- **Iteration Loop**: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate check.

### Milestone 6: Final Verification & Audit Acceptance
- **Acceptance Verification**:
  - Full E2E suite (`scripts/test-e2e-suite.mjs`) 100% pass (86/86 assertions).
  - TypeScript typecheck (`node node_modules/typescript/bin/tsc --noEmit`) 0 errors.
  - All 17 routes return HTTP 200 OK on port 3050 (`next dev -p 3050`). Port 3000 untouched.
  - Complete Forensic Audit confirming zero mock/hardcoded facades and authentic database persistence.
  - Submit final victory report to Sentinel.
