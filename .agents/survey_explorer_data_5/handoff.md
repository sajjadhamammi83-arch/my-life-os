# 5-Component Handoff Report: Data & API Survey for Auto-Scheduler & D-1 Reminders

**Agent**: Data & API Explorer (`survey_explorer_data_5`)  
**Parent**: Orchestrator (`1f9389b3-f7ba-4d13-8e3e-4ea9871691f7`)  
**Date**: 2026-09-06  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

1. **Prisma Schema (`prisma/schema.prisma`)**:
   - `CalendarBlock` (lines 194–218) defines:
     `id String @id @default(cuid())`, `title String`, `areaId String?`, `projectId String?`, `taskId String?`, `start DateTime`, `end DateTime`, `plannedDuration Int @default(60)`, `actualDuration Int @default(0)`, `type String @default("Deep Work")`, `dayType String @default("روز عادی")`, `location String?`, `energyRequirement String @default("medium")`, `notes String?`, `recurrence String?`, `status String @default("scheduled")`.
   - `Task` (lines 151–192) defines:
     `dueDate DateTime?`, `workType String @default("Deep Work")`, `estimatedMinutes Int @default(30)`, `priority String @default("medium")`, `eisenhowerQuadrant String @default("Q2")`, `isBigThree Boolean @default(false)`, `status String @default("inbox")`, `calendarBlocks CalendarBlock[]`.
   - Domain models: `Book` (lines 885–897, fields `pages`, `currentPage`, `title`, `author`), `UniversityCourse` (lines 841–856), `UniversityAssignment` (lines 858–869).

2. **Existing API Routes**:
   - `src/app/api/planner/route.ts`:
     - Lines 18–20:
       ```typescript
       const today = new Date();
       const start = new Date(today);
       const end = new Date(today);
       ```
       Line 31: `prisma.calendarBlock.create({ data: { title, type, start, end, notes } })`.
       No date parameter is extracted or respected; all manually posted blocks are assigned to "today".
     - Line 6: `prisma.calendarBlock.findMany({ orderBy: { start: "asc" } })` returns all blocks without date filtering.
   - `src/app/api/planner/smart-schedule/route.ts`:
     - Lines 6–16: Defines `SmartScheduleRequest` with `title`, `category`, `totalHours`, `totalPages`, `pagesPerHour`, `deadline`, `sessionDurationMinutes`, `preferredSlot`, `confirm`.
     - Lines 128–134: Checks collision against `existingBlocks`:
       ```typescript
       const hasCollision = existingBlocks.some((b) => {
         const bStart = new Date(b.start).getTime();
         const bEnd = new Date(b.end).getTime();
         const cStart = candidateStart.getTime();
         const cEnd = candidateEnd.getTime();
         return cStart < bEnd && cEnd > bStart;
       });
       ```
     - Lines 185–197: Implements 1-click DB persistence:
       ```typescript
       if (confirm && proposedSessions.length > 0) {
         for (const s of proposedSessions) {
           await prisma.calendarBlock.create({ ... });
         }
       }
       ```
   - `src/app/api/reminders/tomorrow/route.ts`:
     - Lines 52–84: Returns response payload:
       ```typescript
       return NextResponse.json({
         success: true,
         tomorrowDate: tomorrowStart.toISOString(),
         summary: { totalItems, blocksCount, tasksCount, workoutsCount },
         reminders: { blocks, tasks, workouts }
       });
       ```
       Live fetch command `fetch('http://localhost:3050/api/reminders/tomorrow')` yielded:
       `{"success":true,"tomorrowDate":"...","summary":{...},"reminders":{"blocks":[],"tasks":[],"workouts":[]}}`.

3. **Frontend UI Contract in `src/components/layout/Header.tsx` and `src/app/today/page.tsx`**:
   - `Header.tsx` lines 21–25, 126, 148, 162:
     Expects `reminderData.tomorrowPersianDate`, `reminderData.blocks` (array directly on data), `reminderData.tasks`, `reminderData.workouts`, and `b.timeFormatted`.
   - `src/app/today/page.tsx` lines 311, 330, 336, 344:
     Expects `tomorrowAgenda?.tomorrowPersianDate`, `tomorrowAgenda?.blocks`, `b.timeFormatted`, `tomorrowAgenda?.tasks`.

