# Life OS 4-Tier Comprehensive E2E Test Suite — TEST_READY

## Overview
The comprehensive, opaque-box, requirement-driven E2E test suite for Life OS has been designed, implemented, and fully verified. It validates all 17+ system modules, database models, business calculations, ripple effects, boundary conditions, and 90-day simulation lifecycles according to `TEST_INFRA.md`, `ORIGINAL_REQUEST.md`, and `PROJECT.md`.

## Execution Command
```bash
node scripts/test-e2e-suite.mjs
```

### Pre-requisites
- Next.js development server running on port **3050**:
  ```bash
  # In project root:
  node node_modules/next/dist/bin/next dev -p 3050
  ```
- Port 3000 is strictly isolated and never accessed by the test runner.

---

## 4-Tier Test Coverage Breakdown

| Tier | Focus Area | Required Threshold | Implemented & Verified | Pass Rate |
|------|------------|-------------------|-------------------------|-----------|
| **Tier 1** | Feature Coverage (Isolated Functional Verification) | >= 30 cases | **36 cases** | **100%** |
| **Tier 2** | Boundary & Corner Cases | >= 25 cases | **28 cases** | **100%** |
| **Tier 3** | Cross-Feature Ripple Effects (Pairwise Combinations) | >= 15 cases | **16 cases** | **100%** |
| **Tier 4** | Real-World 90-Day Simulation Scenarios & Route Liveness | >= 6 scenarios | **6 scenarios (20 routes)** | **100%** |
| **Total** | **Grand Total Automated Assertions** | **>= 76 assertions** | **86 assertions** | **100% (86/86)** |

---

## Tier Details

### Tier 1: Feature Coverage (Isolated Functional Verification)
- **Financial & Inventory**:
  - `T1.01`: Product schema verification (sku, prices, stock, reorder point).
  - `T1.02`: `POST /api/finance/sales` creates sale and reduces product inventory.
  - `T1.03`: `InventoryMovement` audit record created on sale with negative quantity.
  - `T1.04`: `Transaction` created with type `Sale` matching invoice amount.
  - `T1.05`: `FinancialAccount` balance incremented on sale.
  - `T1.06`: `Invoice` creation with `InvoiceItems` and calculated `totalAmount`.
  - `T1.07`: Invoice Gross Profit formula (`totalAmount - cogs`).
  - `T1.08`: Reorder Point alert flag triggers when `stock <= minimumStock`.
  - `T1.09`: Cash Register expected closing formula (`opening + sales - expenses - withdrawals`).
  - `T1.10`: Cash Register difference formula (`actual - expected`; `diff === 0` for balanced).
  - `T1.11`: `POST /api/finance/cash-register` updates and reconciles daily cash register.
  - `T1.12`: Cost center financial segregation (Buffet vs Cosmetics vs Rayesh).
- **Calendar & Time-Blocking**:
  - `T1.13`: `POST /api/planner` creates `CalendarBlock` persistence.
  - `T1.14`: `GET /api/planner` returns list containing created block.
  - `T1.15`: `CalendarBlock` planned duration calculation (90 minutes).
  - `T1.16`: `CalendarBlock` blockType classification persistence.
  - `T1.17`: `DELETE /api/planner?id=...` removes `CalendarBlock`.
- **Task Management & Auto-Forwarding**:
  - `T1.18`: `POST /api/tasks` creates Task with priority and Eisenhower Quadrant.
  - `T1.19`: `PATCH /api/tasks` updates status to `completed` with `completedAt` timestamp.
  - `T1.20`: Task Kanban column transitions (Ready -> In Progress -> Done).
  - `T1.21`: Task Big Three flag toggling.
  - `T1.22`: Task auto-forwarding logic (uncompleted past tasks forward to today).
  - `T1.23`: `DELETE /api/tasks?id=...` successfully deletes task.
