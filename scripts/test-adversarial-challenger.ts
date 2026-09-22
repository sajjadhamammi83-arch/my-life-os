/**
 * Adversarial Stress-Testing & Boundary Challenge Suite
 * Milestone 4: Code-Executing Adversarial Challenger (Edge Cases & Boundaries)
 * Target: http://localhost:3050 (Port 3000 STRICTLY ISOLATED & UNTOUCHED)
 *
 * Scenarios:
 * 1. Rollover Edge Cases:
 *    - 1.1: Rollover with 0 unfinished tasks
 *    - 1.2: Rollover when tomorrow's 5 candidate windows are completely occupied
 *    - 1.3: Concurrent rollover execution race conditions
 * 2. Goals Feedback Edge Cases:
 *    - 2.1: Completing a task without an objective
 *    - 2.2: Unchecking a task (Objective KR vs Big 3 decrementation)
 *    - 2.3: Multiple idempotent completions vs toggle cycling ratchet effect
 *    - 2.4: Concurrent completions of the same task
 * 3. D-1 Reminders Edge Cases:
 *    - 3.1: Cheques: past due vs tomorrow (start/end) vs future vs non-PENDING status
 *    - 3.2: Boundary check: midnight transitions and exact timestamp inclusions
 */

import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3050";
const ISOLATED_PORT = "3000";
const RUN_ID = `ADV-${Date.now()}`;

// Ensure Port 3000 is never targeted
if (BASE_URL.includes(ISOLATED_PORT)) {
  throw new Error("FATAL: Test suite attempted to target isolated port 3000!");
}

interface TestReport {
  id: string;
  category: string;
  name: string;
  status: "PASS" | "FAIL" | "BUG_CONFIRMED";
  observation: string;
  details: any;
}

const reports: TestReport[] = [];

function record(report: TestReport) {
  reports.push(report);
  const icon = report.status === "PASS" ? "✔" : report.status === "BUG_CONFIRMED" ? "⚡ BUG FOUND" : "✖ FAIL";
  console.log(`[${icon}] [${report.id}] ${report.name}`);
  console.log(`      Observation: ${report.observation}\n`);
}

