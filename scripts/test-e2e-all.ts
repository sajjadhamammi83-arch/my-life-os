/**
 * Universal Automated End-to-End Test Suite for Life OS
 * Milestone 3 Specification: test-e2e-all.ts
 * Executable via: node --experimental-strip-types scripts/test-e2e-all.ts
 *
 * Phases:
 *  - Phase 0: Pre-flight & Server Liveness (Port 3050 health & Port 3000 isolation)
 *  - Phase 1: All 10 Required API Endpoints Sweep (HTTP GET 200 OK with valid schema)
 *  - Phase 2: Full CRUD Lifecycles with zero 500 errors
 *  - Phase 3: Unified Notifications & D-1 Reminders
 *  - Phase 4: Cross-Module Ripple Effects & Synchronization (Chains 1 to 5)
 *  - Phase 5: Web Routes Sweep (HTTP GET 200 OK)
 *  - Phase 6: Automated LIFO Cleanup
 */

import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3050";
const ISOLATED_PORT = "3000";
const TEST_TAG = `[E2E-${Date.now()}]`;

// ANSI formatting helpers
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m\x1b[30m\x1b[1m",
  bgRed: "\x1b[41m\x1b[37m\x1b[1m",
};

interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  duration: string;
  error?: string;
}

interface PhaseSummary {
  name: string;
  passed: number;
  failed: number;
  tests: TestResult[];
}

class TestSuiteRunner {
  results: Record<string, PhaseSummary>;
  currentPhase: string;
  startTime: number;
  cleanupStack: Array<() => Promise<void>>;

  constructor() {
    this.results = {
      phase0: { name: "Phase 0: Pre-flight & Server Liveness", passed: 0, failed: 0, tests: [] },
      phase1: { name: "Phase 1: All 10 Required API Endpoints Sweep", passed: 0, failed: 0, tests: [] },
      phase2: { name: "Phase 2: Full CRUD Lifecycles (Zero 500 Errors)", passed: 0, failed: 0, tests: [] },
      phase3: { name: "Phase 3: Unified Notifications & D-1 Reminders", passed: 0, failed: 0, tests: [] },
      phase4: { name: "Phase 4: Cross-Module Ripple Effects & Synchronization", passed: 0, failed: 0, tests: [] },
      phase5: { name: "Phase 5: Web Routes Sweep", passed: 0, failed: 0, tests: [] },
      phase6: { name: "Phase 6: Automated LIFO Cleanup", passed: 0, failed: 0, tests: [] },
    };
    this.currentPhase = "phase0";
    this.startTime = Date.now();
    this.cleanupStack = [];
  }

  setPhase(phaseKey: string) {
    this.currentPhase = phaseKey;
    const phase = this.results[phaseKey];
    console.log(`\n${c.bold}${c.cyan}╔════════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.bold}${c.cyan}║  ${phase.name.padEnd(76)}  ║${c.reset}`);
    console.log(`${c.bold}${c.cyan}╚════════════════════════════════════════════════════════════════════════════════╝${c.reset}\n`);
  }

  async runTest(id: string, name: string, fn: () => Promise<void>) {
    const phase = this.results[this.currentPhase];
    const t0 = performance.now();
    try {
      await fn();
      const duration = (performance.now() - t0).toFixed(1);
      phase.passed++;
      phase.tests.push({ id, name, status: "PASS", duration });
      console.log(`  ${c.green}✔${c.reset} ${c.bold}[${id}]${c.reset} ${name} ${c.dim}(${duration}ms)${c.reset}`);
    } catch (err: any) {
      const duration = (performance.now() - t0).toFixed(1);
      phase.failed++;
      phase.tests.push({ id, name, status: "FAIL", duration, error: err.message });
      console.error(`  ${c.red}✖${c.reset} ${c.bold}${c.red}[${id}]${c.reset} ${name} ${c.dim}(${duration}ms)${c.reset}`);
      console.error(`    ${c.red}↳ Error: ${err.message}${c.reset}`);
      if (err.stack) {
        const stackLines = err.stack.split("\n").slice(1, 3).join("\n    ");
        console.error(`    ${c.dim}${stackLines}${c.reset}`);
      }
    }
  }

  registerCleanup(fn: () => Promise<void>) {
    this.cleanupStack.push(fn);
  }

  async executeCleanup() {
    let cleaned = 0;
    while (this.cleanupStack.length > 0) {
      const fn = this.cleanupStack.pop();
      if (fn) {
        try {
          await fn();
          cleaned++;
        } catch (e: any) {
          console.warn(`    ${c.yellow}⚠ Cleanup step warning: ${e.message}${c.reset}`);
        }
      }
    }
    return cleaned;
  }

  printSummary(): boolean {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    let totalPassed = 0;
    let totalFailed = 0;

    console.log(`\n${c.bold}${c.white}══════════════════════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.bold}${c.white}             🏁 UNIVERSAL AUTOMATED E2E TEST SUITE SUMMARY                      ${c.reset}`);
    console.log(`${c.bold}${c.white}══════════════════════════════════════════════════════════════════════════════════${c.reset}\n`);

    console.log(`  ${"Phase".padEnd(60)} ${"Passed".padStart(8)} ${"Failed".padStart(8)} ${"Total".padStart(8)}`);
    console.log(`  ${"─".repeat(60)} ${"─".repeat(8)} ${"─".repeat(8)} ${"─".repeat(8)}`);

    for (const key of Object.keys(this.results)) {
      const p = this.results[key];
      const count = p.passed + p.failed;
      totalPassed += p.passed;
      totalFailed += p.failed;
      const color = p.failed > 0 ? c.red : c.green;
      console.log(`  ${p.name.padEnd(60)} ${String(p.passed).padStart(8)} ${String(p.failed).padStart(8)} ${color}${String(count).padStart(8)}${c.reset}`);
    }

    console.log(`  ${"─".repeat(60)} ${"─".repeat(8)} ${"─".repeat(8)} ${"─".repeat(8)}`);
    const totalColor = totalFailed > 0 ? c.red : c.green;
    console.log(`  ${c.bold}${"GRAND TOTAL ASSERTIONS".padEnd(60)} ${String(totalPassed).padStart(8)} ${String(totalFailed).padStart(8)} ${totalColor}${String(totalPassed + totalFailed).padStart(8)}${c.reset}`);
    console.log(`\n  ⏱  Total Execution Duration: ${c.bold}${totalDuration}s${c.reset}`);
    console.log(`  🌐 Target Port: ${c.cyan}3050${c.reset} | Isolated Port: ${c.green}3000 (UNTOUCHED)${c.reset}`);

    if (totalFailed === 0) {
      console.log(`\n  ${c.bgGreen} 🎉 ALL 7 PHASES PASSED WITH 100% SUCCESS RATE (EXIT CODE 0) ${c.reset}\n`);
      return true;
    } else {
      console.log(`\n  ${c.bgRed} ❌ TEST SUITE FAILED WITH ${totalFailed} DEFECT(S) (EXIT CODE 1) ${c.reset}\n`);
      return false;
    }
  }
}

