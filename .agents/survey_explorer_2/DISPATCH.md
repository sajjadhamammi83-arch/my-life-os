## 2026-09-03T17:41:54Z
You are survey_explorer_2 (teamwork_preview_explorer).
Your working directory is: d:/my life/.agents/survey_explorer_2/
Project root is: d:/my life
Original request file: d:/my life/.agents/ORIGINAL_REQUEST.md

You are a read-only exploration agent. DO NOT write or modify implementation source code or tests. Only create your report in your working directory.

TASK:
Investigate and document:
1. Database and persistence layer:
   - What database/ORM is used? (Prisma, SQLite, PostgreSQL, JSON files, local storage, etc.)
   - Database schema and data models (list all entities, relations, fields).
   - API routes, server actions, or backend endpoints.
2. Requirement R1: Financial & Register (دخل) & Inventory:
   - Current state of finance and register data models (Gym buffet, cosmetics store, Rayesh/salon).
   - Invoicing capabilities, transaction logging, linking to inventory stock.
   - Reorder point (نقطه سفارش) alerts.
   - Daily/weekly/monthly audit & reconciliation forms, gross profit calculations.
   - Missing tables, missing fields, or missing APIs needed for R1.
3. Requirement R3: Health, Workout & Biometrics:
   - Data models for calories, hydration, protein and weekly averages.
   - Gym workout logging data models (exercises, sets, weights).
   - Sleep efficiency and energy level correlation models/data.
4. Realistic 3-month simulation data status:
   - What mock/seed data currently exists?
   - Is there realistic 3-month historical data (active daily user) for finance, workouts, nutrition, habits, sleep, OKRs?
5. Cross-module ripple effects:
   - How selling an item in buffet/cosmetics updates inventory stock and register/دخل.
   - How logging a workout links to buffet/nutrition/energy.
6. Produce your comprehensive report at d:/my life/.agents/survey_explorer_2/survey_report.md.
When done, send a message back to parent with your findings summary and the path to your report.