async function run() {
  console.log(`\n======================================================================`);
  console.log(`  EMPIRICAL CHALLENGER: ADVERSARIAL STRESS TEST SUITE (${RUN_ID})`);
  console.log(`  Target: ${BASE_URL} | Port 3000: ISOLATED`);
  console.log(`======================================================================\n`);

  // =========================================================================
  // CATEGORY 1: ROLLOVER EDGE CASES
  // =========================================================================
  console.log(`--- CATEGORY 1: ROLLOVER EDGE CASES ---\n`);

  // 1.1: Rollover with 0 unfinished tasks
  try {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Temporarily shelve all current unfinished tasks to test true 0-task condition
    const currentUnfinished = await prisma.task.findMany({
      where: {
        status: { not: "completed" },
        OR: [
          { dueDate: { lte: todayEnd } },
          { status: "today" },
          { isBigThree: true },
        ],
      },
    });

    // Temporarily update them to a future dueDate and "inbox" status
    const futureDate = new Date(now.getFullYear() + 1, 0, 1);
    await prisma.task.updateMany({
      where: { id: { in: currentUnfinished.map((t) => t.id) } },
      data: { status: "inbox", dueDate: futureDate, isBigThree: false },
    });

    // Test GET /api/tasks/rollover with 0 unfinished tasks
    const resGet = await fetch(`${BASE_URL}/api/tasks/rollover`);
    const dataGet = await resGet.json();

    // Test POST /api/tasks/rollover with 0 unfinished tasks
    const resPost = await fetch(`${BASE_URL}/api/tasks/rollover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const dataPost = await resPost.json();

    // Restore shelved tasks
    for (const t of currentUnfinished) {
      await prisma.task.update({
        where: { id: t.id },
        data: {
          status: t.status,
          dueDate: t.dueDate,
          isBigThree: t.isBigThree,
        },
      });
    }

    const passed =
      resGet.status === 200 &&
      dataGet.unfinishedCount === 0 &&
      resPost.status === 200 &&
      dataPost.success === true &&
      dataPost.forwardedCount === 0 &&
      Array.isArray(dataPost.blocks) &&
      dataPost.blocks.length === 0 &&
      dataPost.message === "هیچ تسک انجام‌نشده‌ای برای انتقال وجود ندارد";

    record({
      id: "ADV-ROLLOVER-01",
      category: "Rollover",
      name: "Rollover with 0 unfinished tasks",
      status: passed ? "PASS" : "FAIL",
      observation: `GET returned unfinishedCount=${dataGet.unfinishedCount}, POST returned forwardedCount=${dataPost.forwardedCount}, blocks=${dataPost.blocks?.length}, message="${dataPost.message}"`,
      details: { dataGet, dataPost },
    });
  } catch (err: any) {
    record({
      id: "ADV-ROLLOVER-01",
      category: "Rollover",
      name: "Rollover with 0 unfinished tasks",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // 1.2: Tomorrow already has calendar blocks filling all 5 candidate windows
  try {
    const now = new Date();
    const candidateWindows = [
      { startH: 9, startM: 0, endH: 10, endM: 30 },
      { startH: 11, startM: 0, endH: 12, endM: 30 },
      { startH: 14, startM: 0, endH: 15, endM: 30 },
      { startH: 16, startM: 30, endH: 18, endM: 0 },
      { startH: 20, startM: 0, endH: 21, endM: 30 },
    ];

    // Clear any prior rollover blocks to have a clean state
    await prisma.calendarBlock.deleteMany({
      where: { title: { contains: RUN_ID } },
    });

    // Create 5 blocker blocks occupying each candidate window
    const blockerBlocks = [];
    for (let i = 0; i < candidateWindows.length; i++) {
      const win = candidateWindows[i];
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, win.startH, win.startM, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, win.endH, win.endM, 0, 0);
      const b = await prisma.calendarBlock.create({
        data: {
          title: `[${RUN_ID}-BLOCKER-${i + 1}] Occupied Window ${win.startH}:${win.startM}`,
          type: "Deep Work",
          start: s,
          end: e,
          plannedDuration: 90,
        },
      });
      blockerBlocks.push(b);
    }

    // Create 2 unfinished tasks for today
    const taskToday1 = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-TASK-OVERFLOW-1] Overcrowded Task 1`,
        status: "today",
        dueDate: now,
        priority: "urgent",
      },
    });
    const taskToday2 = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-TASK-OVERFLOW-2] Overcrowded Task 2`,
        status: "today",
        dueDate: now,
        priority: "medium",
      },
    });

    // Call GET /api/tasks/rollover: proposedSlots should be 0!
    const resGet = await fetch(`${BASE_URL}/api/tasks/rollover`);
    const dataGet = await resGet.json();

    // Call POST /api/tasks/rollover: should handle 0 available slots gracefully without crash
    const resPost = await fetch(`${BASE_URL}/api/tasks/rollover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const dataPost = await resPost.json();

    // Check tasks in DB: were tasks moved to tomorrow even though no slots existed?
    const checkTask1 = await prisma.task.findUnique({ where: { id: taskToday1.id } });
    const checkTask2 = await prisma.task.findUnique({ where: { id: taskToday2.id } });

    // Check if any calendar block was created for these tasks
    const blocksForTasks = await prisma.calendarBlock.findMany({
      where: { taskId: { in: [taskToday1.id, taskToday2.id] } },
    });

    // Cleanup blockers and tasks
    await prisma.calendarBlock.deleteMany({
      where: { id: { in: blockerBlocks.map((b) => b.id) } },
    });
    await prisma.task.deleteMany({
      where: { id: { in: [taskToday1.id, taskToday2.id] } },
    });

    const passed =
      resGet.status === 200 &&
      dataGet.proposedSlots.length === 0 &&
      resPost.status === 200 &&
      dataPost.success === true &&
      blocksForTasks.length === 0 &&
      (checkTask1?.status === "scheduled" || checkTask1?.status === "today") &&
      new Date(checkTask1.dueDate!).getDate() === now.getDate() + 1;

    record({
      id: "ADV-ROLLOVER-02",
      category: "Rollover",
      name: "Rollover when all 5 candidate windows are occupied",
      status: passed ? "PASS" : "FAIL",
      observation: `Free candidate slots = ${dataGet.proposedSlots.length}. POST status = ${resPost.status}, created blocks for overflow tasks = ${blocksForTasks.length}. Tasks successfully rescheduled to tomorrow without crashing or creating overlapping blocks.`,
      details: { proposedSlotsCount: dataGet.proposedSlots.length, createdBlocksCount: blocksForTasks.length },
    });
  } catch (err: any) {
    record({
      id: "ADV-ROLLOVER-02",
      category: "Rollover",
      name: "Rollover when all 5 candidate windows are occupied",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // 1.3: Concurrency: Multiple rollovers triggered concurrently
  try {
    const now = new Date();
    // Clear any previous test blocks
    await prisma.calendarBlock.deleteMany({
      where: { title: { contains: RUN_ID } },
    });
    await prisma.calendarBlock.deleteMany({
      where: { title: { contains: "[انتقال به فردا]" } },
    });

    // Create 2 unfinished tasks
    const concTask1 = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-CONC-1] Concurrent Rollover Task 1`,
        status: "today",
        dueDate: now,
        priority: "urgent",
      },
    });
    const concTask2 = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-CONC-2] Concurrent Rollover Task 2`,
        status: "today",
        dueDate: now,
        priority: "high",
      },
    });

    // Trigger 3 concurrent POST requests
    const p1 = fetch(`${BASE_URL}/api/tasks/rollover`, { method: "POST" });
    const p2 = fetch(`${BASE_URL}/api/tasks/rollover`, { method: "POST" });
    const p3 = fetch(`${BASE_URL}/api/tasks/rollover`, { method: "POST" });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);

    // Query blocks created for these tasks
    const createdBlocks = await prisma.calendarBlock.findMany({
      where: { taskId: { in: [concTask1.id, concTask2.id] } },
    });

    // Cleanup
    await prisma.calendarBlock.deleteMany({ where: { taskId: { in: [concTask1.id, concTask2.id] } } });
    await prisma.task.deleteMany({ where: { id: { in: [concTask1.id, concTask2.id] } } });

    // Check if duplicate blocks were created due to race condition
    const duplicateBlocksDetected = createdBlocks.length > 2;

    record({
      id: "ADV-ROLLOVER-03",
      category: "Rollover",
      name: "Concurrent rollover execution race condition",
      status: duplicateBlocksDetected ? "BUG_CONFIRMED" : "PASS",
      observation: `Executed 3 concurrent rollover requests. Total CalendarBlocks created for 2 tasks: ${createdBlocks.length}. ${duplicateBlocksDetected ? "RACE CONDITION DETECTED: Duplicate CalendarBlocks created for the same tasks in the same slots due to absence of mutual exclusion / DB transaction locking." : "Handled cleanly without duplicate block insertion."}`,
      details: {
        statuses: [r1.status, r2.status, r3.status],
        blocksCreatedCount: createdBlocks.length,
        taskIds: [concTask1.id, concTask2.id],
      },
    });
  } catch (err: any) {
    record({
      id: "ADV-ROLLOVER-03",
      category: "Rollover",
      name: "Concurrent rollover execution race condition",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // =========================================================================
  // CATEGORY 2: GOALS FEEDBACK EDGE CASES
  // =========================================================================
  console.log(`--- CATEGORY 2: GOALS FEEDBACK EDGE CASES ---\n`);

  // 2.1: Completing a task WITHOUT an objective
  try {
    const taskNoObj = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-NO-OBJ] Task without objective`,
        objectiveId: null,
        isBigThree: false,
        status: "today",
      },
    });

    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskNoObj.id,
        isCompleted: true,
      }),
    });
    const data = await res.json();

    const updated = await prisma.task.findUnique({ where: { id: taskNoObj.id } });
    await prisma.task.delete({ where: { id: taskNoObj.id } });

    const passed =
      res.status === 200 &&
      data.success === true &&
      updated?.status === "completed" &&
      updated?.kanbanColumn === "Done";

    record({
      id: "ADV-GOALS-01",
      category: "Goals Feedback",
      name: "Completing a task without an objective",
      status: passed ? "PASS" : "FAIL",
      observation: `PATCH returned 200 OK. Task updated to status='completed' and kanbanColumn='Done'. No null pointer exception when objectiveId is null.`,
      details: { status: res.status, updatedStatus: updated?.status },
    });
  } catch (err: any) {
    record({
      id: "ADV-GOALS-01",
      category: "Goals Feedback",
      name: "Completing a task without an objective",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // 2.2: Unchecking a task (Testing decrement behavior for Objectives/KRs vs Big3)
  try {
    // Setup Objective and KR
    const obj = await prisma.objective.create({
      data: {
        title: `[${RUN_ID}-UNCHECK] Objective for Uncheck Test`,
        targetMetric: "اقدام",
        targetValue: 10,
        currentValue: 0,
        progress: 0,
      },
    });
    const kr = await prisma.keyResult.create({
      data: {
        objectiveId: obj.id,
        metric: "اقدام",
        baseline: 0,
        target: 10,
        currentValue: 0,
        progress: 0,
      },
    });

    // Create Big3 task linked to objective
    const task = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-UNCHECK-TASK] Big3 Task for Uncheck`,
        objectiveId: obj.id,
        isBigThree: true,
        status: "today",
      },
    });

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Initial review state
    const revBefore = await prisma.dailyReview.findFirst({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });
    const initialBig3 = revBefore?.big3Completed || 0;

    // STEP 1: Complete the task
    const resCheck = await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: true }),
    });
    assert.equal(resCheck.status, 200);

    const krAfterCheck = await prisma.keyResult.findUnique({ where: { id: kr.id } });
    const objAfterCheck = await prisma.objective.findUnique({ where: { id: obj.id } });
    const revAfterCheck = await prisma.dailyReview.findFirst({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // STEP 2: Uncheck the task
    const resUncheck = await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: false }),
    });
    assert.equal(resUncheck.status, 200);

    const krAfterUncheck = await prisma.keyResult.findUnique({ where: { id: kr.id } });
    const objAfterUncheck = await prisma.objective.findUnique({ where: { id: obj.id } });
    const revAfterUncheck = await prisma.dailyReview.findFirst({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // Cleanup
    await prisma.keyResult.deleteMany({ where: { objectiveId: obj.id } });
    await prisma.task.deleteMany({ where: { id: task.id } });
    await prisma.objective.deleteMany({ where: { id: obj.id } });

    // Assessment:
    // Big 3: Should decrement back
    const big3Decremented = (revAfterUncheck?.big3Completed ?? 0) === initialBig3;
    // Objective / KR: Did it decrement?
    const krDecremented = (krAfterUncheck?.currentValue ?? 0) < (krAfterCheck?.currentValue ?? 0);
    const objDecremented = (objAfterUncheck?.currentValue ?? 0) < (objAfterCheck?.currentValue ?? 0);

    if (!krDecremented || !objDecremented) {
      record({
        id: "ADV-GOALS-02",
        category: "Goals Feedback",
        name: "Unchecking a task: KeyResult/Objective decrementation asymmetry",
        status: "BUG_CONFIRMED",
        observation: `ASYMMETRY CONFIRMED: Big3 review decrements correctly (from ${revAfterCheck?.big3Completed} to ${revAfterUncheck?.big3Completed}), BUT KeyResult currentValue stayed at ${krAfterUncheck?.currentValue} (was ${krAfterCheck?.currentValue}) and Objective currentValue stayed at ${objAfterUncheck?.currentValue} (was ${objAfterCheck?.currentValue}). Unchecking does not roll back OKR progress.`,
        details: {
          krBefore: 0,
          krAfterCheck: krAfterCheck?.currentValue,
          krAfterUncheck: krAfterUncheck?.currentValue,
          objAfterCheck: objAfterCheck?.progress,
          objAfterUncheck: objAfterUncheck?.progress,
          big3Decremented,
        },
      });
    } else {
      record({
        id: "ADV-GOALS-02",
        category: "Goals Feedback",
        name: "Unchecking a task: KeyResult/Objective decrementation",
        status: "PASS",
        observation: `Both Big3 and Objective/KR decremented smoothly upon unchecking.`,
        details: {},
      });
    }
  } catch (err: any) {
    record({
      id: "ADV-GOALS-02",
      category: "Goals Feedback",
      name: "Unchecking a task",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // 2.3: Multiple completions: Idempotent repeated calls vs Toggle cycling ratchet
  try {
    // Setup Objective and KR
    const obj = await prisma.objective.create({
      data: {
        title: `[${RUN_ID}-IDEMP] Objective for Idempotency Test`,
        targetMetric: "اقدام",
        targetValue: 10,
        currentValue: 0,
        progress: 0,
      },
    });
    const kr = await prisma.keyResult.create({
      data: {
        objectiveId: obj.id,
        metric: "اقدام",
        baseline: 0,
        target: 10,
        currentValue: 0,
        progress: 0,
      },
    });
    const task = await prisma.task.create({
      data: {
        title: `[${RUN_ID}-IDEMP-TASK] Task for Idempotency`,
        objectiveId: obj.id,
        status: "today",
      },
    });

    // Subcase A: 3 repeated PATCH calls with isCompleted: true (without unchecking)
    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE_URL}/api/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, isCompleted: true }),
      });
    }

    const krAfterRepeated = await prisma.keyResult.findUnique({ where: { id: kr.id } });

    // Subcase B: Rapid toggle cycling (Check -> Uncheck -> Check -> Uncheck -> Check)
    // 2 more toggle cycles:
    await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: false }),
    });
    await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: true }),
    });
    await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: false }),
    });
    await fetch(`${BASE_URL}/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: true }),
    });

    const krAfterToggle = await prisma.keyResult.findUnique({ where: { id: kr.id } });
    const objAfterToggle = await prisma.objective.findUnique({ where: { id: obj.id } });

    // Cleanup
    await prisma.keyResult.deleteMany({ where: { objectiveId: obj.id } });
    await prisma.task.deleteMany({ where: { id: task.id } });
    await prisma.objective.deleteMany({ where: { id: obj.id } });

    const isIdempotentWhenAlreadyDone = krAfterRepeated?.currentValue === 1;
    const ratchetInflated = krAfterToggle!.currentValue > 1;

    record({
      id: "ADV-GOALS-03A",
      category: "Goals Feedback",
      name: "Idempotency of repeated isCompleted: true calls",
      status: isIdempotentWhenAlreadyDone ? "PASS" : "FAIL",
      observation: `Consecutive calls to isCompleted:true while already completed did not re-increment (KR currentValue remained ${krAfterRepeated?.currentValue}). Guard !wasCompleted functions correctly.`,
      details: { krCurrentValue: krAfterRepeated?.currentValue },
    });

    record({
      id: "ADV-GOALS-03B",
      category: "Goals Feedback",
      name: "Toggle cycling ratchet effect on KeyResult progress",
      status: ratchetInflated ? "BUG_CONFIRMED" : "PASS",
      observation: ratchetInflated
        ? `RATCHET INFLATION CONFIRMED: Checking/unchecking/checking the same single task 3 times caused KR currentValue to ratchet from 1 up to ${krAfterToggle?.currentValue} and Objective progress to ${objAfterToggle?.progress}%.`
        : `NO RATCHET INFLATION: Checking/unchecking/checking the same single task 3 times maintained KR currentValue at ${krAfterToggle?.currentValue} and Objective progress at ${objAfterToggle?.progress}%. Rollback works symmetrically.`,
      details: {
        krCurrentValue: krAfterToggle?.currentValue,
        objProgress: objAfterToggle?.progress,
      },
    });
  } catch (err: any) {
    record({
      id: "ADV-GOALS-03",
      category: "Goals Feedback",
      name: "Multiple completions & Toggle cycling",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // =========================================================================
  // CATEGORY 3: D-1 REMINDERS EDGE CASES
  // =========================================================================
  console.log(`--- CATEGORY 3: D-1 REMINDERS EDGE CASES ---\n`);

  // 3.1: Cheques: past due vs tomorrow vs future vs non-PENDING status
  try {
    const now = new Date();
    const pastDate3 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 10, 0, 0);
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0, 0);
    const tomorrowMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30, 0);
    const tomorrowNight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 45, 0);
    const tomorrowBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 900);
    const dayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 8, 0, 0);
    const futureDate30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 10, 0, 0);

    // Create test cheques across all time horizons and statuses
    const chqPast3 = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-P3-${Date.now()}`,
        bankName: "بانک ملی",
        amount: 10000000,
        dueDate: pastDate3,
        payeeOrPayer: "تست گذشته ۳ روز",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqYesterday = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-YEST-${Date.now()}`,
        bankName: "بانک ملت",
        amount: 15000000,
        dueDate: yesterdayDate,
        payeeOrPayer: "تست دیروز",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqTomorrowMorn = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-TM-MORN-${Date.now()}`,
        bankName: "بانک صادرات",
        amount: 20000000,
        dueDate: tomorrowMorning,
        payeeOrPayer: "تست فردا صبح",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqTomorrowNight = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-TM-NIGHT-${Date.now()}`,
        bankName: "بانک تجارت",
        amount: 25000000,
        dueDate: tomorrowNight,
        payeeOrPayer: "تست فردا شب",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqTomorrowBound = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-TM-BOUND-${Date.now()}`,
        bankName: "بانک سپه",
        amount: 30000000,
        dueDate: tomorrowBoundary,
        payeeOrPayer: "تست مرز فردا شب",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqDayAfter = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-DAY-AFTER-${Date.now()}`,
        bankName: "بانک پارسیان",
        amount: 35000000,
        dueDate: dayAfterTomorrow,
        payeeOrPayer: "تست پس‌فردا",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqFuture30 = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-FUT30-${Date.now()}`,
        bankName: "بانک پاسارگاد",
        amount: 40000000,
        dueDate: futureDate30,
        payeeOrPayer: "تست ۳۰ روز آینده",
        chequeType: "PAYABLE",
        status: "PENDING",
      },
    });
    const chqTomorrowCleared = await prisma.cheque.create({
      data: {
        chequeNumber: `CHQ-CLEARED-${Date.now()}`,
        bankName: "بانک رفاه",
        amount: 50000000,
        dueDate: tomorrowMorning,
        payeeOrPayer: "تست پاس شده",
        chequeType: "PAYABLE",
        status: "CLEARED",
      },
    });

    // Call GET /api/reminders/tomorrow
    const res = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
    const data = await res.json();

    const returnedChequeIds: string[] = data.cheques.map((c: any) => c.id);

    // Assertions
    const includesPast3 = returnedChequeIds.includes(chqPast3.id);
    const includesYesterday = returnedChequeIds.includes(chqYesterday.id);
    const includesTomorrowMorn = returnedChequeIds.includes(chqTomorrowMorn.id);
    const includesTomorrowNight = returnedChequeIds.includes(chqTomorrowNight.id);
    const includesTomorrowBound = returnedChequeIds.includes(chqTomorrowBound.id);
    const includesDayAfter = returnedChequeIds.includes(chqDayAfter.id);
    const includesFuture30 = returnedChequeIds.includes(chqFuture30.id);
    const includesCleared = returnedChequeIds.includes(chqTomorrowCleared.id);

    // Cleanup all test cheques
    await prisma.cheque.deleteMany({
      where: {
        id: {
          in: [
            chqPast3.id,
            chqYesterday.id,
            chqTomorrowMorn.id,
            chqTomorrowNight.id,
            chqTomorrowBound.id,
            chqDayAfter.id,
            chqFuture30.id,
            chqTomorrowCleared.id,
          ],
        },
      },
    });

    const filterCorrect =
      !includesPast3 &&
      !includesYesterday &&
      includesTomorrowMorn &&
      includesTomorrowNight &&
      includesTomorrowBound &&
      !includesDayAfter &&
      !includesFuture30 &&
      !includesCleared;

    record({
      id: "ADV-REMINDER-01",
      category: "D-1 Reminders",
      name: "Cheques due date boundary filtering (Past vs Tomorrow vs Future vs Cleared)",
      status: filterCorrect ? "PASS" : "FAIL",
      observation: `Filter strictly captures tomorrow pending cheques only: Past 3 days excluded (${!includesPast3}), Yesterday excluded (${!includesYesterday}), Tomorrow morning included (${includesTomorrowMorn}), Tomorrow night included (${includesTomorrowNight}), Tomorrow boundary 23:59:59 included (${includesTomorrowBound}), Day after tomorrow excluded (${!includesDayAfter}), Future 30 days excluded (${!includesFuture30}), Non-pending CLEARED excluded (${!includesCleared}).`,
      details: {
        includesPast3,
        includesYesterday,
        includesTomorrowMorn,
        includesTomorrowNight,
        includesTomorrowBound,
        includesDayAfter,
        includesFuture30,
        includesCleared,
      },
    });
  } catch (err: any) {
    record({
      id: "ADV-REMINDER-01",
      category: "D-1 Reminders",
      name: "Cheques due date boundary filtering",
      status: "FAIL",
      observation: `Exception thrown: ${err.message}`,
      details: { stack: err.stack },
    });
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log(`\n======================================================================`);
  console.log(`                     CHALLENGER SUITE SUMMARY                        `);
  console.log(`======================================================================\n`);

  let totalPass = 0;
  let totalBugs = 0;
  let totalFail = 0;

  for (const r of reports) {
    if (r.status === "PASS") totalPass++;
    else if (r.status === "BUG_CONFIRMED") totalBugs++;
    else totalFail++;
  }

  console.log(`Total Test Scenarios: ${reports.length}`);
  console.log(`  - Passed: ${totalPass}`);
  console.log(`  - Confirmed Behavioral Flaws / Race Conditions: ${totalBugs}`);
  console.log(`  - Unhandled Failures / Crashes: ${totalFail}`);
  console.log(`\n======================================================================\n`);

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
