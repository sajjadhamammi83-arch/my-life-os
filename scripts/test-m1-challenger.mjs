/**
 * scripts/test-m1-challenger.mjs
 * Empirical Challenge & Stress-Testing Suite for Milestone 1:
 * D-1 Advance Reminders & Future Events (Port 3050)
 *
 * Authored by: Challenger 1 (m1_chal_1)
 */

import assert from "node:assert/strict";

const BASE_URL = "http://127.0.0.1:3050";

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

let passedCount = 0;
let failedCount = 0;
const failures = [];
const passes = [];

function pass(name, detail = "") {
  passedCount++;
  passes.push({ name, detail });
  console.log(`  ${ANSI.green}✓ PASS:${ANSI.reset} ${name} ${detail ? ANSI.cyan + "(" + detail + ")" + ANSI.reset : ""}`);
}

function fail(name, error, detail = "") {
  failedCount++;
  const msg = error?.message || String(error);
  failures.push({ name, error: msg, detail });
  console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} ${name} -> ${ANSI.yellow}${msg}${ANSI.reset} ${detail ? ANSI.cyan + "(" + detail + ")" + ANSI.reset : ""}`);
}

async function runSuite() {
  console.log(`\n${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}⚡ LIFE OS MILESTONE 1 EMPIRICAL CHALLENGER STRESS SUITE${ANSI.reset}`);
  console.log(`${ANSI.bold}Target: ${BASE_URL} | Port Isolation: 3050 only, 3000 untouched${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}\n`);

  // ---------------------------------------------------------------------------
  // SUITE 1: Port Isolation & Health Verification
  // ---------------------------------------------------------------------------
  console.log(`${ANSI.bold}📡 SUITE 1: Port Isolation & Service Health${ANSI.reset}`);
  try {
    const res = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
    assert.equal(res.status, 200, `Expected 200 OK from port 3050, got ${res.status}`);
    pass("Port 3050 responds with HTTP 200 OK", `status: ${res.status}`);
  } catch (e) {
    fail("Port 3050 responds with HTTP 200 OK", e);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: Schema & Type Assertions for GET /api/reminders/tomorrow
  // ---------------------------------------------------------------------------
  console.log(`\n${ANSI.bold}📋 SUITE 2: GET /api/reminders/tomorrow Schema & Invariants${ANSI.reset}`);
  let initialTomorrowData = null;
  try {
    const res = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
    const data = await res.json();
    initialTomorrowData = data;

    // Structure assertions
    assert.equal(data.success, true, "data.success must be true");
    assert.ok(typeof data.tomorrowDate === "string", "tomorrowDate must be string");
    assert.match(data.tomorrowDate, /^\d{4}-\d{2}-\d{2}$/, "tomorrowDate must match YYYY-MM-DD");
    assert.ok(typeof data.tomorrowDateIso === "string", "tomorrowDateIso must be string");
    assert.ok(!isNaN(new Date(data.tomorrowDateIso).getTime()), "tomorrowDateIso must be a valid ISO date");
    assert.ok(typeof data.tomorrowPersianDate === "string", "tomorrowPersianDate must be string");
    assert.ok(data.tomorrowPersianDate.length > 3, "tomorrowPersianDate must not be empty");
    pass("Date format and Persian string schema", `tomorrowDate: ${data.tomorrowDate}, persian: ${data.tomorrowPersianDate}`);

    // Array type assertions
    assert.ok(Array.isArray(data.blocks), "blocks must be an array");
    assert.ok(Array.isArray(data.tasks), "tasks must be an array");
    assert.ok(Array.isArray(data.workouts), "workouts must be an array");
    pass("Top-level collections are arrays", `blocks: ${data.blocks.length}, tasks: ${data.tasks.length}, workouts: ${data.workouts.length}`);

    // Summary assertions
    assert.ok(data.summary && typeof data.summary === "object", "summary must be an object");
    assert.equal(typeof data.summary.totalItems, "number", "summary.totalItems must be number");
    assert.equal(typeof data.summary.blocksCount, "number", "summary.blocksCount must be number");
    assert.equal(typeof data.summary.tasksCount, "number", "summary.tasksCount must be number");
    assert.equal(typeof data.summary.workoutsCount, "number", "summary.workoutsCount must be number");

    // Invariant: summary counts match actual array lengths
    assert.equal(data.summary.blocksCount, data.blocks.length, "summary.blocksCount must match blocks.length");
    assert.equal(data.summary.tasksCount, data.tasks.length, "summary.tasksCount must match tasks.length");
    assert.equal(data.summary.workoutsCount, data.workouts.length, "summary.workoutsCount must match workouts.length");
    assert.equal(
      data.summary.totalItems,
      data.blocks.length + data.tasks.length + data.workouts.length,
      "summary.totalItems must equal sum of blocks + tasks + workouts"
    );
    pass("Summary counts strictly match collection lengths", `totalItems: ${data.summary.totalItems}`);

    // Backwards-compatible reminders wrapper
    assert.ok(data.reminders && typeof data.reminders === "object", "reminders wrapper object must exist");
    assert.ok(Array.isArray(data.reminders.blocks), "reminders.blocks must be an array");
    assert.ok(Array.isArray(data.reminders.tasks), "reminders.tasks must be an array");
    assert.ok(Array.isArray(data.reminders.workouts), "reminders.workouts must be an array");
    pass("Backwards-compatible reminders wrapper object verified");
  } catch (e) {
    fail("GET /api/reminders/tomorrow Schema & Invariants", e);
  }

  const tomorrowDateStr = initialTomorrowData?.tomorrowDate;

  // ---------------------------------------------------------------------------
  // SUITE 3: Future Date Registration & Immediate Reflection
  // ---------------------------------------------------------------------------
  console.log(`\n${ANSI.bold}📅 SUITE 3: Future Date Registration & Cross-Endpoint Reflection${ANSI.reset}`);

  // Test 3.1: Add block for Tomorrow and verify immediate reflection in both endpoints
  let createdTomorrowBlock = null;
  try {
    const postRes = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "چالش تجربی: جلسه تست اختصاصی فردا",
        date: tomorrowDateStr,
        startTime: "14:00",
        endTime: "15:30",
        type: "Deep Work",
        notes: "Automated empirical challenge block",
      }),
    });
    assert.equal(postRes.status, 200, `POST /api/planner should return 200, got ${postRes.status}`);
    const postData = await postRes.json();
    assert.equal(postData.success, true, "POST /api/planner should return success: true");
    assert.ok(postData.block?.id, "Created block must have an ID");
    assert.equal(postData.block.title, "چالش تجربی: جلسه تست اختصاصی فردا");
    assert.equal(postData.block.plannedDuration, 90, "Planned duration for 14:00-15:30 should be 90 minutes");
    createdTomorrowBlock = postData.block;
    pass("POST /api/planner creates block for tomorrow with 90m duration", `id: ${createdTomorrowBlock.id}`);

    // Verify GET /api/planner?date=YYYY-MM-DD reflects the block
    const plannerRes = await fetch(`${BASE_URL}/api/planner?date=${tomorrowDateStr}`);
    assert.equal(plannerRes.status, 200);
    const plannerData = await plannerRes.json();
    assert.equal(plannerData.success, true);
    const foundInPlanner = plannerData.blocks.find((b) => b.id === createdTomorrowBlock.id);
    assert.ok(foundInPlanner, "Created block must be present in GET /api/planner?date=tomorrow");
    pass("Block immediately reflected in GET /api/planner?date=tomorrow");

    // Verify GET /api/reminders/tomorrow immediately reflects the block
    const remindersRes = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
    assert.equal(remindersRes.status, 200);
    const remindersData = await remindersRes.json();
    assert.equal(remindersData.success, true);
    const foundInReminders = remindersData.blocks.find((b) => b.id === createdTomorrowBlock.id);
    assert.ok(foundInReminders, "Created block must be present in GET /api/reminders/tomorrow");
    assert.ok(typeof foundInReminders.timeFormatted === "string" && foundInReminders.timeFormatted.length > 0, "timeFormatted must be populated");
    assert.equal(remindersData.summary.blocksCount, initialTomorrowData.summary.blocksCount + 1, "summary.blocksCount must increment by 1");
    assert.equal(remindersData.summary.totalItems, initialTomorrowData.summary.totalItems + 1, "summary.totalItems must increment by 1");
    pass("Block immediately reflected in GET /api/reminders/tomorrow with timeFormatted and incremented counters", `timeFormatted: ${foundInReminders.timeFormatted}`);

    // Verify deletion and immediate removal from both endpoints
    const deleteRes = await fetch(`${BASE_URL}/api/planner?id=${createdTomorrowBlock.id}`, { method: "DELETE" });
    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, true);

    const postDelReminders = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    const stillInReminders = postDelReminders.blocks.find((b) => b.id === createdTomorrowBlock.id);
    assert.equal(stillInReminders, undefined, "Deleted block must not be in reminders");
    assert.equal(postDelReminders.summary.blocksCount, initialTomorrowData.summary.blocksCount, "blocksCount must return to baseline");
    pass("DELETE /api/planner removes block immediately from tomorrow reminders and restores count");
    createdTomorrowBlock = null;
  } catch (e) {
    fail("Future Date Registration (Tomorrow)", e);
    if (createdTomorrowBlock?.id) {
      await fetch(`${BASE_URL}/api/planner?id=${createdTomorrowBlock.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // Test 3.2: Add block for Next Week (+7 days) — must appear in planner for that date, but NOT in tomorrow's reminders
  let createdNextWeekBlock = null;
  try {
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nwY = nextWeekDate.getFullYear();
    const nwM = String(nextWeekDate.getMonth() + 1).padStart(2, "0");
    const nwD = String(nextWeekDate.getDate()).padStart(2, "0");
    const nextWeekDateStr = `${nwY}-${nwM}-${nwD}`;

    const postRes = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "برنامه‌ریزی استراتژیک هفته بعد (+7 روز)",
        date: nextWeekDateStr,
        startTime: "10:00",
        endTime: "11:30",
        type: "Review",
        notes: "Next week planning test",
      }),
    });
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.equal(postData.success, true);
    createdNextWeekBlock = postData.block;
    pass("POST /api/planner creates block for date +7 days", `date: ${nextWeekDateStr}, id: ${createdNextWeekBlock.id}`);

    // Verify GET /api/planner?date=nextWeekDate returns the block
    const plannerRes = await fetch(`${BASE_URL}/api/planner?date=${nextWeekDateStr}`);
    const plannerData = await plannerRes.json();
    const foundInPlanner = plannerData.blocks.find((b) => b.id === createdNextWeekBlock.id);
    assert.ok(foundInPlanner, "Block must appear in planner for date +7 days");
    pass("Block +7 days found in GET /api/planner?date=+7days");

    // Verify GET /api/reminders/tomorrow DOES NOT include the block
    const remindersRes = await fetch(`${BASE_URL}/api/reminders/tomorrow`);
    const remindersData = await remindersRes.json();
    const leakedIntoTomorrow = remindersData.blocks.find((b) => b.id === createdNextWeekBlock.id);
    assert.equal(leakedIntoTomorrow, undefined, "Block +7 days must NOT leak into tomorrow's reminders");
    pass("Block +7 days correctly isolated from tomorrow reminders (no leakage)");

    // Cleanup
    await fetch(`${BASE_URL}/api/planner?id=${createdNextWeekBlock.id}`, { method: "DELETE" });
    createdNextWeekBlock = null;
  } catch (e) {
    fail("Future Date Registration (+7 days)", e);
    if (createdNextWeekBlock?.id) {
      await fetch(`${BASE_URL}/api/planner?id=${createdNextWeekBlock.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: Boundary Values & Edge Cases
  // ---------------------------------------------------------------------------
  console.log(`\n${ANSI.bold}🧱 SUITE 4: Boundary Values & Edge Cases${ANSI.reset}`);

  // Boundary 4.1: Midnight Boundary — Start of day (00:00 - 01:00)
  let midnightStartBlock = null;
  try {
    const postRes = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "بلوک مرزی نیمه‌شب: آغاز روز ۰۰:۰۰",
        date: tomorrowDateStr,
        startTime: "00:00",
        endTime: "01:00",
        type: "Habit",
      }),
    });
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    midnightStartBlock = postData.block;

    const remRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    const found = remRes.blocks.find((b) => b.id === midnightStartBlock.id);
    assert.ok(found, "Block starting at 00:00 on tomorrow must be captured in tomorrow reminders");
    pass("Midnight boundary: 00:00 start cleanly included in tomorrow reminders");

    await fetch(`${BASE_URL}/api/planner?id=${midnightStartBlock.id}`, { method: "DELETE" });
    midnightStartBlock = null;
  } catch (e) {
    fail("Midnight boundary 00:00", e);
    if (midnightStartBlock?.id) {
      await fetch(`${BASE_URL}/api/planner?id=${midnightStartBlock.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // Boundary 4.2: Midnight Boundary — End of day (23:00 - 23:59)
  let midnightEndBlock = null;
  try {
    const postRes = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "بلوک مرزی نیمه‌شب: پایان روز ۲۳:۰۰ تا ۲۳:۵۹",
        date: tomorrowDateStr,
        startTime: "23:00",
        endTime: "23:59",
        type: "Wind Down",
      }),
    });
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    midnightEndBlock = postData.block;

    const remRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    const found = remRes.blocks.find((b) => b.id === midnightEndBlock.id);
    assert.ok(found, "Block ending at 23:59 on tomorrow must be captured in tomorrow reminders");
    pass("Midnight boundary: 23:59 end cleanly included in tomorrow reminders");

    await fetch(`${BASE_URL}/api/planner?id=${midnightEndBlock.id}`, { method: "DELETE" });
    midnightEndBlock = null;
  } catch (e) {
    fail("Midnight boundary 23:59", e);
    if (midnightEndBlock?.id) {
      await fetch(`${BASE_URL}/api/planner?id=${midnightEndBlock.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // Boundary 4.3: Cross-midnight boundary — starting today at 23:30, ending tomorrow at 01:00
  let crossMidnightBlock = null;
  try {
    const today = new Date();
    const startCross = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 30, 0);
    const endCross = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 1, 0, 0);

    const postRes = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "بلوک هم‌پوشان نیمه‌شب از امروز به فردا",
        start: startCross.toISOString(),
        end: endCross.toISOString(),
        type: "Night Shift",
      }),
    });
    assert.equal(postRes.status, 200);
    crossMidnightBlock = (await postRes.json()).block;

    const remRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    const found = remRes.blocks.find((b) => b.id === crossMidnightBlock.id);
    assert.ok(found, "Block overlapping into tomorrow morning must be included in tomorrow reminders");
    pass("Cross-midnight block overlapping into tomorrow is captured via OR(start, end) logic");

    await fetch(`${BASE_URL}/api/planner?id=${crossMidnightBlock.id}`, { method: "DELETE" });
    crossMidnightBlock = null;
  } catch (e) {
    fail("Cross-midnight boundary overlapping", e);
    if (crossMidnightBlock?.id) {
      await fetch(`${BASE_URL}/api/planner?id=${crossMidnightBlock.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // Boundary 4.4 [ADVERSARIAL CHALLENGE 1]: Next Day +2 Midnight Isolation
  // Stress-testing if Day +2 (پس‌فردا) blocks leak into tomorrow reminders due to 27.5-hour UTC/Local window
  let dayPlusTwoBlock = null;
  try {
    const dayPlus2 = new Date();
    dayPlus2.setDate(dayPlus2.getDate() + 2);
    const d2Y = dayPlus2.getFullYear();
    const d2M = String(dayPlus2.getMonth() + 1).padStart(2, "0");
    const d2D = String(dayPlus2.getDate()).padStart(2, "0");
    const day2Str = `${d2Y}-${d2M}-${d2D}`;

    const postRes = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "بلوک پس‌فردا ۰۰:۰۰ (نباید در یادآور فردا نشت کند)",
        date: day2Str,
        startTime: "00:00",
        endTime: "01:00",
        type: "Deep Work",
      }),
    });
    assert.equal(postRes.status, 200);
    dayPlusTwoBlock = (await postRes.json()).block;

    const remRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    const leaked = remRes.blocks.find((b) => b.id === dayPlusTwoBlock.id);
    if (leaked) {
      throw new Error(
        `LEAK DETECTED: Day +2 block (scheduled for ${day2Str} 00:00-01:00) was returned in tomorrow's reminders! ` +
        `Root cause: Math.max(localEnd, utcEnd) expands query window by 3.5 hours into the next day in UTC+3:30.`
      );
    }
    pass("Day +2 midnight block strictly excluded from tomorrow reminders");

    await fetch(`${BASE_URL}/api/planner?id=${dayPlusTwoBlock.id}`, { method: "DELETE" });
    dayPlusTwoBlock = null;
  } catch (e) {
    fail("Day +2 midnight exclusion [ADVERSARIAL BUG]", e);
    if (dayPlusTwoBlock?.id) {
      await fetch(`${BASE_URL}/api/planner?id=${dayPlusTwoBlock.id}`, { method: "DELETE" }).catch(() => {});
      dayPlusTwoBlock = null;
    }
  }

  // Boundary 4.5: Malformed payloads & Validation handling
  try {
    // Empty body
    const resEmpty = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(resEmpty.status, 400, "Empty payload must return HTTP 400");
    const emptyErr = await resEmpty.json();
    assert.equal(emptyErr.success, false);
    assert.equal(emptyErr.error, "عنوان بلوک زمانی الزامی است");
    pass("POST /api/planner empty payload rejects with 400 and Persian error message");

    // Whitespace-only title
    const resWs = await fetch(`${BASE_URL}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "     " }),
    });
    assert.equal(resWs.status, 400, "Whitespace title must return HTTP 400");
    pass("POST /api/planner whitespace-only title rejects with 400");

    // DELETE without ID
    const resDelNoId = await fetch(`${BASE_URL}/api/planner`, { method: "DELETE" });
    assert.equal(resDelNoId.status, 400, "DELETE without id must return HTTP 400");
    const delErr = await resDelNoId.json();
    assert.equal(delErr.success, false);
    assert.equal(delErr.error, "شناسه الزامی است");
    pass("DELETE /api/planner without ID rejects with 400 and Persian error message");
  } catch (e) {
    fail("Malformed payloads & Validation handling", e);
  }

  // Boundary 4.6 [ADVERSARIAL CHALLENGE 2]: Malformed Date Query Resilience
  try {
    const resInvalidDate = await fetch(`${BASE_URL}/api/planner?date=not-a-valid-date`);
    if (resInvalidDate.status === 500) {
      const err500 = await resInvalidDate.json();
      throw new Error(
        `UNHANDLED 500 ERROR on invalid date query: status 500, message: "${err500.error}". Server should return 400 or handle gracefully without throwing unhandled Prisma exception.`
      );
    }
    assert.ok([200, 400].includes(resInvalidDate.status), `Expected 200 or 400, got ${resInvalidDate.status}`);
    pass("GET /api/planner?date=not-a-valid-date handled safely without 500 crash");
  } catch (e) {
    fail("GET /api/planner invalid date query [ADVERSARIAL BUG]", e);
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: Concurrency & Stress Burst Testing
  // ---------------------------------------------------------------------------
  console.log(`\n${ANSI.bold}⚡ SUITE 5: Concurrency & Burst Stress Test${ANSI.reset}`);
  const createdBurstBlocks = [];
  try {
    const burstCount = 10;
    const baselineRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    const baseCount = baselineRes.summary.blocksCount;

    // Dispatch 10 parallel POST requests
    const promises = Array.from({ length: burstCount }, (_, idx) => {
      const h = String(8 + idx).padStart(2, "0");
      return fetch(`${BASE_URL}/api/planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `بلوک هم‌روند استرس #${idx + 1}`,
          date: tomorrowDateStr,
          startTime: `${h}:00`,
          endTime: `${h}:45`,
          type: "Deep Work",
        }),
      }).then((r) => r.json());
    });

    const results = await Promise.all(promises);
    for (const r of results) {
      assert.equal(r.success, true);
      assert.ok(r.block?.id);
      createdBurstBlocks.push(r.block.id);
    }
    pass(`Created ${burstCount} blocks concurrently via parallel POST requests`);

    // Verify reminders reflects exact +10 count
    const postBurstRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    assert.equal(
      postBurstRes.summary.blocksCount,
      baseCount + burstCount,
      `Expected blocksCount to increase by ${burstCount}, from ${baseCount} to ${baseCount + burstCount}`
    );
    assert.equal(
      postBurstRes.summary.totalItems,
      baselineRes.summary.totalItems + burstCount,
      `Expected totalItems to increase by ${burstCount}`
    );
    pass(`All ${burstCount} concurrent blocks accounted for in tomorrow's reminders`);

    // Concurrently delete all 10 blocks
    const delPromises = createdBurstBlocks.map((id) =>
      fetch(`${BASE_URL}/api/planner?id=${id}`, { method: "DELETE" }).then((r) => r.json())
    );
    const delResults = await Promise.all(delPromises);
    for (const dr of delResults) {
      assert.equal(dr.success, true);
    }
    pass(`Cleaned up all ${burstCount} concurrent blocks in parallel`);

    // Verify counter returned to baseline
    const finalRes = await (await fetch(`${BASE_URL}/api/reminders/tomorrow`)).json();
    assert.equal(finalRes.summary.blocksCount, baseCount, "blocksCount must return to original baseline");
    pass("Reminders block count returned to baseline after concurrent cleanup");
  } catch (e) {
    fail("Concurrency & Burst Stress Test", e);
    for (const id of createdBurstBlocks) {
      await fetch(`${BASE_URL}/api/planner?id=${id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log(`\n${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}🏁 CHALLENGER 1 STRESS TEST RESULTS SUMMARY${ANSI.reset}`);
  console.log(`${ANSI.bold}Total Passed: ${ANSI.green}${passedCount}${ANSI.reset}`);
  console.log(`${ANSI.bold}Total Failed: ${failedCount === 0 ? ANSI.green + "0" : ANSI.red + failedCount}${ANSI.reset}`);
  if (failures.length > 0) {
    console.log(`\n${ANSI.bold}${ANSI.red}EMPIRICALLY CONFIRMED BUGS & VULNERABILITIES (${failures.length}):${ANSI.reset}`);
    failures.forEach((f, i) => {
      console.log(`  ${ANSI.bold}${i + 1}. [${f.name}]${ANSI.reset}`);
      console.log(`     Error: ${f.error}`);
      if (f.detail) console.log(`     Detail: ${f.detail}`);
    });
  }
  console.log(`${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}\n`);

  return { passedCount, failedCount, failures, passes };
}

runSuite().then((summary) => {
  if (summary.failedCount > 0) {
    process.exit(1);
  }
}).catch((err) => {
  console.error("Unhandled error in stress suite:", err);
  process.exit(1);
});