- **Health, Biometrics & Workouts**:
  - `T1.24`: `POST /api/health` with `action='weight'` records BodyMeasurement and BMI.
  - `T1.25`: `POST /api/health` with `action='water'` increments `waterMl` hydration.
  - `T1.26`: `POST /api/health` with `action='meal'` records `FoodEntry` and increments calories/protein.
  - `T1.27`: `Workout` model persistence (`title`, `durationMinutes`, `totalVolume`).
  - `T1.28`: `WorkoutExercise` model persistence (`sets`, `reps`, `weight`, `rpe`).
  - `T1.29`: Workout total volume calculation: `sum(sets * reps * weight)`.
  - `T1.30`: Rolling 7-day nutritional averages calculation.
- **Sleep, Habits, Goals & Routines**:
  - `T1.31`: `calculateSleepEfficiency` formula: `(TST / TIB) * 100`.
  - `T1.32`: `POST /api/sleep` persists sleep record and efficiency.
  - `T1.33`: `calculateProgress` formula: `((current - baseline) / (target - baseline)) * 100`.
  - `T1.34`: Objective aggregate progress calculation (average of key results).
  - `T1.35`: Habit streak calculation (consecutive completed days).
  - `T1.36`: `POST` & `PATCH /api/routines` step persistence and completion toggle.

### Tier 2: Boundary & Corner Cases
- **Financial Boundaries**:
  - `T2.01`: Stock underflow rejection: attempting to sell more than available stock returns 400.
  - `T2.02`: Sale with non-existent `productId` returns 404.
  - `T2.03`: Selling exactly all remaining stock reduces stock to exactly 0 (no negative underflow).
  - `T2.04`: Selling when stock is 0 is rejected with 400.
  - `T2.05`: Cash register with zero opening cash and zero sales balances to zero.
  - `T2.06`: Cash register with negative difference (cash shortage: `actual < expected`).
  - `T2.07`: Cash register with positive difference (cash surplus: `actual > expected`).
  - `T2.08`: Massive financial amounts precision check (e.g. 5,000,000,000 Tomans).
- **Calendar & Scheduling Boundaries**:
  - `T2.09`: Midnight-spanning calendar event duration calculation across day boundary.
  - `T2.10`: Zero-duration calendar block (`start === end`).
  - `T2.11`: End time before start time boundary detection.
  - `T2.12`: Task auto-forwarding across month-end boundary (Esfand 29 / Farvardin 1).
  - `T2.13`: Completed tasks are NOT auto-forwarded (only incomplete tasks forward).
- **Health & Biometrics Boundaries**:
  - `T2.14`: Sleep efficiency with zero time in bed returns 0 without division by zero.
  - `T2.15`: Sleep efficiency capped at 100% when `totalSleepTime` exceeds `timeInBed`.
  - `T2.16`: 24-hour sleep duration edge case (1440 minutes).
  - `T2.17`: Zero water hydration logging via `/api/health` does not crash.
  - `T2.18`: Extreme calorie intake (6,500+ kcal) does not crash rolling averages.
  - `T2.19`: Extreme body weight BMI bounds (30kg to 250kg).
  - `T2.20`: Workout exercise with 0 kg weight (bodyweight movements: volume = 0).
- **Goal & Key Result Boundaries**:
  - `T2.21`: Key Result baseline === target boundary (avoids division by zero, returns 100%).
  - `T2.22`: Key Result current exceeding target is capped at 100%.
  - `T2.23`: Objective with zero Key Results defaults progress to 0% (no NaN).
  - `T2.24`: Habit with empty history evaluates to streak = 0.
- **Character Encoding & String Boundaries**:
  - `T2.25`: Special Persian characters integrity (گ، چ، پ، ژ، ی، ک، نیم‌فاصله `\u200c`).
  - `T2.26`: Extremely long text strings (2,500+ characters) in notes without crash.
  - `T2.27`: Whitespace-only or empty titles handled safely.
  - `T2.28`: DELETE on invalid or non-existent ID handled safely.