4. **Port 3050 and Port 3000 Server State**:
   - Running `Get-NetTCPConnection -LocalPort 3000,3050`:
     - `LocalPort 3050`: `Listen`, `OwningProcess 13660` (Next.js server).
     - `LocalPort 3000`: `Listen`, `OwningProcess 8600` (User's cafe server).
   - `package.json` scripts: `"dev": "next dev -p 3050"`, `"start": "next start -p 3050"`.

5. **Test and Compilation State**:
   - `node node_modules/typescript/bin/tsc --noEmit` exited with code 0 (no errors).
   - `node scripts/test-core.mjs` executed 7 formula checks and passed with exit code 0.
   - `scripts/test-e2e-suite.mjs` sweeps 20 routes on port 3050.

---

## 2. Logic Chain

1. **Schema Non-Disruption**:
   - From Observation 1: `CalendarBlock` already has `start`, `end`, `plannedDuration`, `type`, `dayType`, `energyRequirement`, `status`, `notes`, `taskId`, and `projectId`.
   - Any scheduled block (project work, deep work, university study, book reading) can be represented by mapping the category to `type` (e.g. `Deep Work` or `Learning`) and storing session indices or display times in `notes`.
   - Changing the SQLite schema via Prisma requires migrations that risk database locks or data resets on `dev.db`.
   - Therefore, no schema migration is required.

2. **D-1 Reminder Broken Display Cause**:
   - From Observation 2: `/api/reminders/tomorrow` wraps items under `reminders: { blocks, tasks, workouts }` and does not provide `tomorrowPersianDate` or `timeFormatted`.
   - From Observation 3: `Header.tsx` and `src/app/today/page.tsx` evaluate `data.blocks` and `data.tomorrowPersianDate`.
   - Because `data.blocks` is undefined, `totalTomorrowCount` calculates as 0 or empty list rendering occurs even when items exist.
   - Therefore, modifying `/api/reminders/tomorrow` to return both top-level and nested properties, formatting `tomorrowPersianDate` with `formatPersianDate()`, and providing `b.timeFormatted` will immediately fix the D-1 notifications and widgets.

3. **Future Block Creation Bug**:
   - From Observation 2: `POST /api/planner` defaults `start` and `end` to today's date (`new Date()`).
   - If a user uses the planner UI to add an event for tomorrow, the backend forces it to today.
   - Therefore, `POST /api/planner` must accept an explicit `date` or `startDate`/`endDate` string.

4. **Auto-Scheduler Engine Readiness**:
   - From Observation 2: `src/app/api/planner/smart-schedule/route.ts` already contains working logic for input parameters, collision detection, and batch insertion with `confirm: true`.
   - It needs refinements in session distribution (chronological within days, balanced across available days) and UI integration.

5. **Port 3000 Protection**:
   - From Observation 4: Process 8600 is listening on Port 3000, which is the user's external cafe project.
   - Port 3050 is exclusively used by Life OS (PID 13660).
   - All tools, scripts, and tests must target port 3050 only.

---

## 3. Caveats

- **No Caveats**: The investigation thoroughly covered the Prisma schema, existing API routes, live responses, server processes, and test suites.
- Assumptions made:
  - Assumed the user prefers keeping SQLite database schema stable without migrations when existing models are sufficient.
  - Assumed standard working windows (Morning 08:30–12:00, Afternoon 15:00–18:00, Evening 19:30–22:00) align with the Life OS design.

---

## 4. Conclusion

1. **Schema**: Keep `CalendarBlock` and `Task` as-is. No schema migrations needed.
2. **API Harmonization**:
   - Fix payload structure in `src/app/api/reminders/tomorrow/route.ts` to supply top-level `blocks`, `tasks`, `workouts`, `tomorrowPersianDate`, and `timeFormatted`.
   - Update `src/app/api/planner/route.ts` to accept future dates in `POST` and date query filters in `GET`.
   - Utilize existing `src/app/api/planner/smart-schedule/route.ts` for capacity checks, preview, and 1-click persistence.
3. **Environment**: Maintain strict isolation on port 3050; never touch port 3000.
4. **Testing**: Implement an automated test script (`scripts/test-scheduler-suite.mjs`) covering D-1 reminder accuracy, zero overlap assertion, 1-click SQLite persistence, and route 200 checks.

---

## 5. Verification Method

1. **TypeScript Compilation**:
   ```powershell
   node node_modules/typescript/bin/tsc --noEmit
   ```
   *Expected result*: Exit code 0.

2. **Verify Port 3050 Binding & Port 3000 Isolation**:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000,3050 | Select-Object LocalAddress,LocalPort,State,OwningProcess
   ```
   *Expected result*: Port 3050 listening (PID 13660), Port 3000 listening (PID 8600).

3. **Verify Core Tests**:
   ```powershell
   node scripts/test-core.mjs
   ```
   *Expected result*: "ALL CORE LIFE OS LOGIC & FORMULA TESTS PASSED!"

4. **Verify D-1 Reminders Endpoint Output**:
   ```powershell
   node -e "fetch('http://localhost:3050/api/reminders/tomorrow').then(r=>r.json()).then(d=>console.log(d.success, d.summary))"
   ```
   *Expected result*: `{ success: true, summary: { ... } }` with HTTP 200.

5. **Verify Smart Schedule Preview Endpoint**:
   ```powershell
   node -e "fetch('http://localhost:3050/api/planner/smart-schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Test Book', category: 'Book', totalHours: 2, deadline: '2026-09-12' }) }).then(r=>r.json()).then(d=>console.log(d.feasibility, d.sessionsCount))"
   ```
   *Expected result*: `FEASIBLE 2`.
