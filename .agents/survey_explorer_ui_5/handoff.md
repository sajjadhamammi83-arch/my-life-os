# Handoff Report: UI Architecture for Auto-Scheduler & D-1 Reminders

## 1. Observation
1. **Header & Bell Notification**:
   - `src/components/layout/Header.tsx` lines 95–248: Contains `<Bell className="w-4 h-4" />` with badge `<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-black ...">{toPersianDigits(totalTomorrowCount)}</span>`.
   - `src/components/layout/Header.tsx` line 29: Calls `fetch("/api/reminders/tomorrow")`.
   - `src/app/api/reminders/tomorrow/route.ts` lines 52–83: Returns JSON with `{ success: true, tomorrowDate, summary: { totalItems, ... }, reminders: { blocks, tasks, workouts } }`.
   - `src/components/layout/Header.tsx` lines 148, 174, 206: Evaluates `reminderData?.blocks`, `reminderData?.tasks`, and `reminderData?.workouts`. Because `blocks` and `tasks` are placed under `reminders: { ... }` in `route.ts`, `reminderData?.blocks` evaluates to `undefined`, resulting in empty lists in the popover.
   - `src/components/layout/Header.tsx` line 162: Evaluates `b.timeFormatted`. But `route.ts` only supplies `b.start` and `b.end` ISO strings.
   - `src/components/layout/Header.tsx` line 126: Evaluates `reminderData?.tomorrowPersianDate`, but `route.ts` returns `tomorrowDate` (ISO) without Persian formatting.
2. **Dashboard & Today Widgets**:
   - `src/app/dashboard/page.tsx` lines 38–67 & 290–354: A Server Component directly querying Prisma for tomorrow's `calendarBlock` and `task`. Renders `یادآور پیش‌دستانه: برنامه‌های فردا (D-1)`. It does not query or display `workout` for tomorrow, and lacks any button/trigger to launch the Auto-Scheduler.
   - `src/app/today/page.tsx` lines 61–71 & 302–363: A Client Component querying `/api/reminders/tomorrow`. Suffers from the exact same schema mismatch as Header (`tomorrowAgenda?.blocks` is undefined). Does not display tomorrow's workouts.
3. **Planner & Smart-Schedule Engine**:
   - `src/app/planner/page.tsx` lines 18–29, 45–73: Displays day archetypes and list of `timeBlocks`.
   - `src/app/api/planner/route.ts` line 18: Hardcodes `const today = new Date(); const start = new Date(today); const end = new Date(today);`. Does not accept a `date` parameter for creating future blocks or viewing specific dates.
   - `src/app/api/planner/smart-schedule/route.ts`: Contains a fully implemented scheduling engine accepting `title`, `category`, `totalHours`, `totalPages`, `deadline`, `sessionDurationMinutes`, `preferredSlot`, and `confirm`. Computes feasibility (`FEASIBLE`, `TIGHT`, `IMPOSSIBLE`), matches chronotype energy slots (morning for Deep Work, evening for books), prevents collisions, and writes to SQLite when `confirm: true`. However, it has NO front-end modal, button, or preview connected to it in `/planner` or `/dashboard`.
4. **Visual & Styling Standards**:
   - `src/app/globals.css` lines 15–25 & 62–85: Configured for `background-color: #ffffff`, `color: #09090b`, `direction: rtl`, `font-family: var(--font-vazirmatn)`. Badges `.badge-deep-work` (`#09090b` text white), `.badge-shallow-work`, `.badge-health`, `.badge-admin`.
   - `tailwind.config.ts` line 13: `fontFamily: { sans: ["var(--font-vazirmatn)", ...] }`.

---

## 2. Logic Chain
1. **Observation 1 & 2** establish that the D-1 reminders mechanism was partially scaffolded in Header, Today, and Dashboard, but currently fails to show calendar blocks in Header and Today because the API wraps data in `data.reminders.blocks`, whereas the components look for `data.blocks`.
2. Normalizing the API response in `/api/reminders/tomorrow/route.ts` (exposing top-level `blocks`, `tasks`, `workouts`, `tomorrowPersianDate`, and `timeFormatted`) directly resolves the rendering issue in both `Header.tsx` and `TodayPage` without changing their existing internal presentation markup.
3. Adding a window event listener (`reminders-updated`) to `Header.tsx` ensures that as soon as the user schedules new events via Auto-Scheduler or Planner, the Header Bell badge updates dynamically.
4. **Observation 3** reveals that the backend engine for auto-scheduling (`/api/planner/smart-schedule`) is already completed and tested, but completely decoupled from the UI.
5. Therefore, the implementation requires building an interactive client modal (`AutoSchedulerModal.tsx`) with a 3-step workflow (Input form -> Feasibility preview -> One-click SQLite commit) and mounting it on `/planner` and `/dashboard` (via a client trigger button `AutoSchedulerTrigger.tsx`).
6. To allow future date scheduling directly from the Planner timeline, `/api/planner/route.ts` must be extended to accept a `date` parameter in `GET` and `POST`, and `PlannerPage` must include a date switcher (Today, Tomorrow, Custom Date).
7. **Observation 4** verifies that all new components will strictly adhere to the white minimal aesthetic (`#ffffff`, zinc-200 borders, `#09090b` dark accents, Vazirmatn typography, and Persian numerals via `toPersianDigits()`).

---

## 3. Caveats
- No changes should be made to port 3000 (reserved for user's cafe application). All services run on port 3050.
- Database schema (`CalendarBlock`) was inspected in `prisma/schema.prisma` and already supports `type`, `dayType`, `start`, `end`, `notes`, `plannedDuration`, `actualDuration`. No schema migration is required.
- The Auto-Scheduler engine currently slots events starting from `tomorrow` (D+1). Scheduling events for the current day ("today") is intentionally excluded by the engine's design (`startDate.setDate(now.getDate() + 1)`).

---

## 4. Conclusion
The Auto-Scheduler backend engine is already built; the UI layer only requires:
1. Harmonizing the `/api/reminders/tomorrow` payload to fix the Header Bell dropdown and Today page D-1 widget.
2. Enriching the Dashboard and Today widgets with workout schedules.
3. Constructing `AutoSchedulerModal.tsx` and adding launch triggers to `/planner` and `/dashboard`.
4. Updating `src/app/api/planner/route.ts` and `src/app/planner/page.tsx` with date navigation for future date calendar block viewing and creation.
5. Preserving the pure white minimal aesthetic (`#ffffff`) and Vazirmatn RTL layout.

---

## 5. Verification Method
1. **TypeScript Static Compilation**:
   ```bash
   node node_modules/typescript/bin/tsc --noEmit
   ```
   Must exit with code 0.
2. **Endpoint Contract Verification**:
   Query `http://localhost:3050/api/reminders/tomorrow` and verify that `blocks`, `tasks`, `workouts`, `tomorrowPersianDate`, and `timeFormatted` are present at the root of the JSON response.
3. **UI Verification**:
   - Inspect `http://localhost:3050/dashboard`: Verify "یادآور پیش‌دستانه (D-1)" displays tomorrow's events and the Auto-Scheduler trigger button is present.
   - Inspect `http://localhost:3050/today`: Verify tomorrow's agenda card renders calendar blocks, tasks, and workouts.
   - Click Header Bell: Verify badge displays count and dropdown renders tomorrow's items.
   - Inspect `http://localhost:3050/planner`: Verify date switcher allows navigating to tomorrow, and clicking "دستیار هوشمند زمان‌بندی" opens the Auto-Scheduler modal, checks feasibility, previews sessions, and commits blocks to SQLite.