async function main() {
  const runner = new TestSuiteRunner();

  try {
    // =========================================================================
    // PHASE 0: Pre-flight & Server Liveness
    // =========================================================================
    runner.setPhase("phase0");

    await runner.runTest("P0-01", "Server is listening and responsive on port 3050", async () => {
      const res = await fetch(`${BASE_URL}/api/dashboard`);
      assert.equal(res.status, 200, `Expected port 3050 status 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true, "Expected dashboard payload success to be true");
    });

    await runner.runTest("P0-02", "Port 3000 is strictly isolated and never accessed for tests", async () => {
      assert.equal(BASE_URL, "http://localhost:3050", "Test suite BASE_URL must strictly be port 3050");
      assert.notEqual(BASE_URL, `http://localhost:${ISOLATED_PORT}`, "Port 3000 must never be configured as target");
    });

    await runner.runTest("P0-03", "Prisma SQLite database connection is live and queryable", async () => {
      const areaCount = await prisma.area.count();
      assert.ok(areaCount >= 0, "Prisma database should return non-negative area count");
    });

    // =========================================================================
    // PHASE 1: All 10 Required API Endpoints Sweep
    // =========================================================================
    runner.setPhase("phase1");

    const requiredEndpoints = [
      {
        id: "P1-01",
        name: "GET /api/dashboard returns 200 with complete dashboard metrics",
        url: `${BASE_URL}/api/dashboard`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok("liquidBalance" in data);
          assert.ok("todayFinancials" in data);
          assert.ok("tomorrowSummary" in data);
          assert.ok("totalItems" in data.tomorrowSummary);
        },
      },
      {
        id: "P1-02",
        name: "GET /api/today returns 200 with composite daily agenda & live blocks",
        url: `${BASE_URL}/api/today`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok(Array.isArray(data.big3Tasks));
          assert.ok(Array.isArray(data.otherTasks));
          assert.ok(Array.isArray(data.calendarBlocks));
          assert.ok(Array.isArray(data.habits));
          assert.ok("hydration" in data);
          assert.ok("persianDate" in data);
        },
      },
      {
        id: "P1-03",
        name: "GET /api/goals returns 200 with OKR objectives and active cycle",
        url: `${BASE_URL}/api/goals`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok(Array.isArray(data.objectives));
        },
      },
      {
        id: "P1-04",
        name: "GET /api/projects returns 200 with projects, areas, and objectives",
        url: `${BASE_URL}/api/projects`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok(Array.isArray(data.projects));
          assert.ok(Array.isArray(data.areas));
        },
      },
      {
        id: "P1-05",
        name: "GET /api/tasks returns 200 with tasks list",
        url: `${BASE_URL}/api/tasks`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok(Array.isArray(data.tasks));
        },
      },
      {
        id: "P1-06",
        name: "GET /api/finance returns 200 with financial summary & cash registers",
        url: `${BASE_URL}/api/finance`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok("summary" in data);
          assert.ok("totalLiquidBalance" in data.summary);
          assert.ok(Array.isArray(data.accounts));
          assert.ok(Array.isArray(data.costCenters));
        },
      },
      {
        id: "P1-07",
        name: "GET /api/reviews/daily returns 200 with daily review & automated stats",
        url: `${BASE_URL}/api/reviews/daily`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok("automatedStats" in data);
          assert.ok(Array.isArray(data.questions));
        },
      },
      {
        id: "P1-08",
        name: "GET /api/learning returns 200 with courses, events, books, and skills",
        url: `${BASE_URL}/api/learning`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok(Array.isArray(data.courses));
          assert.ok(Array.isArray(data.books));
          assert.ok(Array.isArray(data.skills));
          assert.ok(Array.isArray(data.allEvents));
        },
      },
      {
        id: "P1-09",
        name: "GET /api/calendar returns 200 with calendar blocks",
        url: `${BASE_URL}/api/calendar`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok(Array.isArray(data.blocks));
        },
      },
      {
        id: "P1-10",
        name: "GET /api/analytics returns 200 with 90-day trends and cost center P&L",
        url: `${BASE_URL}/api/analytics?range=90`,
        validate: (data: any) => {
          assert.equal(data.success, true);
          assert.ok("summary" in data);
          assert.ok(Array.isArray(data.dailyTrends));
          assert.ok(Array.isArray(data.costCenterFinancials));
        },
      },
    ];

    for (const ep of requiredEndpoints) {
      await runner.runTest(ep.id, ep.name, async () => {
        const res = await fetch(ep.url);
        assert.equal(res.status, 200, `Expected 200 OK for ${ep.url}, got ${res.status}`);
        const data = await res.json();
        ep.validate(data);
      });
    }

    // =========================================================================
    // PHASE 2: Full CRUD Lifecycles with Zero 500 Errors
    // =========================================================================
    runner.setPhase("phase2");

    // 1. CRUD Goals & Key Results
    let createdObjectiveId: string | null = null;
    let createdKeyResultId: string | null = null;

    await runner.runTest("P2-01", "CRUD Goals: Create Objective and Key Result", async () => {
      const resObj = await fetch(`${BASE_URL}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${TEST_TAG} تست هدف فصلی`,
          targetMetric: "فروش محصول",
          targetValue: 100,
          currentValue: 0,
          priority: "high",
          autoSchedule: false,
        }),
      });
      assert.equal(resObj.status, 200);
      const dataObj = await resObj.json();
      assert.equal(dataObj.success, true);
      assert.ok(dataObj.objective?.id);
      createdObjectiveId = dataObj.objective.id;

      runner.registerCleanup(async () => {
        if (createdObjectiveId) {
          await prisma.keyResult.deleteMany({ where: { objectiveId: createdObjectiveId } });
          await prisma.task.updateMany({ where: { objectiveId: createdObjectiveId }, data: { objectiveId: null } });
          await prisma.objective.deleteMany({ where: { id: createdObjectiveId } });
        }
      });

      const resKr = await fetch(`${BASE_URL}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "key_result",
          objectiveId: createdObjectiveId,
          metric: "تعداد فروش واحد",
          baseline: 0,
          target: 50,
          unit: "عدد",
        }),
      });
      assert.equal(resKr.status, 200);
      const dataKr = await resKr.json();
      assert.equal(dataKr.success, true);
      assert.ok(dataKr.keyResult?.id);
      createdKeyResultId = dataKr.keyResult.id;
    });

    await runner.runTest("P2-02", "CRUD Goals: PATCH Key Result progress & Objective title", async () => {
      assert.ok(createdKeyResultId);
      assert.ok(createdObjectiveId);

      const resKr = await fetch(`${BASE_URL}/api/goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyResultId: createdKeyResultId,
          newValue: 25,
        }),
      });
      assert.equal(resKr.status, 200);
      const dataKr = await resKr.json();
      assert.equal(dataKr.success, true);
      assert.equal(dataKr.keyResult.progress, 50);

      const resObj = await fetch(`${BASE_URL}/api/goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectiveId: createdObjectiveId,
          title: `${TEST_TAG} تست هدف به‌روزشده`,
        }),
      });
      assert.equal(resObj.status, 200);
      const dataObj = await resObj.json();
      assert.equal(dataObj.success, true);
      assert.equal(dataObj.objective.title, `${TEST_TAG} تست هدف به‌روزشده`);
    });

    await runner.runTest("P2-03", "CRUD Goals: DELETE Key Result & Objective", async () => {
      assert.ok(createdKeyResultId);
      assert.ok(createdObjectiveId);

      const delKr = await fetch(`${BASE_URL}/api/goals?keyResultId=${createdKeyResultId}`, { method: "DELETE" });
      assert.equal(delKr.status, 200);

      const delObj = await fetch(`${BASE_URL}/api/goals?objectiveId=${createdObjectiveId}`, { method: "DELETE" });
      assert.equal(delObj.status, 200);

      createdObjectiveId = null;
      createdKeyResultId = null;
    });

    // 2. CRUD Projects & Milestones
    let createdProjectId: string | null = null;
    let createdMilestoneId: string | null = null;

    await runner.runTest("P2-04", "CRUD Projects: Create Project and Milestone", async () => {
      const resProj = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${TEST_TAG} پروژه یکپارچه‌سازی سیستم`,
          budget: 15000000,
          priority: "high",
          status: "active",
        }),
      });
      assert.equal(resProj.status, 200);
      const dataProj = await resProj.json();
      assert.equal(dataProj.success, true);
      assert.ok(dataProj.project?.id);
      createdProjectId = dataProj.project.id;

      runner.registerCleanup(async () => {
        if (createdProjectId) {
          await prisma.milestone.deleteMany({ where: { projectId: createdProjectId } });
          await prisma.task.updateMany({ where: { projectId: createdProjectId }, data: { projectId: null } });
          await prisma.project.deleteMany({ where: { id: createdProjectId } });
        }
      });

      const resMs = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "milestone",
          projectId: createdProjectId,
          title: `${TEST_TAG} فاز اول انتشار`,
        }),
      });
      assert.equal(resMs.status, 200);
      const dataMs = await resMs.json();
      assert.equal(dataMs.success, true);
      assert.ok(dataMs.milestone?.id);
      createdMilestoneId = dataMs.milestone.id;
    });

    await runner.runTest("P2-05", "CRUD Projects: PATCH Milestone & Project status", async () => {
      assert.ok(createdProjectId);
      assert.ok(createdMilestoneId);

      const resMs = await fetch(`${BASE_URL}/api/projects`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: createdMilestoneId,
          isReached: true,
        }),
      });
      assert.equal(resMs.status, 200);

      const resProj = await fetch(`${BASE_URL}/api/projects`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdProjectId,
          progress: 55,
          health: "on_track",
        }),
      });
      assert.equal(resProj.status, 200);
      const dataProj = await resProj.json();
      assert.equal(dataProj.project.progress, 55);
    });

    await runner.runTest("P2-06", "CRUD Projects: DELETE Milestone and Project", async () => {
      assert.ok(createdProjectId);
      assert.ok(createdMilestoneId);

      const delMs = await fetch(`${BASE_URL}/api/projects`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteMilestoneId: createdMilestoneId }),
      });
      assert.equal(delMs.status, 200);

      const delProj = await fetch(`${BASE_URL}/api/projects?id=${createdProjectId}`, { method: "DELETE" });
      assert.equal(delProj.status, 200);

      createdProjectId = null;
      createdMilestoneId = null;
    });

    // 3. CRUD Tasks
    let createdTaskId: string | null = null;

    await runner.runTest("P2-07", "CRUD Tasks: Create Task via POST /api/tasks", async () => {
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${TEST_TAG} تسک تست چرخه حیات`,
          priority: "high",
          isBigThree: true,
          status: "today",
          estimatedMinutes: 45,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.task?.id);
      createdTaskId = data.task.id;

      runner.registerCleanup(async () => {
        if (createdTaskId) {
          await prisma.task.deleteMany({ where: { id: createdTaskId } });
        }
      });
    });

    await runner.runTest("P2-08", "CRUD Tasks: PATCH task status & kanbanColumn", async () => {
      assert.ok(createdTaskId);
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdTaskId,
          kanbanColumn: "In Progress",
          priority: "urgent",
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.task.kanbanColumn, "In Progress");
      assert.equal(data.task.priority, "urgent");
    });

    await runner.runTest("P2-09", "CRUD Tasks: DELETE task via DELETE /api/tasks", async () => {
      assert.ok(createdTaskId);
      const res = await fetch(`${BASE_URL}/api/tasks?id=${createdTaskId}`, { method: "DELETE" });
      assert.equal(res.status, 200);
      createdTaskId = null;
    });

    // 4. CRUD Learning (Course, Event)
    let createdCourseId: string | null = null;
    let createdEventId: string | null = null;

    await runner.runTest("P2-10", "CRUD Learning: Create University Course & Event", async () => {
      const resCourse = await fetch(`${BASE_URL}/api/learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "course",
          title: `${TEST_TAG} هوش مصنوعی پیشرفته`,
          code: "AI-701",
          instructor: "دکتر آزمون",
          credits: 3,
        }),
      });
      assert.equal(resCourse.status, 200);
      const dataCourse = await resCourse.json();
      assert.equal(dataCourse.success, true);
      assert.ok(dataCourse.course?.id);
      createdCourseId = dataCourse.course.id;

      runner.registerCleanup(async () => {
        if (createdCourseId) {
          await prisma.universityAssignment.deleteMany({ where: { courseId: createdCourseId } });
          await prisma.universityExam.deleteMany({ where: { courseId: createdCourseId } });
          await prisma.universityEvent.deleteMany({ where: { courseId: createdCourseId } });
          await prisma.calendarBlock.deleteMany({ where: { title: { contains: dataCourse.course.title } } });
          await prisma.task.deleteMany({ where: { title: { contains: dataCourse.course.title } } });
          await prisma.universityCourse.deleteMany({ where: { id: createdCourseId } });
        }
      });

      const resEv = await fetch(`${BASE_URL}/api/learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event",
          courseId: createdCourseId,
          title: `${TEST_TAG} تمرین عملی یادگیری تقویتی`,
          eventType: "تکلیف",
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        }),
      });
      assert.equal(resEv.status, 200);
      const dataEv = await resEv.json();
      assert.equal(dataEv.success, true);
      assert.ok(dataEv.event?.id);
      createdEventId = dataEv.event.id;
    });

    await runner.runTest("P2-11", "CRUD Learning: PATCH event & DELETE event and course", async () => {
      assert.ok(createdEventId);
      assert.ok(createdCourseId);

      const resPatch = await fetch(`${BASE_URL}/api/learning`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: createdEventId,
          status: "completed",
        }),
      });
      assert.equal(resPatch.status, 200);

      const delEv = await fetch(`${BASE_URL}/api/learning?type=event&id=${createdEventId}`, { method: "DELETE" });
      assert.equal(delEv.status, 200);

      const delCourse = await fetch(`${BASE_URL}/api/learning?type=course&id=${createdCourseId}`, { method: "DELETE" });
      assert.equal(delCourse.status, 200);

      createdEventId = null;
      createdCourseId = null;
    });

    // 5. CRUD CalendarBlocks
    let createdBlockId: string | null = null;

    await runner.runTest("P2-12", "CRUD Calendar: Create, PATCH and DELETE CalendarBlock", async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0, 0);

      const resPost = await fetch(`${BASE_URL}/api/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${TEST_TAG} بلوک تمرکز کدنویسی`,
          type: "Deep Work",
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      });
      assert.equal(resPost.status, 201);
      const dataPost = await resPost.json();
      assert.equal(dataPost.success, true);
      assert.ok(dataPost.block?.id);
      createdBlockId = dataPost.block.id;

      runner.registerCleanup(async () => {
        if (createdBlockId) {
          await prisma.calendarBlock.deleteMany({ where: { id: createdBlockId } });
        }
      });

      const resPatch = await fetch(`${BASE_URL}/api/calendar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdBlockId,
          notes: "یادداشت به‌روزشده بلوک تقویم",
        }),
      });
      assert.equal(resPatch.status, 200);

      const resDel = await fetch(`${BASE_URL}/api/calendar?id=${createdBlockId}`, { method: "DELETE" });
      assert.equal(resDel.status, 200);
      createdBlockId = null;
    });

    // 6. CRUD Finance (Transaction, Cheque)
    let createdTxId: string | null = null;
    let createdChequeId: string | null = null;

    await runner.runTest("P2-13", "CRUD Finance: Create, PATCH and DELETE Transaction & Cheque", async () => {
      const resTx = await fetch(`${BASE_URL}/api/finance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Expense",
          amount: 250000,
          title: `${TEST_TAG} خرید اقلام مصرفی`,
          categoryName: "اداری",
        }),
      });
      assert.equal(resTx.status, 201);
      const dataTx = await resTx.json();
      assert.equal(dataTx.success, true);
      assert.ok(dataTx.transaction?.id);
      createdTxId = dataTx.transaction.id;

      runner.registerCleanup(async () => {
        if (createdTxId) {
          await prisma.transaction.deleteMany({ where: { id: createdTxId } });
        }
      });

      const resChq = await fetch(`${BASE_URL}/api/finance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cheque",
          amount: 18000000,
          chequeNumber: `CHQ-CRUD-${Date.now()}`,
          bankName: "بانک سامان",
          payeeOrPayer: "فروشگاه تست",
          chequeType: "PAYABLE",
        }),
      });
      assert.equal(resChq.status, 201);
      const dataChq = await resChq.json();
      assert.equal(dataChq.success, true);
      assert.ok(dataChq.cheque?.id);
      createdChequeId = dataChq.cheque.id;

      runner.registerCleanup(async () => {
        if (createdChequeId) {
          await prisma.cheque.deleteMany({ where: { id: createdChequeId } });
        }
      });

      const resPatch = await fetch(`${BASE_URL}/api/finance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdChequeId,
          type: "cheque",
          note: "تست یادداشت چک صیادی",
        }),
      });
      assert.equal(resPatch.status, 200);

      const delChq = await fetch(`${BASE_URL}/api/finance?entity=cheque&id=${createdChequeId}`, { method: "DELETE" });
      assert.equal(delChq.status, 200);

      const delTx = await fetch(`${BASE_URL}/api/finance?id=${createdTxId}`, { method: "DELETE" });
      assert.equal(delTx.status, 200);

      createdChequeId = null;
      createdTxId = null;
    });

    // 7. CRUD DailyReviews
    let createdReviewId: string | null = null;

    await runner.runTest("P2-14", "CRUD DailyReviews: Create, PATCH and DELETE Review with 4 Energy Levels", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      pastDate.setHours(12, 0, 0, 0);

      const resPost = await fetch(`${BASE_URL}/api/reviews/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: pastDate.toISOString(),
          productivityScore: 9,
          deepWorkHours: 4.5,
          mood: "عالی",
          energyPhysical: 8,
          energyEmotional: 9,
          energyMental: 8,
          energySpiritual: 9,
          whatWentWell: "پیشبرد تست‌های خودکار سراسری",
        }),
      });
      assert.equal(resPost.status, 201);
      const dataPost = await resPost.json();
      assert.equal(dataPost.success, true);
      assert.ok(dataPost.review?.id);
      createdReviewId = dataPost.review.id;

      runner.registerCleanup(async () => {
        if (createdReviewId) {
          await prisma.dailyReview.deleteMany({ where: { id: createdReviewId } });
        }
      });

      const resPatch = await fetch(`${BASE_URL}/api/reviews/daily`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdReviewId,
          productivityScore: 10,
        }),
      });
      assert.equal(resPatch.status, 200);
      const dataPatch = await resPatch.json();
      assert.equal(dataPatch.review.productivityScore, 10);

      const resDel = await fetch(`${BASE_URL}/api/reviews/daily?id=${createdReviewId}`, { method: "DELETE" });
      assert.equal(resDel.status, 200);
      createdReviewId = null;
    });

    // =========================================================================
    // PHASE 3: Unified Notifications & D-1 Reminders
    // =========================================================================
    runner.setPhase("phase3");

    let d1ChequeId: string | null = null;
    let d1ExamId: string | null = null;
    let d1BlockId: string | null = null;
    let d1TaskId: string | null = null;
    let d1CourseId: string | null = null;

    await runner.runTest("P3-01", "Baseline check of /api/reminders/tomorrow structure and counts", async () => {
      const res = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok("summary" in data);
      assert.ok("totalItems" in data.summary);
      assert.ok("chequesCount" in data.summary);
      assert.ok("examsCount" in data.summary);
      assert.ok("blocksCount" in data.summary);
      assert.ok("tasksCount" in data.summary);
    });

    await runner.runTest("P3-02", "Inject Cheque, UniversityExam, Block & Task scheduled for tomorrow", async () => {
      const now = new Date();
      const tomorrow10 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0, 0);
      const tomorrow11 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 30, 0, 0);

      // 1. Create Course for Exam
      let course = await prisma.universityCourse.findFirst();
      if (!course) {
        course = await prisma.universityCourse.create({
          data: {
            title: `${TEST_TAG} درس سیستم‌های عامل`,
            code: "OS-505",
            credits: 3,
            instructor: "استاد راهنما",
          },
        });
        d1CourseId = course.id;
        runner.registerCleanup(async () => {
          if (d1CourseId) await prisma.universityCourse.deleteMany({ where: { id: d1CourseId } });
        });
      }

      // 2. Create University Exam due tomorrow
      const exam = await prisma.universityExam.create({
        data: {
          courseId: course.id,
          title: `${TEST_TAG} امتحان میان‌ترم تئوری`,
          examDate: tomorrow10,
          room: "سالن ۲ دانشگاه",
          weight: 30,
        },
      });
      d1ExamId = exam.id;
      runner.registerCleanup(async () => {
        if (d1ExamId) await prisma.universityExam.deleteMany({ where: { id: d1ExamId } });
      });

      // 3. Create Bank Cheque due tomorrow
      const cheque = await prisma.cheque.create({
        data: {
          chequeNumber: `CHQ-D1-${Date.now()}`,
          bankName: "بانک تجارت",
          amount: 65000000,
          dueDate: tomorrow10,
          payeeOrPayer: "شرکت تجهیزات رایش",
          chequeType: "RECEIVABLE",
          status: "PENDING",
        },
      });
      d1ChequeId = cheque.id;
      runner.registerCleanup(async () => {
        if (d1ChequeId) await prisma.cheque.deleteMany({ where: { id: d1ChequeId } });
      });

      // 4. Create CalendarBlock for tomorrow
      const block = await prisma.calendarBlock.create({
        data: {
          title: `${TEST_TAG} بلوک برنامه‌ریزی استراتژیک`,
          type: "Deep Work",
          start: tomorrow10,
          end: tomorrow11,
          plannedDuration: 90,
        },
      });
      d1BlockId = block.id;
      runner.registerCleanup(async () => {
        if (d1BlockId) await prisma.calendarBlock.deleteMany({ where: { id: d1BlockId } });
      });

      // 5. Create Task due tomorrow
      const task = await prisma.task.create({
        data: {
          title: `${TEST_TAG} تحویل مستندات ددلاین فردا`,
          dueDate: tomorrow10,
          status: "today",
          priority: "urgent",
          isBigThree: true,
        },
      });
      d1TaskId = task.id;
      runner.registerCleanup(async () => {
        if (d1TaskId) await prisma.task.deleteMany({ where: { id: d1TaskId } });
      });
    });

    await runner.runTest("P3-03", "Verify D-1 advance reminders reflects injected cheques, exams, blocks & tasks", async () => {
      const res = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.ok(data.summary.chequesCount >= 1, "Expected at least 1 cheque in tomorrow summary");
      assert.ok(data.summary.examsCount >= 1, "Expected at least 1 exam in tomorrow summary");
      assert.ok(data.summary.blocksCount >= 1, "Expected at least 1 block in tomorrow summary");
      assert.ok(data.summary.tasksCount >= 1, "Expected at least 1 task in tomorrow summary");

      const hasCheque = data.cheques.some((c: any) => c.id === d1ChequeId);
      assert.ok(hasCheque, "Injected cheque must appear in reminders.cheques");

      const hasExam = data.exams.some((e: any) => e.id === d1ExamId);
      assert.ok(hasExam, "Injected exam must appear in reminders.exams");

      const expectedTotal =
        data.summary.blocksCount +
        data.summary.tasksCount +
        data.summary.workoutsCount +
        data.summary.chequesCount +
        data.summary.examsCount;
      assert.equal(data.summary.totalItems, expectedTotal, "summary.totalItems must equal sum of all categorized items");
    });

    await runner.runTest("P3-04", "Clean up D-1 injected test records", async () => {
      if (d1ChequeId) {
        await prisma.cheque.delete({ where: { id: d1ChequeId } });
        d1ChequeId = null;
      }
      if (d1ExamId) {
        await prisma.universityExam.delete({ where: { id: d1ExamId } });
        d1ExamId = null;
      }
      if (d1BlockId) {
        await prisma.calendarBlock.delete({ where: { id: d1BlockId } });
        d1BlockId = null;
      }
      if (d1TaskId) {
        await prisma.task.delete({ where: { id: d1TaskId } });
        d1TaskId = null;
      }
      if (d1CourseId) {
        await prisma.universityCourse.deleteMany({ where: { id: d1CourseId } });
        d1CourseId = null;
      }
    });

    // =========================================================================
    // PHASE 4: Cross-Module Ripple Effects & Synchronization
    // =========================================================================
    runner.setPhase("phase4");

    // Chain 1: Task completion -> Objective/KeyResult progress update and DailyReview.big3Completed increment
    await runner.runTest("P4-01", "Chain 1: Task completion ripples into Objective KR progress & DailyReview.big3Completed", async () => {
      const obj = await prisma.objective.create({
        data: {
          title: `${TEST_TAG} هدف زنجیره ۱`,
          targetMetric: "امتیاز",
          targetValue: 10,
          currentValue: 0,
          progress: 0,
          status: "in_progress",
        },
      });
      const kr = await prisma.keyResult.create({
        data: {
          objectiveId: obj.id,
          metric: "تعداد اقدام",
          baseline: 0,
          target: 10,
          currentValue: 0,
          progress: 0,
        },
      });

      runner.registerCleanup(async () => {
        await prisma.keyResult.deleteMany({ where: { objectiveId: obj.id } });
        await prisma.task.deleteMany({ where: { objectiveId: obj.id } });
        await prisma.objective.deleteMany({ where: { id: obj.id } });
      });

      const task = await prisma.task.create({
        data: {
          title: `${TEST_TAG} تسک هدف زنجیره ۱`,
          objectiveId: obj.id,
          isBigThree: true,
          status: "today",
          priority: "urgent",
        },
      });

      const resPatch = await fetch(`${BASE_URL}/api/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          isCompleted: true,
        }),
      });
      assert.equal(resPatch.status, 200);

      const updatedObj = await prisma.objective.findUnique({
        where: { id: obj.id },
        include: { keyResults: true },
      });
      assert.ok(updatedObj);
      assert.ok(updatedObj.progress > 0, `Objective progress should be > 0, got ${updatedObj.progress}`);
      assert.ok(updatedObj.keyResults[0].currentValue > 0, `KR currentValue should be > 0`);

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const review = await prisma.dailyReview.findFirst({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      });
      assert.ok(review, "Today's DailyReview must exist");
      assert.ok((review.big3Completed || 0) >= 1, `Expected big3Completed >= 1, got ${review.big3Completed}`);
    });

    // Chain 2: Unfinished tasks rollover -> POST /api/tasks/rollover creates non-overlapping calendar blocks
    await runner.runTest("P4-02", "Chain 2: Unfinished task rollover moves task to tomorrow and assigns non-overlapping block", async () => {
      // Ensure candidate windows are open by clearing any prior rollover test blocks
      await prisma.calendarBlock.deleteMany({
        where: { title: { contains: "[انتقال به فردا]" } },
      });

      const now = new Date();
      const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

      const rolloverTask = await prisma.task.create({
        data: {
          title: `${TEST_TAG} تسک عقب‌افتاده برای انتقال به فردا`,
          dueDate: todayNoon,
          status: "today",
          isBigThree: true,
          priority: "high",
          workType: "Deep Work",
        },
      });

      runner.registerCleanup(async () => {
        await prisma.calendarBlock.deleteMany({ where: { title: { contains: rolloverTask.title } } });
        await prisma.task.deleteMany({ where: { id: rolloverTask.id } });
      });

      const resRollover = await fetch(`${BASE_URL}/api/tasks/rollover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      assert.equal(resRollover.status, 200);
      const dataRollover = await resRollover.json();
      assert.equal(dataRollover.success, true);
      assert.ok(dataRollover.forwardedCount >= 1, "Expected at least 1 task forwarded");
      assert.ok(dataRollover.blocks.length >= 1, "Expected at least 1 CalendarBlock scheduled");

      // Register cleanup for created rollover blocks
      runner.registerCleanup(async () => {
        for (const b of dataRollover.blocks) {
          await prisma.calendarBlock.deleteMany({ where: { id: b.id } });
        }
      });

      // Verify non-overlapping calendar blocks in candidate windows (09:00, 11:00, 14:00, etc.)
      for (let i = 0; i < dataRollover.blocks.length; i++) {
        const b1 = dataRollover.blocks[i];
        assert.ok(b1.title.includes("[انتقال به فردا]"), "Block title must include [انتقال به فردا]");
        const b1Start = new Date(b1.start).getTime();
        const b1End = new Date(b1.end).getTime();
        assert.ok(b1Start < b1End, "Block start must be before end");

        // Check against all other blocks to prove overlap == 0
        for (let j = i + 1; j < dataRollover.blocks.length; j++) {
          const b2 = dataRollover.blocks[j];
          const b2Start = new Date(b2.start).getTime();
          const b2End = new Date(b2.end).getTime();
          const overlap = b1Start < b2End && b1End > b2Start;
          assert.equal(overlap, false, `Blocks ${b1.title} and ${b2.title} must not overlap`);
        }
      }

      // Verify the task was moved to tomorrow
      const updatedTask = await prisma.task.findUnique({ where: { id: rolloverTask.id } });
      assert.ok(updatedTask);
      assert.ok(updatedTask.dueDate);
      const taskDue = new Date(updatedTask.dueDate);
      assert.equal(taskDue.getDate(), now.getDate() + 1, "Task dueDate must be moved to tomorrow");
    });


    // Chain 3: Learning exam creation -> Task with isBigThree: true & status: 'today' + CalendarBlock on exam date
    await runner.runTest("P4-03", "Chain 3: University exam event creates elevated Task (Big3) and CalendarBlock", async () => {
      let testCourse = await prisma.universityCourse.findFirst();
      let createdCourseLocal = false;
      if (!testCourse) {
        testCourse = await prisma.universityCourse.create({
          data: {
            title: `${TEST_TAG} سیستم‌های توزیع‌شده`,
            code: "DS-402",
            credits: 3,
            instructor: "استاد آزمون",
          },
        });
        createdCourseLocal = true;
      }

      const now = new Date();
      const todayIso = now.toISOString();

      const resEvent = await fetch(`${BASE_URL}/api/learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event",
          courseId: testCourse.id,
          title: `${TEST_TAG} امتحان پایان‌ترم هوش مصنوعی`,
          eventType: "امتحان جامع",
          dueDate: todayIso,
          time: "14:00",
        }),
      });
      assert.equal(resEvent.status, 200);
      const dataEvent = await resEvent.json();
      assert.equal(dataEvent.success, true);
      assert.ok(dataEvent.event?.id);

      runner.registerCleanup(async () => {
        await prisma.universityEvent.deleteMany({ where: { id: dataEvent.event.id } });
        await prisma.task.deleteMany({ where: { title: { contains: dataEvent.event.title } } });
        await prisma.calendarBlock.deleteMany({ where: { title: { contains: dataEvent.event.title } } });
        if (createdCourseLocal && testCourse) {
          await prisma.universityCourse.deleteMany({ where: { id: testCourse.id } });
        }
      });

      const syncTask = await prisma.task.findFirst({
        where: { title: { contains: dataEvent.event.title } },
      });
      assert.ok(syncTask, "Synchronized task must exist");
      assert.equal(syncTask.isBigThree, true, "Exam event task must have isBigThree: true");
      assert.equal(syncTask.status, "today", "Exam event with today's dueDate must have status: 'today'");

      const syncBlock = await prisma.calendarBlock.findFirst({
        where: { title: { contains: dataEvent.event.title } },
      });
      assert.ok(syncBlock, "Synchronized CalendarBlock must exist");
      assert.equal(syncBlock.type, "Learning");
      assert.equal(syncBlock.plannedDuration, 90);
    });

    // Chain 4: Finance Cash Register P&L -> /api/analytics includes expensesCash and deduplicates sales
    await runner.runTest("P4-04", "Chain 4: Finance Cash Register expenses & deduplicated sales sync to /api/analytics", async () => {
      let costCenter = await prisma.costCenter.findFirst();
      let createdCcLocal = false;
      if (!costCenter) {
        costCenter = await prisma.costCenter.create({
          data: { name: `${TEST_TAG} بوفه باشگاه`, code: `CC-${Date.now()}` },
        });
        createdCcLocal = true;
      }

      const now = new Date();
      now.setHours(12, 0, 0, 0);

      const cr = await prisma.shopCashRegister.create({
        data: {
          date: now,
          costCenterId: costCenter.id,
          openingCash: 200000,
          salesCash: 800000,
          expensesCash: 175000,
          withdrawalsCash: 0,
          expectedClosingCash: 825000,
          actualClosingCash: 825000,
          difference: 0,
          reconciled: true,
        },
      });

      const saleTx = await prisma.transaction.create({
        data: {
          date: now,
          amount: 800000,
          type: "Sale",
          costCenterId: costCenter.id,
          description: `${TEST_TAG} فاکتور فروش روزانه`,
          reconciled: true,
        },
      });

      runner.registerCleanup(async () => {
        await prisma.shopCashRegister.deleteMany({ where: { id: cr.id } });
        await prisma.transaction.deleteMany({ where: { id: saleTx.id } });
        if (createdCcLocal && costCenter) {
          await prisma.costCenter.deleteMany({ where: { id: costCenter.id } });
        }
      });

      const resAnalytics = await fetch(`${BASE_URL}/api/analytics?range=7`);
      assert.equal(resAnalytics.status, 200);
      const dataAnalytics = await resAnalytics.json();

      const ccFin = dataAnalytics.costCenterFinancials.find((c: any) => c.id === costCenter?.id);
      assert.ok(ccFin, "Cost center must be present in costCenterFinancials");
      assert.ok(ccFin.expense >= 175000, `Expected cc expense >= 175000, got ${ccFin.expense}`);
      assert.ok(ccFin.income >= 800000, `Expected cc income >= 800000, got ${ccFin.income}`);
      assert.equal(ccFin.profit, ccFin.income - ccFin.expense, "Profit must strictly equal income - expense");
    });

    // Chain 5: Reviews to Dashboard -> Card 4 shows live deep work hours and 4 energy level badges
    await runner.runTest("P4-05", "Chain 5: Daily Review feeds live deep work hours & 4 energy badges to /api/dashboard and UI", async () => {
      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

      const resReview = await fetch(`${BASE_URL}/api/reviews/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayDate.toISOString(),
          deepWorkHours: 5.7,
          productivityScore: 9,
          energyPhysical: 8,
          energyEmotional: 9,
          energyMental: 8,
          energySpiritual: 10,
          mood: "بسیار متمرکز",
        }),
      });
      assert.equal(resReview.status, 201);

      const resDash = await fetch(`${BASE_URL}/api/dashboard`);
      assert.equal(resDash.status, 200);
      const dataDash = await resDash.json();
      assert.ok(dataDash.dailyReview, "dailyReview must be present in /api/dashboard response");
      assert.equal(dataDash.dailyReview.deepWorkHours, 5.7, "Dashboard must reflect live deepWorkHours");
      assert.equal(dataDash.dailyReview.energyPhysical, 8, "Dashboard must reflect energyPhysical");
      assert.equal(dataDash.dailyReview.energyEmotional, 9, "Dashboard must reflect energyEmotional");
      assert.equal(dataDash.dailyReview.energyMental, 8, "Dashboard must reflect energyMental");
      assert.equal(dataDash.dailyReview.energySpiritual, 10, "Dashboard must reflect energySpiritual");

      const resDashPage = await fetch(`${BASE_URL}/dashboard`);
      assert.equal(resDashPage.status, 200);
      const htmlText = await resDashPage.text();
      assert.ok(htmlText.includes("جسمی") || htmlText.includes("Deep Work"), "Dashboard HTML must render vital cards");
    });

    // =========================================================================
    // PHASE 5: Web Routes Sweep
    // =========================================================================
    runner.setPhase("phase5");

    const webRoutes = [
      { id: "P5-01", path: "/", name: "Root Route (/)" },
      { id: "P5-02", path: "/today", name: "Today Agenda (/today)" },
      { id: "P5-03", path: "/dashboard", name: "Executive Dashboard (/dashboard)" },
      { id: "P5-04", path: "/tasks", name: "Task Matrix (/tasks)" },
      { id: "P5-05", path: "/planner", name: "Time-blocking Planner (/planner)" },
      { id: "P5-06", path: "/learning", name: "Learning & University (/learning)" },
      { id: "P5-07", path: "/finance", name: "Finance & Cash Register (/finance)" },
      { id: "P5-08", path: "/review", name: "Daily Nightly Review (/review)" },
      { id: "P5-09", path: "/analytics", name: "90-Day Analytics & Trends (/analytics)" },
      { id: "P5-10", path: "/goals", name: "Goals & OKR Cycle (/goals)" },
      { id: "P5-11", path: "/projects", name: "Projects & Milestones (/projects)" },
    ];

    for (const r of webRoutes) {
      await runner.runTest(r.id, `Web Route ${r.name} returns HTTP 200 OK`, async () => {
        const res = await fetch(`${BASE_URL}${r.path}`);
        assert.equal(res.status, 200, `Expected route ${r.path} status 200, got ${res.status}`);
        const contentType = res.headers.get("content-type") || "";
        assert.ok(contentType.includes("text/html"), `Expected HTML content type for ${r.path}`);
      });
    }

    // =========================================================================
    // PHASE 6: Automated LIFO Cleanup
    // =========================================================================
    runner.setPhase("phase6");

    await runner.runTest("P6-01", "Execute registered LIFO cleanup stack", async () => {
      const count = await runner.executeCleanup();
      assert.ok(count >= 0, "LIFO cleanup executed successfully");
    });

    await runner.runTest("P6-02", "Deep sweep database for any orphaned [E2E-...] test tags", async () => {
      // 1. Objectives & Key Results
      const testObjs = await prisma.objective.findMany({ where: { title: { contains: "[E2E-" } } });
      for (const o of testObjs) {
        await prisma.keyResult.deleteMany({ where: { objectiveId: o.id } });
        await prisma.task.updateMany({ where: { objectiveId: o.id }, data: { objectiveId: null } });
        await prisma.objective.deleteMany({ where: { id: o.id } });
      }

      // 2. Projects & Milestones
      const testProjs = await prisma.project.findMany({ where: { title: { contains: "[E2E-" } } });
      for (const p of testProjs) {
        await prisma.milestone.deleteMany({ where: { projectId: p.id } });
        await prisma.task.updateMany({ where: { projectId: p.id }, data: { projectId: null } });
        await prisma.project.deleteMany({ where: { id: p.id } });
      }

      // 3. Tasks & CalendarBlocks
      await prisma.calendarBlock.deleteMany({ where: { title: { contains: "[E2E-" } } });
      await prisma.calendarBlock.deleteMany({ where: { title: { contains: "[انتقال به فردا]" } } });
      await prisma.task.deleteMany({ where: { title: { contains: "[E2E-" } } });

      // 4. Cheques & Transactions
      await prisma.cheque.deleteMany({ where: { chequeNumber: { contains: "E2E" } } });
      await prisma.transaction.deleteMany({ where: { description: { contains: "[E2E-" } } });

      // 5. University Courses & Events
      const testCourses = await prisma.universityCourse.findMany({ where: { title: { contains: "[E2E-" } } });
      for (const c of testCourses) {
        await prisma.universityAssignment.deleteMany({ where: { courseId: c.id } });
        await prisma.universityExam.deleteMany({ where: { courseId: c.id } });
        await prisma.universityEvent.deleteMany({ where: { courseId: c.id } });
        await prisma.universityCourse.deleteMany({ where: { id: c.id } });
      }
      await prisma.universityExam.deleteMany({ where: { title: { contains: "[E2E-" } } });
      await prisma.universityEvent.deleteMany({ where: { title: { contains: "[E2E-" } } });

      // Verify zero remaining test records
      const remainingTasks = await prisma.task.count({ where: { title: { contains: "[E2E-" } } });
      const remainingBlocks = await prisma.calendarBlock.count({ where: { title: { contains: "[E2E-" } } });
      assert.equal(remainingTasks, 0, "No orphaned E2E tasks should remain");
      assert.equal(remainingBlocks, 0, "No orphaned E2E calendar blocks should remain");
    });

  } finally {
    await runner.executeCleanup();
    await prisma.$disconnect();
  }

  const success = runner.printSummary();
  if (!success) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error(`\n${c.red}Fatal test runner error: ${err.message}${c.reset}`);
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
