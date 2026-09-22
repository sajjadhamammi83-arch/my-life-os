# Comprehensive UI Architecture Analysis: Auto-Scheduler & D-1 Reminders System

## Executive Summary
This document delivers the architectural and component-level investigation for the **Auto-Scheduler and D-1 Advance Reminders** system across the Life OS application (`d:/my life`). 

The investigation examined:
1. **Header & Bell Notification** (`src/components/layout/Header.tsx` and `src/app/api/reminders/tomorrow/route.ts`).
2. **Dashboard (`src/app/dashboard/page.tsx`) & Today (`src/app/today/page.tsx`) Widgets**.
3. **Planner (`src/app/planner/page.tsx`) & Smart-Scheduler Engine (`src/app/api/planner/smart-schedule/route.ts`)**.
4. **Visual Design System Compliance** (Minimal white `#ffffff`, high-contrast black, Vazirmatn typography, RTL layout).

---

## 1. Header & Bell Notification Architecture

### 1.1 Current Implementation State
- **File**: `src/components/layout/Header.tsx` (Lines 14–57, 95–248).
- **Behavior**:
  - Maintains state: `persianDate`, `reminderData`, `isOpen`, `dropdownRef`.
  - Invokes `fetchTomorrowReminders()` on mount targeting `/api/reminders/tomorrow`.
  - Bell Button (`<button onClick={() => setIsOpen(!isOpen)}>`):
    - When `totalTomorrowCount > 0`, renders a high-contrast badge: `<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">{toPersianDigits(totalTomorrowCount)}</span>`.
    - When `totalTomorrowCount === 0`, renders a subtle inactive dot (`bg-zinc-400`).
  - Dropdown Popover (`isOpen === true`):
    - Popover header with Persian date and count: `{reminderData?.tomorrowPersianDate || "فردا"} • {toPersianDigits(totalTomorrowCount)} رویداد و کار در انتظار`.
    - Scrollable container (`max-h-[360px] overflow-y-auto`) split into:
      1. Calendar Blocks (`reminderData.blocks`)
      2. Tasks due tomorrow (`reminderData.tasks`)
      3. Workouts tomorrow (`reminderData.workouts`)
    - Popover footer: Quick link to `/planner` ("باز کردن برنامه‌ریز تقویم") and manual refresh button.

### 1.2 Identified Bugs & Schema Mismatch
A critical contract mismatch exists between `src/app/api/reminders/tomorrow/route.ts` and `Header.tsx`:
1. **Data Nesting**:
   - `route.ts` returns: `{ success: true, tomorrowDate: string, summary: { ... }, reminders: { blocks: [...], tasks: [...], workouts: [...] } }`.
   - `Header.tsx` (lines 148, 174, 206) reads `reminderData?.blocks`, `reminderData?.tasks`, `reminderData?.workouts`.
   - **Impact**: All lists in the dropdown evaluate to `undefined` and are omitted from display.
2. **Missing Properties**:
   - `b.timeFormatted`: `Header.tsx` line 162 accesses `b.timeFormatted`, but `route.ts` only provides raw `start` and `end` ISO strings.
   - `tomorrowPersianDate`: `Header.tsx` line 126 accesses `reminderData?.tomorrowPersianDate`, but `route.ts` provides `tomorrowDate` (ISO) without Persian formatting.
   - Task Area format: `Header.tsx` line 189 accesses `t.area && <span>{t.area.name}</span>`, whereas `route.ts` line 75 returns `area: t.area?.name || "عمومی"` (a primitive string).
   - Workout naming: `Header.tsx` lines 218–219 access `w.name` and `w.focusArea`, while `route.ts` returns `w.title` and `w.duration`.

