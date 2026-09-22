# Challenger 1 Handoff Report — Milestone 1: D-1 Advance Reminders & Future Events

**Date**: 2026-09-06T16:45:00Z  
**Role**: Challenger 1 (`m1_chal_1` / `m1_challenger_1`) — Empirical Challenger & Adversarial Stress Tester  
**Target Milestone**: Milestone 1 (D-1 Advance Reminders & Future Events)  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

Direct empirical observations from test runs, network probes, and source inspection:

### 1.1 Port Isolation & Server Health
- **Command**:
  ```powershell
  Get-NetTCPConnection -LocalPort 3050, 3000 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State, OwningProcess
  ```
- **Observed Output**:
  ```
  LocalAddress LocalPort       State OwningProcess
  ------------ ---------       ----- -------------
  ::                3050      Listen         13660
  127.0.0.1         3050 Established         13660
  0.0.0.0           3000      Listen          8600
  ```
- **Result**: Port 3050 is active and responding on PID 13660. Port 3000 (User's Cafe Platform) is completely untouched and preserved on PID 8600. Zero network requests were made to port 3000.

### 1.2 TypeScript Compilation
- **Command**:
  ```powershell
  node node_modules/typescript/bin/tsc --noEmit
  ```
- **Observed Output**: Exit code 0, 0 typing or compilation errors across the entire repository.

### 1.3 Baseline GET `/api/reminders/tomorrow` Verification
- Requesting `GET http://127.0.0.1:3050/api/reminders/tomorrow` returned HTTP 200 OK:
  ```json
  {
    "success": true,
    "tomorrowDate": "2026-09-07",
    "tomorrowDateIso": "2026-09-06T20:30:00.000Z",
    "tomorrowPersianDate": "دوشنبه ۱۶ شهریور",
    "summary": {
      "totalItems": 0,
      "blocksCount": 0,
      "tasksCount": 0,
      "workoutsCount": 0
    },
    "blocks": [],
    "tasks": [],
    "workouts": [],
    "reminders": {
      "blocks": [],
      "tasks": [],
      "workouts": []
    }
  }
  ```
- Schema validation: Top-level `blocks`, `tasks`, `workouts` are arrays. Summary fields are numbers, and `summary.totalItems === blocks.length + tasks.length + workouts.length`. `tomorrowPersianDate` renders correctly formatted Persian text («دوشنبه ۱۶ شهریور»).

### 1.4 Adversarial Bug 1: 27.5-Hour UTC Window Expansion & Day +2 Leakage into Tomorrow's Reminders
- **Code Inspection** (`src/app/api/reminders/tomorrow/route.ts:22-27` and `src/app/api/planner/route.ts:25-30`):
  ```typescript
  const utcStart = new Date(Date.UTC(yyyy, tomorrowLocal.getMonth(), tomorrowLocal.getDate(), 0, 0, 0, 0));
  const utcEnd = new Date(Date.UTC(yyyy, tomorrowLocal.getMonth(), tomorrowLocal.getDate(), 23, 59, 59, 999));

  const rangeStart = new Date(Math.min(tomorrowStart.getTime(), utcStart.getTime()));
  const rangeEnd = new Date(Math.max(tomorrowEnd.getTime(), utcEnd.getTime()));
  ```
- **Empirical Execution**:
  1. Created a calendar block scheduled for Day +2 (`2026-09-08`) at 01:00 AM local time (Iran Standard Time UTC+03:30):
     - Title: `Leak Test 2026-09-08 01:00`
     - Start: `2026-09-07T21:30:00.000Z` (corresponds to `2026-09-08 01:00` local time).
     - End: `2026-09-07T22:30:00.000Z` (corresponds to `2026-09-08 02:00` local time).
  2. Queried `GET /api/reminders/tomorrow` (where tomorrow is `2026-09-07`):
     - Result: `leakedInReminders: true`
     - Returned item in `blocks`:
       ```json
       {
         "id": "cmtq16e3i004cml6m6mtzjrq6",
         "title": "Leak Test 2026-09-08 01:00",
         "type": "Deep Work",
         "start": "2026-09-07T21:30:00.000Z",
         "end": "2026-09-07T22:30:00.000Z",
         "timeFormatted": "۰۰:۰۰ - ۰۱:۰۰"
       }
       ```
     - Notice `timeFormatted` shows `۰۰:۰۰ - ۰۱:۰۰`, falsely displaying this future event as if it belongs to tomorrow night!
  3. Queried `GET /api/planner?date=2026-09-07`:
     - Result: `leakedInPlanner: true`
     - The Day +2 block was returned when filtering specifically for `2026-09-07`!

### 1.5 Adversarial Bug 2: Unhandled HTTP 500 Internal Server Error on Malformed Date Query
- **Code Inspection** (`src/app/api/planner/route.ts:31-35`):
  ```typescript
  } else {
    const parsed = new Date(dateParam);
    rangeStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
    rangeEnd = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
  }
  ```
- **Empirical Execution**:
  - Request: `GET http://127.0.0.1:3050/api/planner?date=not-a-valid-date`
  - Response Status: **HTTP 500 Internal Server Error**
  - Response Body:
    ```json
    {
      "success": false,
      "error": "\nInvalid `prisma.calendarBlock.findMany()` invocation:\n\n{\n  where: {\n    OR: [\n      {\n        start: {\n          gte: new Date(\"Invalid Date\"),\n               ~~~~~~~~~~~~~~~~~~~~~~~~\n          lte: new Date(\"Invalid Date\")\n        }\n      },\n      {\n        end: {\n          gte: new Date(\"Invalid Date\"),\n          lte: new Date(\"Invalid Date\")\n        }\n      }\n    ]\n  },\n  orderBy: {\n    start: \"asc\"\n  },\n  include: {\n    area: true,\n    project: true\n  }\n}\n\nInvalid value for argument `gte`: Provided Date object is invalid. Expected Date."
    }
    ```

---

## 2. Logic Chain

1. **Premise 1 (Timezone Calculation)**: Iran Standard Time operates at UTC+03:30.
   - For tomorrow `2026-09-07`, the local day ends at `2026-09-07 23:59:59.999`. In UTC, this is `2026-09-07 20:29:59.999Z`.
   - The worker computed `utcEnd = Date.UTC(2026, 8, 7, 23, 59, 59, 999)`, which is `2026-09-07 23:59:59.999Z`.
   - In Iran local time, `2026-09-07 23:59:59.999Z` corresponds to `2026-09-08 03:29:59.999 AM`!
   - By calculating `rangeEnd = Math.max(localEnd.getTime(), utcEnd.getTime())`, the database query window was extended from 24.0 hours to **27.5 hours**.
2. **Inference 1**: Any event scheduled during the first 3.5 hours of Day +2 (between 00:00 and 03:30 on 2026-09-08) satisfies `start <= rangeEnd` and `end <= rangeEnd`.
3. **Deduction 1**: Therefore, Day +2 early morning events leak into tomorrow's D-1 reminders widget, artificially inflate the Header Bell notification counter, and appear in `GET /api/planner?date=2026-09-07`. This violates the strict D-1 day boundary requirement.
4. **Premise 2 (Malformed Date Handling)**: In `src/app/api/planner/route.ts`, the `else` branch attempts to parse any unrecognized `dateParam` with `new Date(dateParam)`.
5. **Inference 2**: When `dateParam` is malformed (e.g. `not-a-valid-date`), `new Date(dateParam)` yields an `Invalid Date`. Calling `parsed.getFullYear()` returns `NaN`.
6. **Deduction 2**: Passing `new Date(NaN, ...)` into Prisma's `gte` / `lte` query causes Prisma Client to throw an unhandled schema validation error, resulting in an uncaught HTTP 500 error instead of a graceful HTTP 400 Bad Request or fallback.

---

## 3. Caveats

- **No Caveats** regarding the reproduction of the two reported bugs: both are 100% reproducible via direct curl/fetch requests against the active server on port 3050.
- All test calendar blocks created during stress runs were completely cleaned up from the database; remaining test block count is 0.

---

## 4. Conclusion & Recommended Fixes

**Verdict**: **REQUEST_CHANGES**

While the core functionality of Milestone 1 (Header Bell dynamic badge, `reminders-updated` reactive event bus, `TomorrowAgendaWidget` minimal UI, and future planner creation) is implemented and TypeScript passes with zero errors, the two empirical flaws must be corrected by the worker:

### Required Changes for Worker:
1. **Fix Timezone Boundary in both `src/app/api/reminders/tomorrow/route.ts` and `src/app/api/planner/route.ts`**:
   - Replace the flawed `Math.max(localEnd, utcEnd)` logic.
   - The query window must strictly cover the 24 hours of the requested date based on the user's system/local timezone:
     ```typescript
     const startOfDay = new Date(y, m, d, 0, 0, 0, 0);
     const endOfDay = new Date(y, m, d, 23, 59, 59, 999);
     ```
   - This ensures the window is exactly 24 hours and prevents any event from Day + 2 from leaking into tomorrow's reminders or planner query.
2. **Handle Invalid Date Formats in `src/app/api/planner/route.ts`**:
   - Validate `dateParam`:
     ```typescript
     if (dateParam) {
       const parsed = new Date(dateParam);
       if (isNaN(parsed.getTime())) {
         return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
       }
       // ...
     }
     ```
   - This prevents unhandled Prisma 500 exceptions and returns a clean HTTP 400 response.

---

## 5. Verification Method

To independently reproduce both bugs and verify the entire empirical stress suite:

1. **Run the Full Challenger 1 Stress Harness**:
   ```powershell
   node scripts/test-m1-challenger.mjs
   ```
   - Observes 20 passed checks and the 2 exact failing adversarial assertions with full stack traces.

2. **Quick Reproduction of Bug 1 (Day +2 Leakage)**:
   ```powershell
   node -e "
   async function test() {
     const b = await (await fetch('http://127.0.0.1:3050/api/planner', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ title: 'Leak Test', date: '2026-09-08', startTime: '01:00', endTime: '02:00' })
     })).json();
     const rem = await (await fetch('http://127.0.0.1:3050/api/reminders/tomorrow')).json();
     const leaked = rem.blocks.some(x => x.id === b.block.id);
     console.log('BUG 1 CONFIRMED (Day +2 leaked into tomorrow):', leaked);
     await fetch('http://127.0.0.1:3050/api/planner?id=' + b.block.id, { method: 'DELETE' });
   }
   test();
   "
   ```

3. **Quick Reproduction of Bug 2 (Unhandled 500 on Malformed Date)**:
   ```powershell
   node -e "
   fetch('http://127.0.0.1:3050/api/planner?date=not-a-valid-date')
     .then(r => console.log('BUG 2 CONFIRMED (Status):', r.status));
   "
   ```

4. **Port Isolation Verification**:
   ```powershell
   Get-NetTCPConnection -LocalPort 3050, 3000
   ```
