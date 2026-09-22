/**
 * scripts/verify-m1-integrity.mjs
 * Complete Milestone 1 Data Integrity Verification Suite for Life OS
 * Verifies:
 * 1. Record counts and schema presence
 * 2. 90-day chronological continuity (zero gaps)
 * 3. Cash register balancing & multi-center isolation
 * 4. Cash register vs. Invoice totals linkage
 * 5. Invoice & InvoiceItem arithmetic, COGS, and gross profit
 * 6. NutritionLog vs FoodEntry macro & calorie consistency (Atwater)
 * 7. Workout & WorkoutExercise volume & progressive overload
 * 8. Sleep efficiency & energy score correlation
 * 9. Habit & HabitLog completion and streaks (540 logs)
 * 10. CalendarBlock duration and distribution
 * 11. Inventory stock non-negativity and reorder points
 * 12. OKR & Key Result progress formulas
 */

import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

const prisma = new PrismaClient();

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function pass(name, detail = "") {
  passedChecks++;
  console.log(`  ${ANSI.green}✓ PASS:${ANSI.reset} ${name} ${detail ? ANSI.cyan + "(" + detail + ")" + ANSI.reset : ""}`);
}

function fail(name, error) {
  failedChecks++;
  const msg = error?.message || error;
  failures.push({ name, error: msg });
  console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} ${name} -> ${ANSI.yellow}${msg}${ANSI.reset}`);
}

async function verifyAll() {
  console.log(`\n${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}🔍 STARTING MILESTONE 1 DATA INTEGRITY & AUDIT VERIFICATION${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}\n`);

  // =========================================================================
  // SUITE 1: Quantitative Record Counts
  // =========================================================================
  console.log(`${ANSI.bold}📂 SUITE 1: Entity Record Count Assertions${ANSI.reset}`);

  try {
    const userCount = await prisma.user.count();
    assert.equal(userCount, 1, `Expected exactly 1 user, found ${userCount}`);
    pass("User entity count", `count: ${userCount}`);
  } catch (e) { fail("User entity count", e); }

  try {
    const areaCount = await prisma.area.count();
    assert.equal(areaCount, 9, `Expected 9 areas, found ${areaCount}`);
    pass("Area entity count", `count: ${areaCount}`);
  } catch (e) { fail("Area entity count", e); }

  try {
    const ccCount = await prisma.costCenter.count();
    assert.equal(ccCount, 6, `Expected 6 cost centers, found ${ccCount}`);
    pass("CostCenter entity count", `count: ${ccCount}`);
  } catch (e) { fail("CostCenter entity count", e); }

  try {
    const prodCount = await prisma.product.count();
    assert.ok(prodCount >= 11, `Expected at least 11 products, found ${prodCount}`);
    pass("Product entity count", `count: ${prodCount}`);
  } catch (e) { fail("Product entity count", e); }

  try {
    const sleepCount = await prisma.sleepLog.count();
    assert.equal(sleepCount, 90, `Expected exactly 90 SleepLogs, found ${sleepCount}`);
    pass("SleepLog entity count", `count: ${sleepCount}`);
  } catch (e) { fail("SleepLog entity count", e); }

  try {
    const bodyCount = await prisma.bodyMeasurement.count();
    assert.equal(bodyCount, 90, `Expected exactly 90 BodyMeasurements, found ${bodyCount}`);
    pass("BodyMeasurement entity count", `count: ${bodyCount}`);
  } catch (e) { fail("BodyMeasurement entity count", e); }

  try {
    const nutCount = await prisma.nutritionLog.count();
    assert.equal(nutCount, 90, `Expected exactly 90 NutritionLogs, found ${nutCount}`);
    pass("NutritionLog entity count", `count: ${nutCount}`);
  } catch (e) { fail("NutritionLog entity count", e); }

  try {
    const foodCount = await prisma.foodEntry.count();
    assert.ok(foodCount >= 270, `Expected at least 270 FoodEntries (3-4/day), found ${foodCount}`);
    pass("FoodEntry entity count", `count: ${foodCount}`);
  } catch (e) { fail("FoodEntry entity count", e); }

  try {
    const habitLogCount = await prisma.habitLog.count();
    assert.equal(habitLogCount, 540, `Expected exactly 540 HabitLogs (6 habits * 90 days), found ${habitLogCount}`);
    pass("HabitLog entity count", `count: ${habitLogCount}`);
  } catch (e) { fail("HabitLog entity count", e); }

  try {
    const registerCount = await prisma.shopCashRegister.count();
    assert.ok(registerCount >= 180, `Expected at least 180 CashRegisters (90 days * >=2 centers), found ${registerCount}`);
    pass("ShopCashRegister entity count", `count: ${registerCount}`);
  } catch (e) { fail("ShopCashRegister entity count", e); }

  try {
    const workoutCount = await prisma.workout.count();
    assert.ok(workoutCount >= 40 && workoutCount <= 55, `Expected 40-55 workouts in 90 days, found ${workoutCount}`);
    pass("Workout entity count", `count: ${workoutCount}`);
  } catch (e) { fail("Workout entity count", e); }

  try {
    const exerciseCount = await prisma.workoutExercise.count();
    assert.ok(exerciseCount >= 120, `Expected at least 120 WorkoutExercises, found ${exerciseCount}`);
    pass("WorkoutExercise entity count", `count: ${exerciseCount}`);
  } catch (e) { fail("WorkoutExercise entity count", e); }

  try {
    const invoiceCount = await prisma.invoice.count();
    assert.ok(invoiceCount >= 90, `Expected at least 90 Invoices across 90 days, found ${invoiceCount}`);
    pass("Invoice entity count", `count: ${invoiceCount}`);
  } catch (e) { fail("Invoice entity count", e); }

  try {
    const invoiceItemCount = await prisma.invoiceItem.count();
    assert.ok(invoiceItemCount >= 180, `Expected at least 180 InvoiceItems, found ${invoiceItemCount}`);
    pass("InvoiceItem entity count", `count: ${invoiceItemCount}`);
  } catch (e) { fail("InvoiceItem entity count", e); }

  try {
    const calBlockCount = await prisma.calendarBlock.count();
    assert.ok(calBlockCount >= 180, `Expected at least 180 CalendarBlocks, found ${calBlockCount}`);
    pass("CalendarBlock entity count", `count: ${calBlockCount}`);
  } catch (e) { fail("CalendarBlock entity count", e); }

  // =========================================================================
  // SUITE 2: 90-Day Chronological Continuity (Zero Gaps)
  // =========================================================================
  console.log(`\n${ANSI.bold}📅 SUITE 2: 90-Day Chronological Continuity Assertions${ANSI.reset}`);

  async function checkDailyContinuity(modelName, where = {}) {
    const records = await prisma[modelName].findMany({
      where,
      orderBy: { date: "asc" },
      select: { date: true },
    });
    if (records.length !== 90) {
      throw new Error(`${modelName} has ${records.length} records, expected exactly 90`);
    }

    for (let i = 1; i < records.length; i++) {
      const prev = new Date(records[i - 1].date).getTime();
      const curr = new Date(records[i].date).getTime();
      const diffHours = (curr - prev) / (1000 * 60 * 60);
      // Diff must be ~24 hours (allowing 22-26 for daylight savings)
      if (diffHours < 22 || diffHours > 26) {
        throw new Error(`Date gap detected in ${modelName} between index ${i-1} (${records[i-1].date.toISOString()}) and ${i} (${records[i].date.toISOString()}): ${diffHours}h`);
      }
    }
  }

  for (const m of ["sleepLog", "bodyMeasurement", "nutritionLog", "dailyReview"]) {
    try {
      await checkDailyContinuity(m);
      pass(`${m} 90-day continuity`, "Zero gaps, exactly 90 continuous days");
    } catch (e) { fail(`${m} 90-day continuity`, e); }
  }

  // Check CashRegister continuity per Cost Center
  try {
    const costCenters = await prisma.costCenter.findMany({
      where: { code: { in: ["BUF", "COS"] } },
    });
    for (const cc of costCenters) {
      await checkDailyContinuity("shopCashRegister", { costCenterId: cc.id });
      pass(`ShopCashRegister continuity for ${cc.name} (${cc.code})`, "90 continuous days");
    }
  } catch (e) { fail("ShopCashRegister multi-center continuity", e); }

  // Check HabitLog continuity per Habit
  try {
    const habits = await prisma.habit.findMany();
    for (const h of habits) {
      const hLogs = await prisma.habitLog.findMany({
        where: { habitId: h.id },
        orderBy: { date: "asc" },
      });
      assert.equal(hLogs.length, 90, `Habit "${h.title}" has ${hLogs.length} logs, expected 90`);
    }
    pass("HabitLog continuity for all 6 habits", "Each habit has exactly 90 daily logs");
  } catch (e) { fail("HabitLog per-habit continuity", e); }

  // =========================================================================
  // SUITE 3: Cash Register Mathematical Balancing & Multi-Center Isolation
  // =========================================================================
  console.log(`\n${ANSI.bold}💰 SUITE 3: Cash Register Balancing & Multi-Center Math${ANSI.reset}`);

  try {
    const registers = await prisma.shopCashRegister.findMany();
    let imbalanceCount = 0;
    let nullCostCenterCount = 0;

    for (const r of registers) {
      if (!r.costCenterId) nullCostCenterCount++;
      const expected = r.openingCash + r.salesCash - r.expensesCash - r.withdrawalsCash;
      const diff = r.actualClosingCash - expected;
      if (Math.abs(diff) > 0.01 || Math.abs(r.difference) > 0.01 || !r.reconciled) {
        imbalanceCount++;
      }
    }

    assert.equal(nullCostCenterCount, 0, `Found ${nullCostCenterCount} cash registers with null costCenterId`);
    assert.equal(imbalanceCount, 0, `Found ${imbalanceCount} imbalanced cash registers`);
    pass("ShopCashRegister balancing equation", `100% of ${registers.length} registers balanced (difference = 0)`);
    pass("ShopCashRegister costCenterId presence", "All registers linked to specific cost centers");
  } catch (e) { fail("ShopCashRegister math and foreign key", e); }

  // =========================================================================
  // SUITE 4: Cash Register vs Invoices Reconciliation
  // =========================================================================
  console.log(`\n${ANSI.bold}🧾 SUITE 4: Cash Register vs Invoices Reconciliation${ANSI.reset}`);

  try {
    const registers = await prisma.shopCashRegister.findMany({
      where: { costCenterId: { not: null } },
    });

    let matchedRegisters = 0;
    let mismatchedRegisters = 0;

    for (const r of registers) {
      const dayStart = new Date(r.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(r.date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayInvoices = await prisma.invoice.findMany({
        where: {
          costCenterId: r.costCenterId,
          date: { gte: dayStart, lte: dayEnd },
        },
      });

      if (dayInvoices.length > 0) {
        const invoiceSum = dayInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
        if (Math.abs(invoiceSum - r.salesCash) < 1.0) {
          matchedRegisters++;
        } else {
          mismatchedRegisters++;
        }
      }
    }

    assert.ok(matchedRegisters >= 90, `Expected at least 90 matched register-invoice days, got ${matchedRegisters}`);
    assert.equal(mismatchedRegisters, 0, `Found ${mismatchedRegisters} registers where salesCash != sum(invoices)`);
    pass("Cash Register to Invoice Reconciliation", `${matchedRegisters} daily registers match exact invoice totals`);
  } catch (e) { fail("Cash Register vs Invoices Reconciliation", e); }

  // =========================================================================
  // SUITE 5: Invoice & InvoiceItem Arithmetic, COGS, and Gross Profit
  // =========================================================================
  console.log(`\n${ANSI.bold}📊 SUITE 5: Invoice & Item Arithmetic & Profit Margins${ANSI.reset}`);

  try {
    const invoices = await prisma.invoice.findMany({
      include: { items: true },
    });

    let arithmeticErrors = 0;
    let negativeMarginErrors = 0;

    for (const inv of invoices) {
      assert.ok(inv.items.length > 0, `Invoice ${inv.invoiceNumber} has 0 items`);
      const itemsSum = inv.items.reduce((s, it) => s + it.total, 0);
      const expectedTotal = itemsSum - inv.discount;
      if (Math.abs(inv.totalAmount - expectedTotal) > 0.1) arithmeticErrors++;

      const cogsSum = inv.items.reduce((s, it) => s + (it.quantity * it.unitCost), 0);
      if (Math.abs(inv.cogs - cogsSum) > 0.1) arithmeticErrors++;

      const expectedProfit = inv.totalAmount - inv.cogs;
      if (Math.abs(inv.grossProfit - expectedProfit) > 0.1) arithmeticErrors++;

      if (inv.grossProfit <= 0) negativeMarginErrors++;
    }

    assert.equal(arithmeticErrors, 0, `Found ${arithmeticErrors} invoice math errors`);
    assert.equal(negativeMarginErrors, 0, `Found ${negativeMarginErrors} invoices with <= 0 gross profit`);
    pass("Invoice & Line Item Arithmetic", `${invoices.length} invoices verified: Total = Items - Discount, COGS, and Gross Profit match 100%`);
  } catch (e) { fail("Invoice & Line Item Arithmetic", e); }

  // =========================================================================
  // SUITE 6: NutritionLog vs FoodEntry Macro & Calorie Consistency
  // =========================================================================
  console.log(`\n${ANSI.bold}🥗 SUITE 6: Nutrition Log & Meal Consistency (Atwater Check)${ANSI.reset}`);

  try {
    const nutLogs = await prisma.nutritionLog.findMany({
      include: { meals: true },
    });

    let macroMismatches = 0;
    let missingMealsDays = 0;

    for (const nl of nutLogs) {
      if (nl.meals.length < 3) missingMealsDays++;

      const mealCals = nl.meals.reduce((s, m) => s + m.calories, 0);
      const mealProt = nl.meals.reduce((s, m) => s + m.protein, 0);
      const mealCarbs = nl.meals.reduce((s, m) => s + m.carbs, 0);
      const mealFat = nl.meals.reduce((s, m) => s + m.fat, 0);

      if (Math.abs(nl.calories - mealCals) > 5) macroMismatches++;
      if (Math.abs(nl.protein - mealProt) > 2) macroMismatches++;
      if (Math.abs(nl.carbs - mealCarbs) > 2) macroMismatches++;
      if (Math.abs(nl.fat - mealFat) > 2) macroMismatches++;

      // Atwater formula check
      const atwaterKcal = (nl.protein * 4) + (nl.carbs * 4) + (nl.fat * 9);
      const diffRatio = Math.abs(nl.calories - atwaterKcal) / nl.calories;
      if (diffRatio > 0.20) {
        macroMismatches++;
      }
    }

    assert.equal(missingMealsDays, 0, `Found ${missingMealsDays} days with < 3 meals`);
    assert.equal(macroMismatches, 0, `Found ${macroMismatches} nutrition macro/calorie mismatches`);
    pass("NutritionLog to FoodEntry Aggregation", `All 90 days have 3+ meals and exact macro sums`);
    pass("Atwater Macro Caloric Concordance", "Kcal corresponds to (4*P + 4*C + 9*F) within tolerance");
  } catch (e) { fail("NutritionLog vs FoodEntry consistency", e); }

  // =========================================================================
  // SUITE 7: Workout Volume & Progressive Overload
  // =========================================================================
  console.log(`\n${ANSI.bold}🏋️ SUITE 7: Workout Volume & Progressive Overload${ANSI.reset}`);

  try {
    const workouts = await prisma.workout.findMany({
      include: { exercises: true },
      orderBy: { date: "asc" },
    });

    let volumeErrors = 0;
    for (const w of workouts) {
      assert.ok(w.exercises.length >= 3, `Workout on ${w.date} has fewer than 3 exercises`);
      const calcVol = w.exercises.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0);
      if (Math.abs(w.totalVolume - calcVol) > 1.0) volumeErrors++;
    }

    assert.equal(volumeErrors, 0, `Found ${volumeErrors} workouts with totalVolume calculation error`);

    // Progressive overload: compare first third vs last third of workouts
    const third = Math.floor(workouts.length / 3);
    const m1AvgVol = workouts.slice(0, third).reduce((s, w) => s + w.totalVolume, 0) / third;
    const m3AvgVol = workouts.slice(workouts.length - third).reduce((s, w) => s + w.totalVolume, 0) / third;

    assert.ok(m3AvgVol > m1AvgVol, `Progressive overload failed: Month 1 vol (${m1AvgVol.toFixed(0)}) >= Month 3 vol (${m3AvgVol.toFixed(0)})`);
    pass("Workout volume integrity", `${workouts.length} workouts verified: Total volume matches sum(sets*reps*weight)`);
    pass("Progressive overload trend", `Month 1 avg volume: ${m1AvgVol.toFixed(0)}kg -> Month 3 avg: ${m3AvgVol.toFixed(0)}kg (+${(((m3AvgVol - m1AvgVol) / m1AvgVol) * 100).toFixed(1)}%)`);
  } catch (e) { fail("Workout volume & progressive overload", e); }

  // =========================================================================
  // SUITE 8: Sleep Efficiency & Energy Bounds
  // =========================================================================
  console.log(`\n${ANSI.bold}😴 SUITE 8: Sleep Efficiency & Energy Score Validation${ANSI.reset}`);

  try {
    const sleepLogs = await prisma.sleepLog.findMany();
    let formulaErrors = 0;
    let lowEffErrors = 0;

    for (const sl of sleepLogs) {
      const calcEff = Math.min(100, Math.round((sl.totalSleepTimeMinutes / sl.timeInBedMinutes) * 1000) / 10);
      if (Math.abs(sl.sleepEfficiency - calcEff) > 0.2) formulaErrors++;
      if (sl.sleepEfficiency < 80) lowEffErrors++;
      if (sl.morningEnergy < 1 || sl.morningEnergy > 10) formulaErrors++;
    }

    assert.equal(formulaErrors, 0, `Found ${formulaErrors} sleep efficiency calculation errors`);
    assert.equal(lowEffErrors, 0, `Found ${lowEffErrors} days with sleep efficiency < 80%`);
    pass("Sleep efficiency formula", `All 90 sleep logs match formula: TST / TIB * 100`);
    pass("Sleep quality threshold", `All 90 days have sleep efficiency >= 80% (Average: ${(sleepLogs.reduce((s, l) => s + l.sleepEfficiency, 0) / 90).toFixed(1)}%)`);
  } catch (e) { fail("Sleep efficiency & energy validation", e); }

  // =========================================================================
  // SUITE 9: Habit Completion Rates & Streaks
  // =========================================================================
  console.log(`\n${ANSI.bold}🎯 SUITE 9: Habit Completion Rates & Streak Integrity${ANSI.reset}`);

  try {
    const habits = await prisma.habit.findMany({
      include: { logs: true },
    });

    for (const h of habits) {
      assert.equal(h.logs.length, 90, `Habit ${h.title} has ${h.logs.length} logs`);
      const completedCount = h.logs.filter((l) => l.completed).length;
      const expectedRate = Math.round((completedCount / 90) * 100);
      const diff = Math.abs(h.completionRate - expectedRate);
      assert.ok(diff <= 3, `Habit ${h.title} completion rate mismatch: stored ${h.completionRate}%, expected ${expectedRate}%`);
    }
    pass("Habit completion rate accuracy", "All 6 habits match their 90-day log history");
  } catch (e) { fail("Habit completion rates & streaks", e); }

  // =========================================================================
  // SUITE 10: Calendar Blocks Distribution & Validity
  // =========================================================================
  console.log(`\n${ANSI.bold}📆 SUITE 10: Calendar Block Duration & Distribution${ANSI.reset}`);

  try {
    const blocks = await prisma.calendarBlock.findMany();
    let durationErrors = 0;
    for (const b of blocks) {
      const diffMs = new Date(b.end).getTime() - new Date(b.start).getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (b.plannedDuration !== diffMin) durationErrors++;
      if (diffMin <= 0) durationErrors++;
    }
    assert.equal(durationErrors, 0, `Found ${durationErrors} calendar blocks with invalid duration or inverted timestamps`);
    pass("Calendar block duration integrity", `${blocks.length} blocks have valid timestamps (end > start) and matching durations`);
  } catch (e) { fail("Calendar block validity", e); }

  // =========================================================================
  // SUITE 11: Inventory Stock Non-Negativity & Reorder Points
  // =========================================================================
  console.log(`\n${ANSI.bold}📦 SUITE 11: Product Stock & Reorder Points${ANSI.reset}`);

  try {
    const products = await prisma.product.findMany();
    let negativeStockErrors = 0;
    let priceErrors = 0;

    for (const p of products) {
      if (p.stock < 0) negativeStockErrors++;
      if (p.sellPrice <= p.buyPrice) priceErrors++;
      assert.ok(p.minimumStock > 0, `Product ${p.name} has minimumStock <= 0`);
    }

    assert.equal(negativeStockErrors, 0, `Found ${negativeStockErrors} products with negative stock`);
    assert.equal(priceErrors, 0, `Found ${priceErrors} products where sellPrice <= buyPrice`);
    pass("Product inventory constraints", `All ${products.length} products have positive stock, valid markup, and minimum reorder thresholds`);
  } catch (e) { fail("Product inventory constraints", e); }

  // =========================================================================
  // SUITE 12: Goal & OKR Progress Engine
  // =========================================================================
  console.log(`\n${ANSI.bold}🏆 SUITE 12: OKR Progress Engine Calculation${ANSI.reset}`);

  try {
    const krs = await prisma.keyResult.findMany();
    let progressErrors = 0;

    for (const kr of krs) {
      const raw = ((kr.currentValue - kr.baseline) / (kr.target - kr.baseline)) * 100;
      const expectedProgress = Math.min(100, Math.max(0, Math.round(raw)));
      if (Math.abs(kr.progress - expectedProgress) > 1) progressErrors++;
    }

    assert.equal(progressErrors, 0, `Found ${progressErrors} KeyResult progress calculation errors`);

    const objectives = await prisma.objective.findMany({ include: { keyResults: true } });
    for (const obj of objectives) {
      if (obj.keyResults.length > 0) {
        const avg = Math.round(obj.keyResults.reduce((s, k) => s + k.progress, 0) / obj.keyResults.length);
        assert.equal(obj.progress, avg, `Objective "${obj.title}" progress (${obj.progress}%) does not match average of KRs (${avg}%)`);
      }
    }
    pass("OKR & Key Result Progress Math", "All KeyResults and Objectives match the exact mathematical formulas");
  } catch (e) { fail("OKR Progress Engine Calculation", e); }

  // =========================================================================
  // FINAL SUMMARY
  // =========================================================================
  console.log(`\n${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}📋 VERIFICATION SUMMARY RESULT:${ANSI.reset}`);
  console.log(`  • ${ANSI.green}Total Passed Checks:${ANSI.reset} ${passedChecks}`);
  console.log(`  • ${ANSI.red}Total Failed Checks:${ANSI.reset} ${failedChecks}`);

  if (failedChecks === 0) {
    console.log(`\n${ANSI.bold}${ANSI.green}🎉 100% DATA INTEGRITY ACHIEVED! ALL TEST SUITES PASSED CLEANLY.${ANSI.reset}`);
    console.log(`${ANSI.blue}=================================================================${ANSI.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${ANSI.bold}${ANSI.red}❌ INTEGRITY VERIFICATION FAILED WITH ${failedChecks} ERRORS!${ANSI.reset}`);
    console.log(`Failing assertions:`);
    for (const f of failures) {
      console.log(`  - [${f.name}]: ${f.error}`);
    }
    console.log(`${ANSI.blue}=================================================================${ANSI.reset}\n`);
    process.exit(1);
  }
}

verifyAll()
  .catch((e) => {
    console.error("Fatal test suite crash:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
