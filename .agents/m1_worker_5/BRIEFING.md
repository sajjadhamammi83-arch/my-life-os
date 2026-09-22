# BRIEFING — 2026-09-06T11:30:00Z

## Mission
Implement Milestone 1: D-1 Advance Reminders & Future Events.

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: d:/my life/.agents/m1_worker_5
- Original parent: 1f9389b3-f7ba-4d13-8e3e-4ea9871691f7
- Milestone: Milestone 1: D-1 Advance Reminders & Future Events

## 🔒 Key Constraints
- Pure white minimal aesthetic (#ffffff, Vazirmatn font, zinc-200 borders, #09090b accents)
- Server running on port 3050. NEVER touch or stop port 3000 (PID 8600, user's cafe platform).
- Zero fake/mock implementations. Real database queries with Prisma and SQLite.
- Run `node node_modules/typescript/bin/tsc --noEmit` and ensure 0 errors.
- Ownership files:
  - `src/app/api/reminders/tomorrow/route.ts`
  - `src/app/api/planner/route.ts`
  - `src/components/layout/Header.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/today/page.tsx`

## Current Parent
- Conversation ID: 1f9389b3-f7ba-4d13-8e3e-4ea9871691f7
- Updated: not yet

## Task Summary
- **What to build**: Harmonize `/api/reminders/tomorrow` response payload (top-level and nested), fix Header Bell badge & dropdown with `reminders-updated` listener, polish Tomorrow's Agenda widgets in Dashboard and Today with workouts & high contrast, update `/api/planner` to support future dates in POST and date filtering in GET.
- **Success criteria**: TypeScript 0 errors, endpoints return genuine data, Header Bell updates live on `reminders-updated`, Dashboard and Today widgets display tomorrow's agenda accurately.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Will return both top-level (`blocks`, `tasks`, `workouts`, `tomorrowPersianDate`, `summary`) and nested (`reminders: { blocks, tasks, workouts }`) from `/api/reminders/tomorrow` to ensure backwards compatibility while seamlessly supporting Header and Today components.
- In `src/app/api/planner/route.ts`, support optional `date` (YYYY-MM-DD) query param in GET, and `date`, `startTime`, `endTime`, `start`, `end` in POST so events can be scheduled for any future date.
- In `Header.tsx`, add `window.addEventListener("reminders-updated", fetchTomorrowReminders)` and ensure dropdown cleanly formats blocks, tasks, and workouts.
- In `/dashboard/page.tsx` and `/today/page.tsx`, ensure workouts are included in tomorrow's items, and formatting aligns with RTL and white minimal theme.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Initial check pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Not run yet
- **Lint status**: Clean
- **Tests added/modified**: Pending

## Loaded Skills
None