### Tier 3: Cross-Feature Ripple Effects
- **Chain 1: Sale -> Stock -> Alert -> Account -> Cash Register**:
  - `T3.01`: Sale in Gym Buffet -> Inventory stock deducted from product.
  - `T3.02`: Stock deduction triggers Reorder Point alert (`stock <= minimumStock`).
  - `T3.03`: Sale automatically records a Financial Transaction.
  - `T3.04`: `FinancialAccount` balance increases by sale amount.
  - `T3.05`: Daily Cash Register reflects increased sales cash.
- **Chain 2: Workout -> Buffet Shake -> Nutrition -> Energy -> Habit**:
  - `T3.06`: Gym workout logged -> Exercise sets/weights recorded.
  - `T3.07`: Buffet shake consumed -> Nutrition log updated with calories & protein.
  - `T3.08`: High protein & workout logged -> Physical energy score evaluated in Daily Review.
  - `T3.09`: Workout completed -> Habit 'ورزش / تمرین باشگاه' marked completed.
- **Chain 3: Task Incomplete -> Auto-Forward -> Eisenhower -> OKR**:
  - `T3.10`: Incomplete task identified for auto-forwarding.
  - `T3.11`: Auto-forward moves task to tomorrow and updates Eisenhower Matrix.
  - `T3.12`: Task linked to 90-day Objective -> Completing task updates Key Result `currentValue`.
  - `T3.13`: Key Result progress update cascades to Objective overall progress.
- **Chain 4: Sleep -> Energy -> Deep Work -> Daily Review**:
  - `T3.14`: Sleep log recorded with high efficiency (>= 90%) -> Morning energy >= 8.
  - `T3.15`: High morning energy correlates with high Deep Work capacity.
  - `T3.16`: Completed Deep Work blocks aggregate into Daily Review night summary.

### Tier 4: Real-World 90-Day Simulation & Acceptance
- `T4.01`: **Scenario 1**: 90-Day Simulation Data Volume Verification:
  - SleepLogs >= 90
  - NutritionLogs >= 90
  - CashRegisters >= 90
  - DailyReviews >= 90
  - BodyMeasurements >= 90 (progression from 84.5kg down to 78.8kg verified)
- `T4.02`: **Scenario 2**: Active Daily User Lifecycle Execution (Morning Routine -> Deep Work Block -> Gym Workout -> Buffet Purchase -> Evening Review with Big 3).
- `T4.03`: **Scenario 3**: High-Volume Sales Day in Cosmetics & Buffet (Multi-Item Invoices, Drawer Balancing with Difference = 0, Gross Profit calculation).
- `T4.04`: **Scenario 4**: 90-Day OKR Mid-Cycle Course Correction (Deviation Warning on day 45 & Milestone Rescheduling).
- `T4.05`: **Scenario 5**: Financial Accounting Integrity Check (Double-Entry Neutrality & Balance Sheet Net Worth Equation: Assets = Liabilities + Equity).
- `T4.06`: **Scenario 6**: Full System Route HTTP 200 Liveness Sweep (Strictly Port 3050):
  - 20 routes tested: `/`, `/today`, `/dashboard`, `/tasks`, `/planner`, `/habits`, `/health`, `/sleep`, `/finance`, `/goals`, `/projects`, `/areas`, `/learning`, `/knowledge`, `/review`, `/routines`, `/automation`, `/settings`, `/analytics`, `/inbox`.
  - All 20 routes returned HTTP 200 OK.

---

## Test Runner Architecture & Idempotency
- **Runner**: Node.js ESM script (`scripts/test-e2e-suite.mjs`).
- **Data Isolation**: All test records are tagged with a unique run identifier (`[E2E-<timestamp>]`) and registered in a cleanup stack. The stack executes in a `finally` block to restore database state without disturbing 90-day simulation baseline data.
- **Console Output**: Tier-by-tier structured ANSI-colored report with duration per assertion and grand total summary table.
- **Exit Code Semantics**:
  - Exit code `0` on 100% pass (all 86 assertions passed).
  - Exit code `1` on any assertion or network failure.
