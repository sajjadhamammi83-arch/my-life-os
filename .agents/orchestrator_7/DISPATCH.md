# Dispatch Log — orchestrator_7

## 2026-09-13T23:45:00Z
You are the Project Orchestrator (orchestrator_7) for Life OS.
Your working directory is: d:/my life/.agents/orchestrator_7
The authoritative user request is recorded in: d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the latest follow-up under 2026-09-13T20:09:45Z).

Mission:
Comprehensive integration and end-to-end data flow connection across all sections of Life OS, plus a universal End-to-End automated test suite.
Key Requirements:
1. R1: Cross-Module Data Flow & Synchronization:
   - Goals (/goals) linked to Today (/today) and Big 3. Unfinished tasks roll over to tomorrow and get suggested in calendar slots.
   - Learning (/learning) connected to Planner (/planner) and task boards so events, homework, exams auto-appear in daily view and calendar.
   - Finance (/finance) connected: daily register (ShopCashRegister), transactions, revenues, expenses linked to cost centers and reflected in P&L analytics (/analytics).
   - Reviews (/reviews) connected: daily review metrics (productivity score, deep work hours, 4 energy levels physical/emotional/mental/spiritual, mood, bottlenecks) linked to dashboard & /analytics charts.
2. R2: Unified Notifications & D-1 Reminders:
   - Verify and ensure header notification bell and D-1 advance reminders work for deadlines, exams, bank checks, and calendar events.
   - Maintain pristine minimal white theme (#ffffff), Vazirmatn font, clean contrast, Persian digits formatting.
3. R3: Automated End-to-End Test Suite:
   - Develop and run an automated E2E test script (e.g. scripts/test-e2e-all.ts or scripts/test-e2e-suite.mjs) testing all API endpoints and key routes:
     /api/dashboard, /api/today, /api/goals, /api/projects, /api/tasks, /api/finance, /api/reviews/daily, /api/learning, /api/calendar, /api/analytics
   - Validate CRUD operations and ensure no 500 errors.
   - Compile TypeScript with zero errors (`node node_modules/typescript/bin/tsc --noEmit` exit code 0).

Key Constraints:
- Working directory: d:/my life
- Never touch port 3000 (user's cafe server). Life OS must run strictly on port 3050.
- Maintain your own progress.md and BRIEFING.md in d:/my life/.agents/orchestrator_7/
- When all work is done and verified, report completion to the Sentinel with full evidence.
