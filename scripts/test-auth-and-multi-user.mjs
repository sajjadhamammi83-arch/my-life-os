import http from "http";

const BASE_URL = "http://127.0.0.1:3050";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
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
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function extractCookie(res, cookieName) {
  const rawCookies = res.headers["set-cookie"];
  if (!rawCookies) return null;
  const cookieArr = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
  for (const c of cookieArr) {
    if (c.startsWith(`${cookieName}=`)) {
      return c.split(";")[0];
    }
  }
  return null;
}

async function run() {
  console.log("=== Testing Authentication, Protection & Multi-User Isolation ===");

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = "") {
    total++;
    if (condition) {
      console.log(`[PASS] ${name} ${extra ? `(${extra})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ""}`);
    }
  }

  // 1. Unauthenticated redirect check
  console.log("\n1. Testing Protected Route Redirection...");
  const unauthRes = await request("/dashboard");
  assert(
    "Unauthenticated access redirects to /login",
    unauthRes.statusCode === 307 || unauthRes.statusCode === 302,
    `HTTP ${unauthRes.statusCode} Location: ${unauthRes.headers.location}`
  );

  // 2. Login Page accessible
  const loginPageRes = await request("/login");
  assert("Login page accessible (200 OK)", loginPageRes.statusCode === 200);

  // 3. Login as sajjad
  console.log("\n2. Testing Login API for sajjad...");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { username: "sajjad", password: "wrongpassword" },
  });
  assert("Wrong password rejected (401)", loginRes.statusCode === 401);

  const validLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: { username: "sajjad", password: "123456" },
  });
  assert("Valid credentials accepted (200 OK)", validLoginRes.statusCode === 200 && validLoginRes.body.success);
  const sajjadCookie = extractCookie(validLoginRes, "life_os_session");
  assert("Session cookie received", Boolean(sajjadCookie), sajjadCookie);

  // 4. Verify /api/auth/me for sajjad
  const meRes = await request("/api/auth/me", {
    headers: { Cookie: sajjadCookie },
  });
  console.log("DEBUG meRes:", meRes.statusCode, meRes.body);
  assert(
    "Verify /api/auth/me identifies sajjad",
    meRes.statusCode === 200 && meRes.body?.user?.username === "sajjad"
  );

  // 5. Create a task in sajjad's database
  console.log("\n3. Testing Data Isolation (sajjad vs new user)...");
  const taskSajjad = await request("/api/tasks", {
    method: "POST",
    headers: { Cookie: sajjadCookie },
    body: {
      title: "تسک برنامه ریزی سجاد",
      status: "today",
      isBigThree: true,
      eisenhowerQuadrant: "Q1",
      priority: "high",
    },
  });
  assert("Created task for sajjad", taskSajjad.statusCode === 200 && taskSajjad.body.success);

  // 6. Register a new user: dynamic username
  const newUsername = `reza_${Date.now().toString(36)}`;
  console.log(`\n4. Registering New User (${newUsername})...`);
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      username: newUsername,
      password: "rezapassword123",
      name: "رضا محمدی",
    },
  });
  assert(`New user ${newUsername} registered (200 OK)`, regRes.statusCode === 200 && regRes.body.success);
  const rezaCookie = extractCookie(regRes, "life_os_session");
  assert(`${newUsername} session cookie received`, Boolean(rezaCookie));

  // 7. Verify new user's task list is pristine Day 1 (0 tasks initially!)
  const rezaTasksInitial = await request("/api/tasks", {
    headers: { Cookie: rezaCookie },
  });
  assert(
    `${newUsername} starts on Day 1 with 0 tasks`,
    rezaTasksInitial.statusCode === 200 && rezaTasksInitial.body?.tasks?.length === 0,
    `Found ${rezaTasksInitial.body?.tasks?.length} tasks`
  );

  // 8. Create a task for new user
  const taskReza = await request("/api/tasks", {
    method: "POST",
    headers: { Cookie: rezaCookie },
    body: {
      title: "پروژه اختصاصی کاربر جدید",
      status: "today",
      isBigThree: true,
      eisenhowerQuadrant: "Q2",
      priority: "high",
    },
  });
  assert(`Created task for ${newUsername}`, taskReza.statusCode === 200 && taskReza.body.success);

  // 9. Verify Isolation: Sajjad cannot see new user's task
  console.log("\n5. Verifying Strict Data Isolation...");
  const sajjadTasks = await request("/api/tasks", {
    headers: { Cookie: sajjadCookie },
  });
  const sajjadTitles = sajjadTasks.body.tasks.map((t) => t.title);
  assert(
    "sajjad sees their own task",
    sajjadTitles.includes("تسک برنامه ریزی سجاد")
  );
  assert(
    `sajjad DOES NOT see ${newUsername}'s task`,
    !sajjadTitles.includes("پروژه اختصاصی کاربر جدید")
  );

  // 10. Verify Isolation: New user cannot see Sajjad's task
  const rezaTasks = await request("/api/tasks", {
    headers: { Cookie: rezaCookie },
  });
  const rezaTitles = rezaTasks.body.tasks.map((t) => t.title);
  assert(
    `${newUsername} sees their own task`,
    rezaTitles.includes("پروژه اختصاصی کاربر جدید")
  );
  assert(
    `${newUsername} DOES NOT see sajjad's task`,
    !rezaTitles.includes("تسک برنامه ریزی سجاد")
  );

  // 11. Test Logout
  console.log("\n6. Testing Logout...");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: sajjadCookie },
  });
  assert("Logout succeeded", logoutRes.statusCode === 200);

  console.log("\n========================================================");
  console.log(`Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("========================================================");

  if (passed === total) {
    console.log("\n>>> ALL AUTHENTICATION & MULTI-USER ISOLATION TESTS PASSED! <<<\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
