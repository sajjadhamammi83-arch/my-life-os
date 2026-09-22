# E2E Test Infra: Life OS 3-Month Simulation & 17-Module Integration

## Test Philosophy
- Opaque-box, requirement-driven testing. Derived from `ORIGINAL_REQUEST.md` and user-facing requirements.
- Port 3050 strict enforcement; Port 3000 (user cafe server) never touched.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Test Architecture
- Test Runner: `scripts/test-e2e-suite.mjs` (invoked via `node scripts/test-e2e-suite.mjs`)
- Typecheck Runner: `node node_modules/typescript/bin/tsc --noEmit`
- Core Math Runner: `node scripts/test-core.mjs`
- Route Liveness Runner: HTTP requests against all 17+ system routes on `http://localhost:3050`
- Pass/Fail Semantics: Exit Code 0, 100% assertions passed, zero unhandled rejections, zero HTTP errors.

## Coverage Methodology & Tiers
### Tier 1 — Feature Coverage (Isolated Functional Verification)
- Verification of each core feature in isolation:
  - Financial invoices, stock deduction, cash register balancing per cost center.
  - Calendar time block CRUD, task reschedule, uncompleted task auto-forwarding.
  - Health nutrition logging, rolling 7-day averages, gym workout set/rep/weight logging.
  - Analytics visual progress, OKR burnup, habit streak calculation.
  - Routine checklists and SOP knowledge models.

### Tier 2 — Boundary & Corner Cases
- Zero, negative, and extreme financial quantities (e.g., selling more than stock, negative cash differences).
- Midnight / cross-day calendar events and auto-forwarding across month boundaries.
- Extreme biometric values (zero hydration, 5000+ kcal, 0 vs 24 hour sleep).
- Zero-task or 100% completed OKR cycles; empty habit history vs full 90-day streak.
- Empty search queries, long strings, special Persian characters (گ، چ، پ، ژ، ی، ک).

### Tier 3 — Cross-Feature Ripple Effects (Pairwise Combinations)
- Sale in Gym Buffet / Cosmetics -> Inventory stock deducted -> Daily Cash Register updated -> Financial Transaction recorded -> Reorder Point alert triggered if stock <= minimum.
- Workout logged in Health -> Buffet protein shake consumed -> Nutrition log updated -> Energy score reflected in Daily Review -> Habit "Workout" checked.
- Uncompleted task in Today -> Auto-forwarded to Tomorrow -> Eisenhower Matrix updated -> 90-day OKR Key Result progress adjusted.
- Sleep log recorded -> Sleep Efficiency calculated -> Morning Energy correlated -> Daily Review energy audit calibrated.

### Tier 4 — Real-World 90-Day Simulation Scenarios
- Scenario 1: Active Daily User Lifecycle (90 days of morning routine -> deep work block -> gym workout -> buffet purchase -> evening review).
- Scenario 2: High-Volume Sales Day in Cosmetics Store & Gym Buffet (multiple multi-item invoices, cash register closing, cash drawer reconciliation).
- Scenario 3: 90-Day OKR Mid-Cycle Course Correction (OKR progress deviation warning, project milestone rescheduling).
- Scenario 4: Full System Route & UI Interaction Sweep (all 17+ routes return HTTP 200, zero broken buttons, pure white #ffffff aesthetic, Vazirmatn font rendered).

## Coverage Thresholds
- Tier 1: >= 30 test cases
- Tier 2: >= 25 boundary cases
- Tier 3: >= 15 cross-module interaction cases
- Tier 4: >= 6 comprehensive realistic scenarios
- Total Target: >= 76 verified automated assertions
