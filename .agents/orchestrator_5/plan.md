# Plan — Life OS Auto-Scheduler & D-1 Advance Reminder System

## Overview
Implement the complete Intelligent Life OS Auto-Scheduler and D-1 Advance Reminders system per ORIGINAL_REQUEST.md (Follow-up 2026-09-05T22:47:22Z).

## Milestones
1. **Phase 0: Survey & Investigation (Parallel Explorers)**
   - Investigate existing codebase, previous attempts in .agents/ (orchestrator_1 to 4), schema.prisma, and relevant UI components (Header, Planner, Dashboard, Today).
   - Identify existing implementations, gaps, and exact integration points.
2. **Phase 1: Milestone 1 (M1) — D-1 Advance Reminders & Tomorrow's Agenda**
   - R1: Register tasks/meetings/events for future dates in `/planner`.
   - Auto-monitor deadlines and events for tomorrow.
   - Header Bell badge and dropdown with tomorrow's items.
   - Dedicated "Tomorrow's Agenda & Events" widget on `/dashboard` and `/today`.
3. **Phase 2: Milestone 2 (M2) — Intelligent Capacity & Feasibility Engine**
   - R2: Parameters: task/book name, total hours (or pages + reading speed), deadline, session duration.
   - Free hours calculation deducting fixed shifts (gym buffet, cosmetics, Rayesh, university), meetings, workouts, sleep.
   - Feasibility check: "Feasible with current schedule" vs "Time bottleneck with optimization recommendation".
   - Energy & Chronotype matching: Deep Work in morning/peak hours; rescheduling suggestions for flexible/shallow tasks.
4. **Phase 3: Milestone 3 (M3) — Interactive UI & 1-Click Calendar Registration**
   - R3: Modal/assistant in `/planner` and `/dashboard`.
   - Clean form with task category selection (Book, Rayesh Software Project, Business Task, Academic Study).
   - Calendar preview with editability.
   - Final confirmation button creating `CalendarBlock`s in SQLite DB and syncing with `/today` and `/planner`.
5. **Phase 4: Milestone 4 (M4) — Verification, Typecheck & Forensic Audit**
   - R4: Minimal white theme (#ffffff), crisp black contrast, Vazirmatn font.
   - TypeScript check: `node node_modules/typescript/bin/tsc --noEmit` exit code 0.
   - All routes 200 OK on port 3050 (never touch port 3000).
   - Forensic Integrity Audit (`teamwork_preview_auditor`).
   - Final handoff to parent sentinel.
