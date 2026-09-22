# DISPATCH — m1_it2_worker_2

## Identity
- Role: teamwork_preview_worker
- Assigned Milestone: Milestone 1 Iteration 2 — Lifecycle Simulation Fix & Relational Synchronization
- Working directory: d:/my life/.agents/m1_it2_worker_2
- Owned file: scripts/simulate-90-days-lifecycle.mjs

## Mandate & Inputs
- Path to ORIGINAL_REQUEST.md: d:/my life/.agents/ORIGINAL_REQUEST.md (MUST read first)
- Path to PROJECT.md: d:/my life/PROJECT.md
- Reviewer Report with exact failure analysis: d:/my life/.agents/m1_reviewer_1/review_report.md
- Reviewer Handoff: d:/my life/.agents/m1_reviewer_1/handoff.md

## Problem Statement
In Milestone 1 Iteration 1 review, `scripts/simulate-90-days-lifecycle.mjs` was found to desynchronize `ShopCashRegister` from `Invoice` records and `NutritionLog` from `FoodEntry` records, and to use hardcoded substring matching for KeyResult values.
Executing `node scripts/simulate-90-days-lifecycle.mjs` leaves the database in a state where `node scripts/verify-m1-integrity.mjs` fails with 2 failing suites (Suite 4: Cash Register vs Invoices, Suite 6: NutritionLog vs FoodEntry).

## Task Instructions
1. Read `ORIGINAL_REQUEST.md`, `d:/my life/.agents/m1_reviewer_1/review_report.md`, `scripts/simulate-90-days-lifecycle.mjs`, `scripts/seed.mjs`, and `scripts/verify-m1-integrity.mjs`.
2. Update `scripts/simulate-90-days-lifecycle.mjs`:
   - Ensure daily cash register updates (`salesCash`, `posSalesCash`, `physicalSalesCash`) match the actual invoices for each day and cost center, or calculate them from existing invoices, or create corresponding invoice items if new sales are simulated.
   - Ensure nutrition updates do not break concordance with child `FoodEntry` records and adhere strictly to the Atwater formula ($Calories = 4 \times Protein + 4 \times Carbs + 9 \times Fat$). If updating `NutritionLog`, create/update matching `FoodEntry` records or delegate appropriately.
   - Replace hardcoded KeyResult values (lines 266-272) with dynamic calculations based on real database aggregations (sum of invoices, workout volume, deep work hours, etc.).
   - Alternatively, align `simulate-90-days-lifecycle.mjs` to work symbiotically with `seed.mjs` so that executing `node scripts/simulate-90-days-lifecycle.mjs` produces a valid, consistent state.
3. Verification Requirements (Worker MUST execute):
   - Run `node scripts/seed.mjs` (or reset if needed).
   - Run `node scripts/simulate-90-days-lifecycle.mjs`.
   - Run `node scripts/verify-m1-integrity.mjs` -> MUST PASS 36/36 checks (100%, Exit code 0).
   - Run `node scripts/test-core.mjs` -> MUST PASS 7/7 tests (100%).
   - Run `node scripts/test-e2e-suite.mjs` -> MUST PASS 86/86 assertions (100%).
   - Run `node node_modules/typescript/bin/tsc --noEmit` -> MUST EXIT 0 with 0 errors.
   - Verify port isolation: process on port 3050, port 3000 untouched.
4. Output:
   - Write `changes.md` and `handoff.md` in your working directory `d:/my life/.agents/m1_it2_worker_2/`.
   - Send completion message to parent.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-03T19:48:43Z
You are m1_it2_worker_2 (teamwork_preview_worker).
Your working directory is: d:/my life/.agents/m1_it2_worker_2
You exclusively own: scripts/simulate-90-days-lifecycle.mjs

MANDATORY FIRST STEP:
Read d:/my life/.agents/ORIGINAL_REQUEST.md and d:/my life/.agents/m1_it2_worker_2/DISPATCH.md.

TASK:
In Milestone 1 Iteration 1 review (d:/my life/.agents/m1_reviewer_1/review_report.md), scripts/simulate-90-days-lifecycle.mjs was found to corrupt database relational integrity:
1. It overwrites shopCashRegister salesCash with formulas that don't match invoices.
2. It updates nutritionLog without updating child foodEntry records, breaking Atwater macro concordance.
3. It hardcodes KeyResult values using string matching.
As a result, running `node scripts/simulate-90-days-lifecycle.mjs` causes `node scripts/verify-m1-integrity.mjs` to fail with 2 broken suites.

Update scripts/simulate-90-days-lifecycle.mjs so that:
- Daily cash register updates match actual invoices per cost center, or calculate them from existing invoices.
- NutritionLog updates maintain concordance with child foodEntry records and adhere to Atwater formula (Calories = 4*P + 4*C + 9*F).
- KeyResult progress is calculated dynamically from real database entities.
- Executing `node scripts/simulate-90-days-lifecycle.mjs` followed by `node scripts/verify-m1-integrity.mjs` results in 36/36 passed checks (Exit code 0).

VERIFICATION REQUIREMENTS (YOU MUST RUN THESE AND REPORT OUTPUTS):
1. `node scripts/simulate-90-days-lifecycle.mjs`
2. `node scripts/verify-m1-integrity.mjs` (must pass 36/36 assertions, 0 errors, exit 0)
3. `node scripts/test-core.mjs` (must pass 7/7, exit 0)
4. `node scripts/test-e2e-suite.mjs` (must pass 86/86, exit 0)
5. `node node_modules/typescript/bin/tsc --noEmit` (must exit 0 with 0 errors)

## 2026-09-03T20:00:46Z
**Context**: Milestone 1 Iteration 2 Lifecycle simulation fix.
**Content**: Heartbeat check. Please update your progress.md and report your current status on fixing scripts/simulate-90-days-lifecycle.mjs and running verification tests.
**Action**: Update progress.md and reply with status.

## 2026-09-03T20:06:00Z
Error: The stream was interrupted. Please continue the task you were working on.