### 1.3 Recommended Header Contract & Event Synchronization
1. **API Normalization**:
   Update `src/app/api/reminders/tomorrow/route.ts` to return both top-level and formatted attributes:
   ```ts
   return NextResponse.json({
     success: true,
     tomorrowDate: tomorrowStart.toISOString(),
     tomorrowPersianDate: formatPersianDate(tomorrowStart, { weekday: "long", day: "numeric", month: "long" }),
     summary: {
       totalItems,
       blocksCount: blocks.length,
       tasksCount: tasks.length,
       workoutsCount: workouts.length,
     },
     blocks: blocks.map((b) => ({
       id: b.id,
       title: b.title,
       type: b.type,
       start: b.start,
       end: b.end,
       timeFormatted: `${new Date(b.start).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} - ${new Date(b.end).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`,
       notes: b.notes,
     })),
     tasks: tasks.map((t) => ({
       id: t.id,
       title: t.title,
       priority: t.priority,
       workType: t.workType,
       areaName: t.area?.name || "عمومی",
       isBigThree: t.isBigThree,
     })),
     workouts: workouts.map((w) => ({
       id: w.id,
       title: w.title,
       duration: w.durationMinutes,
       focusArea: w.title,
     })),
     reminders: { ... } // preserved for backward compatibility
   });
   ```
2. **Global Event Listener for Real-Time Synchronization**:
   In `Header.tsx`, add an event listener:
   ```ts
   useEffect(() => {
     const handleRefresh = () => fetchTomorrowReminders();
     window.addEventListener("reminders-updated", handleRefresh);
     return () => window.removeEventListener("reminders-updated", handleRefresh);
   }, []);
   ```
   Whenever the Auto-Scheduler commits new blocks, it executes `window.dispatchEvent(new Event("reminders-updated"))`, immediately updating the Header Bell badge without a full page reload.

---

## 2. Dashboard & Today Pages: "Tomorrow's Agenda & Events" Widget

### 2.1 Dashboard (`src/app/dashboard/page.tsx`)
- **Nature**: Next.js Server Component (`export default async function DashboardPage()`).
- **Current Query** (lines 38–67):
  - Fetches tomorrow's `calendarBlock`s and uncompleted `task`s directly via Prisma.
- **Current Rendering** (lines 290–354):
  - Renders section: `یادآور پیش‌دستانه: برنامه‌های فردا (D-1)`.
  - Shows blocks and tasks in `bg-zinc-50 border border-zinc-200` rows.
- **Missing Elements**:
  1. Workouts scheduled for tomorrow are not queried or rendered.
  2. No launcher button or modal trigger for the Auto-Scheduler assistant.
- **Architecture Solution for Dashboard**:
  - To maintain server rendering while allowing interactive modal execution:
    - Create a client trigger component: `src/components/planner/AutoSchedulerTrigger.tsx` (a high-contrast black button with `Sparkles` icon) that mounts the `AutoSchedulerModal`.
    - Place this trigger either in the Hero Banner or in the header of the "Tomorrow's Agenda" widget.
    - Query `prisma.workout` in `DashboardPage` for tomorrow and render workout cards alongside blocks and tasks.

### 2.2 Today Page (`src/app/today/page.tsx`)
- **Nature**: Client Component (`"use client"`).
- **Current Query** (lines 61–71):
  - Fetches `/api/reminders/tomorrow` into `tomorrowAgenda`.
- **Current Rendering** (lines 302–363):
  - Renders `یادآور پیش‌دستانه: برنامه‌ها و رویدادهای فردا (D-1)`.
  - Suffers from the exact schema mismatch as Header (`tomorrowAgenda?.blocks` and `tomorrowAgenda?.tomorrowPersianDate` evaluate to undefined).
- **Missing Elements**:
  1. Workouts are not rendered in the card.
  2. No direct button to launch the Auto-Scheduler if tomorrow is empty or light.

### 2.3 Proposed Unified Widget Structure (`TomorrowAgendaWidget`)
Whether embedded or extracted as a component, both `/dashboard` and `/today` should display the full three-tier structure:
1. **Header**:
   - Icon: `<Bell className="w-4 h-4 text-zinc-900" />`
   - Title: `یادآور پیش‌دستانه: برنامه‌ها و رویدادهای فردا (D-1)`
   - Subtitle / Date: Persian formatted date (`دوشنبه ۱۷ شهریور`) + badge with total item count.
   - Quick action: Link to `/planner` + Optional "زمان‌بندی هوشمند" trigger.
2. **Body Items (3 Sections)**:
   - **بلوک‌های زمانی تقویم (Time Blocks)**:
     - Time range badge (`font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded text-[11px]`).
     - Title (`text-xs font-semibold text-zinc-900`).
     - Category tag: `Deep Work` (black badge), `Shallow Work` (zinc-200 badge), `Health` (zinc-100 badge).
   - **تسک‌های سررسید فردا (Due Tasks)**:
     - Checkbox or dot indicator.
     - Title, Area badge (`t.areaName`), `Big 3` marker if designated.
   - **برنامه ورزشی فردا (Workouts)**:
     - Dumbbell icon, workout title, estimated minutes.
3. **Empty State**:
   - Clean zinc-50 container with `Calendar` icon and text:
     *"هیچ رویداد، تسک یا بلوک مسدودشده‌ای برای فردا ثبت نشده است؛ روز شما کاملاً آزاد است."*
   - Includes a direct CTA: *"تخصیص هوشمند زمان با دستیار Auto-Scheduler"*

---

## 3. Planner (`src/app/planner/page.tsx`) & Auto-Scheduler Assistant

### 3.1 Existing Planner Architecture & Limitations
- **Current State**:
  - `PlannerPage` displays day template selector (روز طلایی, روز بوفه و آرایشی, روز دانشگاه, etc.).
  - Displays a static/semi-dynamic list of `timeBlocks`.
  - Has a manual creation modal (`isModalOpen`):
    - Inputs: `blockTime` ("۰۹:۰۰ - ۱۱:۰۰"), `blockTitle`, `blockType`.
  - **Major Deficiencies**:
    1. **Zero Date Navigation**: There is no date picker, week slider, or date tab. Users cannot view blocks for tomorrow or future days.
    2. **API Hardcoded to Today**: `src/app/api/planner/route.ts` line 18 hardcodes `const today = new Date(); const start = new Date(today); const end = new Date(today);`. It does not accept a `date` parameter.
    3. **Disconnected Smart-Schedule Engine**: An advanced scheduling algorithm already exists in `src/app/api/planner/smart-schedule/route.ts`, but it has no UI interface whatsoever!

### 3.2 Deep Dive: The Existing Smart-Schedule Engine (`/api/planner/smart-schedule`)
The backend route at `src/app/api/planner/smart-schedule/route.ts` is already fully written and highly capable:
- **Input Parameters**:
  - `title`: string
  - `category`: "Book" | "Project" | "University" | "Deep Work" | "General"
  - `totalHours`: number (or calculated from `totalPages / pagesPerHour`)
  - `deadline`: string (ISO date or YYYY-MM-DD)
  - `sessionDurationMinutes`: number (30 to 180 min, default 60)
  - `preferredSlot`: "morning" | "afternoon" | "evening" | "auto"
  - `confirm`: boolean (if `true`, commits `CalendarBlock`s to SQLite)
- **Feasibility & Chronotype Logic**:
  - Morning (08:30–12:00): Prioritized for Deep Work and analytical projects.
  - Afternoon (15:00–18:00): Secondary focus, university tasks, admin.
  - Evening (19:30–22:00): Books, reflection, light reading.
  - Collision avoidance: Scans existing `CalendarBlock`s and previously proposed sessions to guarantee zero overlap.
  - Returns: `feasibility` ("FEASIBLE" | "TIGHT" | "IMPOSSIBLE"), `advice`, `proposedSessions[]`, `scheduledHours`, `totalRequiredHours`.

### 3.3 Proposed UI: `AutoSchedulerModal.tsx`
To bring this engine to life, we specify a 3-stage interactive modal component: `src/components/planner/AutoSchedulerModal.tsx`.

#### Stage 1: Input Form
- **Fields**:
  1. **عنوان کار یا کتاب (Task/Book Title)**:
     - Text input with placeholder: `مثلاً: کتاب تفکر سریع و کند یا توسعه درگاه بانکی رایش`.
  2. **نوع فعالیت (Category)**:
     - Segmented tabs:
       - 📚 مطالعه کتاب (`Book`)
       - 💻 پروژه نرم‌افزاری رایش (`Project`)
       - 🎓 دروس دانشگاهی (`University`)
       - ⚡ کار عمیق استراتژیک (`Deep Work`)
       - 🏢 امور کسب‌وکار و بوفه (`General`)
  3. **محاسبه حجم زمان (Workload Calculation)**:
     - Switch between:
       - *بر اساس ساعت*: Input for `totalHours` (e.g. `۱۰ ساعت`).
       - *بر اساس تعداد صفحات کتاب*: Input for `totalPages` (e.g. `۲۴۰ صفحه`) + `pagesPerHour` (default `۲۵ صفحه در ساعت`), automatically calculating the required hours.
  4. **تاریخ ضرب‌الاجل (Deadline)**:
     - Date picker or standard Persian date selector.
  5. **مدت زمان هر جلسه (Session Duration)**:
     - Quick chips: `۳۰ دقیقه` | `۴۵ دقیقه` | `۶۰ دقیقه` | `۹۰ دقیقه` | `۱۲۰ دقیقه`.
  6. **ترجیح ریتم زیستی (Chronotype & Energy Slot)**:
     - `خودکار (ریتم زیستی)` | `صبح (اوکج تمرکز)` | `عصر` | `شب (مطالعه آرام)`.
- **Action**:
  - Black high-contrast button: `سنجش ظرفیت و تولید زمان‌بندی هوشمند` (triggers POST without `confirm`).

#### Stage 2: Feasibility & Calendar Preview
- **Feasibility Assessment Callout**:
  - `FEASIBLE` (100% capacity):
    - Dark zinc-950 card with white text:
      `✓ کاملاً امکان‌پذیر با برنامه فعلی: تمامی X ساعت در Y جلسه قبل از موعد سررسید تخصیص یافت.`
  - `TIGHT` (Partial capacity / bottleneck):
    - Zinc-100 card with dark border and `AlertTriangle`:
      `⚠ تنگنای ظرفیت: از X ساعت تنها Y ساعت فضای خالی بدون تداخل یافت شد. پیشنهاد: جابه‌جایی کارهای کم‌اهمیت یا افزایش چند روزه مهلت ضرب‌الاجل.`
  - `IMPOSSIBLE` (0 capacity):
    - Red-accented zinc card warning that all calendar slots are saturated.
- **Proposed Sessions Calendar Timeline**:
  - Interactive table / list showing each session before commitment:
    - Session badge: `جلسه ۱ از ۵`
    - Date: `دوشنبه ۱۷ شهریور ۱۴۰۵`
    - Time Slot: `۰۸:۳۰ - ۱۰:۰۰`
    - Duration: `۹۰ دقیقه`
    - Work Type: `کار عمیق (Deep Work)`
  - Optional: Ability to exclude or delete an individual proposed session before saving.

#### Stage 3: One-Click Commitment to SQLite
- **Action**:
  - Button: `تأیید نهایی و ثبت خودکار در تقویم SQLite`
  - Submits `{ ...payload, confirm: true }` to `/api/planner/smart-schedule`.
  - Displays instant visual feedback: `✓ ۵ بلوک زمانی با موفقیت در تقویم و پایگاه داده ثبت شدند`.
  - Dispatches `window.dispatchEvent(new Event("reminders-updated"))`.
  - Refreshes the local Planner timeline.

### 3.4 Enhancements to Planner Page (`/planner`)
1. **Header Action**:
   - Add `<button onClick={() => setIsAutoSchedulerOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all"> <Sparkles className="w-4 h-4 text-white" /> <span>دستیار هوشمند زمان‌بندی</span> </button>` right next to "بلوک زمانی جدید".
2. **Date Navigation Bar**:
   - Add a date switcher at the top of the timeline:
     - `امروز` | `فردا (D-1)` | `پس‌فردا` | `انتخاب تاریخ تقویم...`
   - Wire `selectedDate` state into `loadPlanner(date)`.
3. **Extend `/api/planner/route.ts`**:
   - In `GET`: Accept `?date=YYYY-MM-DD` query parameter to filter blocks by day.
   - In `POST`: Accept optional `date` in request body instead of hardcoding `new Date()`.

---

## 4. Visual Design Standards & Token Compliance

All proposed UI additions strictly follow the design guidelines:
1. **Color Tokens**:
   - Main page background: Pure white `#ffffff`.
   - Card backgrounds: Clean white (`bg-white`), bordered by subtle zinc-200 (`#e4e4e7`).
   - Inner list rows & preview chips: Light surface `bg-zinc-50` with `border-zinc-200`.
   - Primary high-contrast accents & buttons: Deep black `#09090b` (`bg-black` or `bg-zinc-950`) with crisp white text (`text-white`).
   - Secondary buttons: `bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200`.
   - Status indicators: Deep black for active/completed, zinc-300/400 for inactive/neutral.
2. **Typography**:
   - Primary Font: **Vazirmatn** (`font-sans`).
   - Digits: All numbers, hours, percentages, and currencies passed through `toPersianDigits()`.
   - Direction: Pure RTL (`direction: rtl`).
3. **No Dark Theme Regressions**:
   - No dark gray full-page backgrounds.
   - High contrast between text and background on all cards.
4. **Icons**:
   - Lucide icons with consistent stroke (`w-4 h-4 text-zinc-900` or `text-white` when on black surfaces).

---

## 5. UI Component Hierarchy & Integration Map

```
AppLayout (src/components/layout/AppLayout.tsx)
├── Sidebar (src/components/layout/Sidebar.tsx)
├── Header (src/components/layout/Header.tsx)
│   └── Bell Popover (D-1 Reminders & Tomorrow's Events)
│       ├── Calendar Blocks list (formatted times, type badge)
│       ├── Due Tasks list (priority, area, Big 3)
│       └── Workouts list (target, duration)
│
├── DashboardPage (src/app/dashboard/page.tsx)
│   ├── AutoSchedulerTrigger (Client CTA button)
│   └── Tomorrow Agenda Widget (Blocks + Tasks + Workouts)
│
├── TodayPage (src/app/today/page.tsx)
│   └── Tomorrow Agenda Widget (Client fetch, interactive status)
│
└── PlannerPage (src/app/planner/page.tsx)
    ├── Date Navigation Bar (Today, Tomorrow, Custom Date)
    ├── Standard Manual Block Modal (Updated with Date picker)
    └── AutoSchedulerModal (Client Component)
        ├── Step 1: Input Form (Book/Project, Hours/Pages, Deadline, Chronotype)
        ├── Step 2: Feasibility & Proposed Sessions Preview
        └── Step 3: Confirm & Commit to SQLite (/api/planner/smart-schedule)
```

---

## 6. Summary of Required Modifications for Implementation Phase

| Module | File | Modification Nature | Key Changes |
|---|---|---|---|
| **API** | `src/app/api/reminders/tomorrow/route.ts` | Bug fix & Schema alignment | Return top-level `blocks`, `tasks`, `workouts`, `tomorrowPersianDate`, and `timeFormatted` strings. |
| **API** | `src/app/api/planner/route.ts` | Feature expansion | Accept `date` parameter in `GET` (filtering by day) and `POST` (create block on future dates). |
| **Header** | `src/components/layout/Header.tsx` | Bug fix & Event binding | Bind to normalized API fields, add `reminders-updated` window event listener. |
| **Widget** | `src/app/dashboard/page.tsx` | Data enrichment & CTA | Fetch workouts for tomorrow, add `AutoSchedulerTrigger` button. |
| **Widget** | `src/app/today/page.tsx` | Data binding & Workouts | Correct `tomorrowAgenda` bindings and render tomorrow's workouts. |
| **Planner** | `src/app/planner/page.tsx` | Feature addition | Add Date Navigator tabs, add Auto-Scheduler button, connect to `AutoSchedulerModal`. |
| **New Component** | `src/components/planner/AutoSchedulerModal.tsx` | New interactive UI | 3-step assistant: Input form -> Feasibility preview -> One-click SQLite commit. |
| **New Component** | `src/components/planner/AutoSchedulerTrigger.tsx` | New trigger helper | Client-side trigger for embedding in Server Components (Dashboard). |
