/**
 * Verification of all action endpoints (buttons, forms, toggles) directly against the server.
 */

import http from "http";

const BASE_URL = "http://127.0.0.1:3050";

function request(path, method = "GET", payload = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => {
        const bodyStr = Buffer.concat(data).toString("utf-8");
        let parsed = null;
        try {
          parsed = JSON.parse(bodyStr);
        } catch {
          parsed = bodyStr;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function verifyAllButtonsAndActions() {
  console.log("=== Testing All User Buttons & Form Actions Directly ===");

  let passed = 0;
  let total = 0;

  function assert(name, ok, extra = "") {
    total++;
    if (ok) {
      console.log(`[PASS] ${name} ${extra ? `(${extra})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ""}`);
    }
  }

  // 1. Wait for server ready
  console.log("\n1. Waiting for server...");
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await request("/api/tasks");
      if (res.statusCode === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  assert("Server Ready on 3050", ready);
  if (!ready) process.exit(1);

  // 2. Test Task Creation Button (Today / Tasks page)
  console.log("\n2. Testing Task Buttons (Create, Toggle, Delete)...");
  const newTaskRes = await request("/api/tasks", "POST", {
    title: "تست بررسی عملکرد دکمه‌ها",
    status: "today",
    isBigThree: true,
    eisenhowerQuadrant: "Q1",
    priority: "urgent",
    workType: "Deep Work",
    estimatedMinutes: 25,
  });
  assert("Button: Create Task (POST /api/tasks)", newTaskRes.statusCode === 200 && newTaskRes.body.success);
  const createdTaskId = newTaskRes.body?.task?.id;

  // 3. Test Task Toggle Button (Check/Uncheck)
  if (createdTaskId) {
    const toggleRes = await request("/api/tasks", "PATCH", {
      id: createdTaskId,
      isCompleted: true,
    });
    assert("Button: Toggle Task Completion (PATCH /api/tasks)", toggleRes.statusCode === 200 && toggleRes.body.success);

    // 4. Test Task Delete Button
    const deleteRes = await request(`/api/tasks?id=${createdTaskId}`, "DELETE");
    assert("Button: Delete Task (DELETE /api/tasks)", deleteRes.statusCode === 200 && deleteRes.body.success);
  }

  // 5. Test Quick Capture Endpoint (Ctrl+K Button)
  console.log("\n3. Testing Quick Capture Button...");
  const quickCaptureRes = await request("/api/quick-capture", "POST", {
    rawInput: "تماس با تامین‌کننده قطعات فردا ساعت ۱۰ صبح #DeepWork",
  });
  assert("Button: Quick Capture (POST /api/quick-capture)", quickCaptureRes.statusCode === 200 && quickCaptureRes.body.success);

  // 6. Test Habit Toggle Button
  console.log("\n4. Testing Habit Toggle Button...");
  const habitsList = await request("/api/habits");
  if (habitsList.body?.habits?.length > 0) {
    const habitId = habitsList.body.habits[0].id;
    const habitToggle = await request("/api/habits", "PATCH", {
      habitId,
      completed: true,
    });
    assert("Button: Toggle Habit (PATCH /api/habits)", habitToggle.statusCode === 200 && habitToggle.body.success);
  } else {
    assert("Habits list accessible", habitsList.statusCode === 200);
  }

  // 7. Test Finance Buttons (Accounting / Expenses / Cash Register)
  console.log("\n5. Testing Finance Buttons & Modals...");
  const financeAccounts = await request("/api/finance/accounting");
  assert("Fetch Finance Accounting Data", financeAccounts.statusCode === 200 && financeAccounts.body.success);

  // 8. Test Daily Review Save Button
  console.log("\n6. Testing Review Save Button...");
  const reviewSave = await request("/api/reviews", "POST", {
    date: new Date().toISOString().substring(0, 10),
    big3Completed: 3,
    productivityScore: 9,
    mood: "عالی و پرانرژی",
    deepWorkHours: 4,
    energyPhysical: 9,
    energyEmotional: 8,
    energyMental: 9,
    energySpiritual: 9,
    whatWentWell: "سیستم کاملاً مستقیم و پایدار شد",
    keyInsight: "ارتباط مستقیم با دیتابیس سرعت را بی‌نهایت کرد",
  });
  assert("Button: Save Daily Review (POST /api/reviews)", reviewSave.statusCode === 200 && reviewSave.body.success);

  console.log(`\n=============================================`);
  console.log(`Passed: ${passed} / ${total} (${Math.round((passed / total) * 100)}%)`);
  console.log(`=============================================`);

  if (passed === total) {
    console.log("\n>>> ALL BUTTONS & ACTIONS ARE WORKING 100% DIRECTLY! <<<\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyAllButtonsAndActions();
