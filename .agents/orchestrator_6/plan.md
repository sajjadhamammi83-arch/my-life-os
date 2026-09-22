# Execution Plan — Life OS Auto-Scheduler & Reminders

## Milestones
1. **Milestone 1: D-1 Advance Reminders & Future Events**
   - Implement `src/app/api/reminders/tomorrow/route.ts` harmonization (top-level `blocks`, `tasks`, `workouts`, `tomorrowPersianDate`, `timeFormatted`).
   - Implement dynamic badge & dropdown in `src/components/layout/Header.tsx` with `reminders-updated` listener.
   - Refine Tomorrow's Agenda widget in `/dashboard` (`src/app/dashboard/page.tsx`) and `/today` (`src/app/today/page.tsx`).
   - Update `src/app/api/planner/route.ts` & `/planner` to allow future date scheduling.
   - Review and verify: Worker -> Reviewer -> Challenger -> Auditor gate.

2. **Milestone 2: Capacity Engine & Auto-Scheduler UI**
   - Implement `src/lib/capacity-engine.ts` with interval subtraction of fixed shifts (Rayesh, Buffet, Cosmetics, University, gym, sleep), chronotype matching (Deep Work in morning), and zero-overlap slot calculation.
   - Implement AutoScheduler modal in `/planner` and `/dashboard`.
   - Implement `/api/planner/smart-schedule/route.ts` with 1-click SQLite persistence.
   - Review and verify: Worker -> Reviewer -> Challenger -> Auditor gate.

3. **Milestone 3: E2E Verification & Forensic Integrity Audit**
   - Implement comprehensive E2E test script `scripts/test-scheduler-suite.mjs`.
   - Run `tsc --noEmit` and route checks (Port 3050).
   - Independent verification across Reviewer, Challenger, and Forensic Auditor.
   - Victory claim and handoff report to Sentinel.
