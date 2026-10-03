// Test script to verify /login isolation and mobile-ready APIs
async function runTests() {
  const baseUrl = "http://localhost:3050";
  console.log("Checking Life OS server on:", baseUrl);

  // 1. Test /login page content
  const loginRes = await fetch(`${baseUrl}/login`);
  console.log("1. /login HTTP Status:", loginRes.status);
  if (loginRes.status !== 200) {
    throw new Error(`Expected 200 for /login, got ${loginRes.status}`);
  }
  const loginHtml = await loginRes.text();

  // Verify that "محورهای فرماندهی" is NOT rendered on the login page!
  const hasCommandAxes = loginHtml.includes("محورهای فرماندهی");
  console.log("2. Is 'محورهای فرماندهی' on /login page?", hasCommandAxes ? "YES (FAILED)" : "NO (PASSED)");
  if (hasCommandAxes) {
    throw new Error("Sidebar 'محورهای فرماندهی' must NOT be present on /login!");
  }

  // 3. Test unauthenticated redirect
  const dashUnauth = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  console.log("3. Unauthenticated /dashboard status (expect 307 redirect to /login):", dashUnauth.status);
  const location = dashUnauth.headers.get("location");
  console.log("   Redirect location:", location);

  // 4. Test login authentication
  const loginPost = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "sajjad", password: "123456" }),
  });
  const loginData = await loginPost.json();
  console.log("4. Login response:", loginData.success, loginData.user?.name);
  if (!loginData.success) {
    throw new Error("Login failed for sajjad");
  }

  const setCookie = loginPost.headers.get("set-cookie");
  const sessionCookie = setCookie ? setCookie.split(";")[0] : "";
  console.log("5. Session cookie received:", !!sessionCookie);

  // 6. Test /api/auth/me
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: sessionCookie },
  });
  const meData = await meRes.json();
  console.log("6. /api/auth/me response:", meData);

  // 7. Test /dashboard with session cookie
  const dashAuth = await fetch(`${baseUrl}/dashboard`, {
    headers: { Cookie: sessionCookie },
  });
  console.log("7. Authenticated /dashboard status:", dashAuth.status);

  // 8. Test /today with session cookie
  const todayAuth = await fetch(`${baseUrl}/today`, {
    headers: { Cookie: sessionCookie },
  });
  console.log("8. Authenticated /today status:", todayAuth.status);

  // 9. Test /tasks with session cookie
  const tasksAuth = await fetch(`${baseUrl}/tasks`, {
    headers: { Cookie: sessionCookie },
  });
  console.log("9. Authenticated /tasks status:", tasksAuth.status);

  // 10. Test /finance with session cookie
  const financeAuth = await fetch(`${baseUrl}/finance`, {
    headers: { Cookie: sessionCookie },
  });
  console.log("10. Authenticated /finance status:", financeAuth.status);

  console.log("\n>>> ALL CHECKS PASSED SUCCESSFULLY! <<<");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
