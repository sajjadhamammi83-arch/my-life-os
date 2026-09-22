# Handoff Report — Milestone 1 Simulation Seeding Architecture
**Agent**: `m1_explorer_2` (teamwork_preview_explorer)  
**Recipient**: `parent` (`e4c495e6-a5c4-4f50-b631-c190920d77f0`)  
**Deliverable**: `d:/my life/.agents/m1_explorer_2/seed_spec.md`  
**Date**: 2026-09-03  

---

## 1. Observation

Direct investigation of the codebase and seeding infrastructure revealed:

1. **`Workout` & `WorkoutExercise` Omission**:
   - In `scripts/seed.mjs` lines 43–44, `prisma.workoutExercise.deleteMany()` and `prisma.workout.deleteMany()` are executed, but neither model is ever seeded inside the 90-day simulation loop (lines 456–589).
   - In `src/app/health/page.tsx` line 250, the UI relies on hardcoded mock exercise lists.
2. **`ShopCashRegister` Monolithic Seeding**:
   - In `scripts/seed.mjs` lines 462–483, only a single record per day is created with `salesCash: buffetSales + storeSales`. `costCenterId`, `posSalesCash`, and `physicalSalesCash` are omitted.
   - In `scripts/simulate-90-days-lifecycle.mjs` lines 159–183, `shopCashRegister.upsert` queries `where: { date: currentDate }`. Once the compound unique key `@@unique([date, costCenterId])` is applied, this query will fail without `date_costCenterId`.
3. **`Invoice` & `InvoiceItem` Complete Absence**:
   - `prisma.invoice` and `prisma.invoiceItem` are deleted at lines 31–32 of `scripts/seed.mjs`, but 0 invoices are seeded across the 90 days.
4. **`FoodEntry` Truncation**:
   - In `scripts/seed.mjs` lines 548–557, `FoodEntry` records are created **only** when `dayOffset === 0` (4 entries total). The preceding 89 days are completely blank.
5. **`HabitLog` Truncation**:
   - In `scripts/seed.mjs` lines 576–588, `HabitLog` records are created **only** when `dayOffset < 7` (42 records total). Days 7 to 89 have zero logs.
6. **`CalendarBlock` Complete Absence**:
   - `prisma.calendarBlock` is deleted at line 57 of `scripts/seed.mjs`, but never seeded.

---

## 2. Logic Chain

1. **Premise**: Milestone 1 requires a rich, authentic 90-day user history across all 17 modules, enabling downstream modules (M2 Financial reconciliation, M3 Calendar time-blocking, M4 Gym & Health tracking, M5 Analytics charts) to function with live database queries without mock fallbacks.
2. **Gym Overload Model**: A rotating 4-day bodybuilding split (Chest/Biceps, Back/Triceps, Legs/Abs, Shoulders/Traps) scheduled 4 days/week yields 51 workouts. Applying the progression factor `prog = (90 - dayOffset) / 90` with formula `weight = Math.round(baseWeight * (1 + 0.35 * prog) * 2) / 2` realistically models progressive overload (+35% strength gain over 3 months) with total session volume tracking upward from ~6,000 kg to ~9,200 kg.
3. **Multi-Center Register Model**: Partitioning the daily register by cost center (`BUF`, `COS`, `RYSH`) yields 90 records per center (270 records total). Enforcing `expectedClosingCash = openingCash + salesCash - expensesCash - withdrawalsCash` and `actualClosingCash = expectedClosingCash` guarantees zero reconciliation discrepancy (`difference === 0`).
4. **Invoicing & Margin Consistency**: Generating daily walk-in and retail invoices with items linked to `Product` IDs using `cogs = sum(qty * buyPrice)` and `totalAmount = sum(qty * sellPrice)` guarantees true gross profit calculation (`grossProfit = totalAmount - cogs`) with realistic margins (30%–52%).
5. **Nutritional Invariant**: Creating 4 distinct daily meals (Breakfast, Snack/Shake, Lunch, Dinner) across all 90 days (360 meals total) and deriving `NutritionLog` directly from their sums guarantees 100% cross-entity integrity between macro summaries and itemized logs.
6. **Habits & Calendar**: Seeding 6 habits × 90 days = 540 logs with post-seed streak calculation accurately models habit momentum. Generating ~310 `CalendarBlock` records models deep work (180m), shallow buffer (60m), retail admin (120m), and Friday CEO reviews (150m), generating over 260 hours of deep work for analytics.

---

## 3. Caveats

1. **Schema Pre-requisite**: The seeding code for `ShopCashRegister` assumes that `m1_worker` has already applied the schema modifications specified by `m1_explorer_1` (`costCenterId`, `posSalesCash`, `physicalSalesCash`, and `@@unique([date, costCenterId])`). If run on the unmigrated schema, `costCenterId` fields will be rejected by Prisma.
2. **Product SKUs**: The invoice generator relies on the 11 products seeded in section 6 of `scripts/seed.mjs`. If products are altered, product lookup by SKU will require corresponding key updates.
3. **Single-User Scope**: All entities are scoped to the single platform user ("مدیر سیستم‌عامل زندگی"); multi-tenancy was not evaluated as it is outside the project scope.

---

## 4. Conclusion

A comprehensive, copy-paste ready technical specification has been produced at:
`d:/my life/.agents/m1_explorer_2/seed_spec.md`

It details:
- Exact mathematical formulas and parameters for all 6 target domains.
- Complete drop-in code replacement for Section 8 of `scripts/seed.mjs`.
- Complete update for `scripts/simulate-90-days-lifecycle.mjs` handling multi-center registers.
- Exact quantitative assertions for post-execution database verification.

---

## 5. Verification Method

To independently verify the implementation after `m1_worker` executes the changes:

```powershell
# 1. Run database migration and generate Prisma client
npx prisma db push
npx prisma generate

# 2. Run the enriched seed script
node scripts/seed.mjs

# 3. Verify quantitative assertions in SQLite
node -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function verify() {
  const workouts = await p.workout.count();
  const exercises = await p.workoutExercise.count();
  const registers = await p.shopCashRegister.count();
  const invoices = await p.invoice.count();
  const invoiceItems = await p.invoiceItem.count();
  const foodEntries = await p.foodEntry.count();
  const habitLogs = await p.habitLog.count();
  const calendarBlocks = await p.calendarBlock.count();
  
  console.log({ workouts, exercises, registers, invoices, invoiceItems, foodEntries, habitLogs, calendarBlocks });
  if (workouts < 45 || registers !== 270 || foodEntries !== 360 || habitLogs !== 540 || calendarBlocks < 270) {
    throw new Error("Seed count verification failed!");
  }
  console.log("✓ All quantitative seed counts verified successfully!");
}
verify().finally(() => p.$disconnect());
'

# 4. Run the 90-day lifecycle simulation audit
node scripts/simulate-90-days-lifecycle.mjs

# 5. Run core business math tests
node scripts/test-core.mjs
```
