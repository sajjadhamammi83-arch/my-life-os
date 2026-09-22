# Changes Summary — Milestone 1 Fix Worker (m1_worker_fix_6)

**Target**: Resolution of Milestone 1 Challenger 1 Defects  
**Timestamp**: 2026-09-06T17:06:30Z  
**Role**: `m1_worker_fix_6` (implementer / qa / specialist)

---

## 1. `src/app/api/reminders/tomorrow/route.ts`

### Issue:
- Lines 22-26 previously computed:
  ```typescript
  const utcStart = new Date(Date.UTC(yyyy, tomorrowLocal.getMonth(), tomorrowLocal.getDate(), 0, 0, 0, 0));
  const utcEnd = new Date(Date.UTC(yyyy, tomorrowLocal.getMonth(), tomorrowLocal.getDate(), 23, 59, 59, 999));

  const rangeStart = new Date(Math.min(tomorrowStart.getTime(), utcStart.getTime()));
  const rangeEnd = new Date(Math.max(tomorrowEnd.getTime(), utcEnd.getTime()));
  ```
- In Iran Standard Time (UTC+03:30), `utcEnd` (23:59:59.999 UTC) corresponds to `03:29:59.999 AM` of Day + 2 local time.
- `Math.max(tomorrowEnd.getTime(), utcEnd.getTime())` inflated the query window from 24.0 hours to 27.5 hours.
- Consequently, any calendar event scheduled between 00:00 AM and 03:30 AM on Day + 2 (e.g. 01:00 AM) matched the `OR: [{start: ...}, {end: ...}]` filter and leaked into tomorrow's reminders.

### Resolution:
- Removed `utcStart`, `utcEnd`, and the `Math.min / Math.max` range expansion.
- Strictly assigned `rangeStart = tomorrowStart` and `rangeEnd = tomorrowEnd`, covering exactly 00:00:00.000 to 23:59:59.999 local time.
  ```typescript
  // Strictly enforce the 24-hour window for tomorrow (from 00:00:00.000 to 23:59:59.999 local time)
  const rangeStart = tomorrowStart;
  const rangeEnd = tomorrowEnd;
  ```

---

## 2. `src/app/api/planner/route.ts`

### Issues:
1. **Window Expansion**: In `GET /api/planner`, the same `Math.max(localEnd.getTime(), utcEnd.getTime())` logic extended the query window to 27.5 hours, causing Day + 2 events to appear when filtering by `?date=YYYY-MM-DD`.
2. **Unhandled 500 on Malformed Date Query**: If `dateParam` contained an invalid string (e.g., `?date=not-a-valid-date`), `new Date(dateParam)` yielded an `Invalid Date` (`NaN`). This was passed into Prisma's `gte` / `lte` query, triggering an unhandled Prisma exception and crashing the endpoint with HTTP 500 Internal Server Error.

### Resolution:
- Added explicit parameter validation in `GET /api/planner`:
  ```typescript
  if (dateParam !== null) {
    if (!dateParam.trim()) {
      return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
    }

    const parsed = new Date(dateParam);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
    }
  ...
  ```
- Eliminated `utcStart`, `utcEnd`, and `Math.max(localEnd, utcEnd)`:
  ```typescript
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2].slice(0, 2), 10);

    rangeStart = new Date(y, m, d, 0, 0, 0, 0);
    rangeEnd = new Date(y, m, d, 23, 59, 59, 999);
  } else {
    rangeStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
    rangeEnd = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
  }

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
  }
  ```
- Verified that querying `GET /api/planner?date=not-a-valid-date` cleanly returns HTTP 400 with `{ "success": false, "error": "فرمت تاریخ ارسالی نامعتبر است" }`.

---

## 3. Verification Commands & Results

1. `node node_modules/typescript/bin/tsc --noEmit`
   - **Result**: Exit code 0, 0 type errors across whole project.
2. `node scripts/test-m1-challenger.mjs`
   - **Result**: Exit code 0, 24/24 passed (100%), 0 failures.
   - Fixed Boundary 4.4: Day + 2 midnight block strictly excluded from tomorrow reminders (PASS).
   - Fixed Boundary 4.6: Malformed date query returns HTTP 400 instead of HTTP 500 crash (PASS).
3. `node scripts/test-e2e-suite.mjs`
   - **Result**: Exit code 0, 86/86 assertions passed across all 4 tiers (100%).
4. Port Isolation Check:
   - Port 3050: Active, responsive on PID 13660.
   - Port 3000: Completely untouched on PID 8600.
