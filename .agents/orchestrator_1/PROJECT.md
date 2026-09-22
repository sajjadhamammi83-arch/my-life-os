# Project: Life OS 3-Month Realistic Simulation & Full 17-Module Integration

## Architecture
- Framework: Next.js 14.2.16 (App Router) with React 18 & TypeScript 5.6
- ORM & Database: Prisma 5.22.0 with SQLite (`prisma/dev.db`)
- Styling: Tailwind CSS 3.4, Vazirmatn font, Minimal Pure White (`#ffffff`) theme
- Server: Port 3050 strictly enforced (`next dev -p 3050`); Port 3000 strictly isolated (user cafe platform)
- Routing: 17 Core Modules + 2 Auxiliary (`/tasks`, `/routines`) + 2 Aliases (`/calendar` -> `/planner`, `/inventory` -> `/finance`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Multi-Center Cash Register Schema | Update `ShopCashRegister` with `costCenterId` & compound unique constraint `[date, costCenterId]` | M1 | survey_explorer_2 |
| 2 | Workout & Exercise Schema | Verify & update `Workout` and `WorkoutExercise` models in Prisma | M1 | survey_explorer_2 |
| 3 | 3-Month Granular Seed Simulation | Rich 90-day simulation history for workouts, nutrition, invoices, transactions, habits, blocks | M1 | survey_explorer_2 |
| 4 | Products API (`GET /api/finance/products`) | Return products list with stock and reorder point status | M2 | survey_explorer_1, survey_explorer_2 |
| 5 | Multi-Center Cash Register API & UI | Fix `handleSaveCashRegister` dead action, support `GET/POST /api/finance/cash-register` per cost center | M2 | survey_explorer_2, survey_explorer_3 |
| 6 | Invoicing & Inventory Sales Linkage | Update `/api/finance/sales` to create `Invoice` & `InvoiceItem`, update daily cash register, return `updatedStock` | M2 | survey_explorer_2 |
| 7 | Quick Capture Inventory Linkage | Update `/api/quick-capture` for sale action to deduct inventory stock | M2 | survey_explorer_2 |
| 8 | Reorder Point Alerts | Low stock warnings & reorder banners in header and finance | M2 | survey_explorer_2, survey_explorer_3 |
| 9 | Cash Audit & Gross Profit Reconciliation | Daily, weekly, monthly audit & reconciliation views with true gross profit (Revenue - COGS) | M2 | survey_explorer_2 |
| 10 | Calendar Time-blocking DB Persistence | Wire `/planner` to `GET/POST/DELETE /api/planner` for `CalendarBlock` persistence | M3 | survey_explorer_1, survey_explorer_3 |
| 11 | Task Rescheduling & Auto-Forwarding | Move/reschedule task controls and auto-forward uncompleted tasks to next day | M3 | survey_explorer_3 |
| 12 | Deep vs Shallow Work Tracking | Track deep/shallow work hours in calendar blocks and display summary in Night Review (`/review`) | M3 | survey_explorer_3 |
| 13 | Eisenhower Matrix to 90-day OKR Linking | Wire `/tasks` Q1-Q4 tasks directly to 90-day OKR Objectives & Key Results | M3 | survey_explorer_3 |
| 14 | Routines DB Persistence | Wire `/routines` checklist steps to `/api/routines` | M3 | survey_explorer_1, survey_explorer_3 |
| 15 | Live Health & Sleep Data Fetching | Replace hardcoded mock states in `/health` and `/sleep` with live `useEffect` fetching from API | M4 | survey_explorer_2, survey_explorer_3 |
| 16 | Gym Workout Logging System | Interactive form/modal in `/health` to log exercises, sets, reps, weights, RPE to Prisma | M4 | survey_explorer_2, survey_explorer_3 |
| 17 | Rolling 7-Day Nutrition Averages | Calculate rolling 7-day averages for calories, hydration, and protein in `/health` | M4 | survey_explorer_2, survey_explorer_3 |
| 18 | Sleep Efficiency & Energy Correlation | Dynamic correlation calculation between sleep efficiency and morning/daily energy levels | M4 | survey_explorer_2, survey_explorer_3 |
| 19 | Minimal White Re-theme for `/analytics` | Redesign `/analytics` from dark slate (`bg-slate-900`) to pure white `#ffffff` with high-contrast cards | M5 | survey_explorer_1, survey_explorer_3 |
| 20 | Recharts 90-day Visual Progress | 4 interactive Recharts charts on `/analytics` (Finance, Habits, Sleep-Energy, OKR Burnup) | M5 | survey_explorer_3 |
| 21 | Proactive Target Deviation Warnings | Alert UI on `/analytics` and Header bell modal for deviation from 90-day targets | M5 | survey_explorer_3 |
| 22 | Contrast Bugs & Theme Cleanup | Fix invisible icons on black buttons in `/health`, `/settings`, `/planner`, and remove `className="dark"` | M5 | survey_explorer_1, survey_explorer_3 |
| 23 | Route Aliasing | Add redirects `/calendar` -> `/planner` and `/inventory` -> `/finance` | M5 | survey_explorer_1 |
| 24 | Full Acceptance & Port 3050 Verification | 100% test pass, zero TypeScript errors (`tsc --noEmit`), all 17 routes HTTP 200 OK | M6 | survey_explorer_1, survey_explorer_2, survey_explorer_3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | DB Schema & 3-Month Simulation Seeding | Prisma schema update, `prisma db push`, rich 90-day seed simulation | none | PLANNED |
| M2 | R1 Financial, Register & Inventory Integration | Products API, cash register per cost center, sales invoice linking, reorder alerts, gross profit | M1 | PLANNED |
| M3 | R2 Calendar, Time-blocking & Deep Work | Calendar persistence, task auto-forward, deep/shallow work in review, Eisenhower-OKR link | M1 | PLANNED |
| M4 | R3 Health, Workout Logging & Biometrics | Live health data, gym workout sets/reps/weights logging, weekly averages, sleep correlation | M1 | PLANNED |
| M5 | R4 Analytics & R5 Minimal Design Polish | Recharts analytics, deviation warnings, pure white theme, contrast fixes, route aliases | M2, M3, M4 | PLANNED |
| M6 | Final Verification & Audit Acceptance | 100% E2E test suite pass, zero TypeScript errors, 17 routes 200 OK, Forensic Audit clean | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts

### M1 ↔ M2 (Financial Models)
- `ShopCashRegister`: `{ id, date, costCenterId, openingCash, salesCash, posSalesCash, physicalSalesCash, expensesCash, withdrawalsCash, expectedClosingCash, actualClosingCash, difference, reconciled, notes }`
- `CostCenter`: `{ id, name, code: "BUF" | "COS" | "RYSH" | "PER" | "HLT" | "UNI" }`
- `Invoice`: `{ id, invoiceNumber, date, costCenterId, totalAmount, grossProfit, items: InvoiceItem[] }`

### M1 ↔ M3 (Calendar & Tasks)
- `CalendarBlock`: `{ id, title, startTime, endTime, date, blockType: "DEEP_WORK" | "SHALLOW_WORK" | "ADMIN" | "HEALTH", taskId? }`
- `Task`: `{ id, title, completed, priority, quadrant: "Q1" | "Q2" | "Q3" | "Q4", objectiveId?, dueDate }`

### M1 ↔ M4 (Health & Workouts)
- `Workout`: `{ id, date, title, durationMinutes, totalVolume, notes, exercises: WorkoutExercise[] }`
- `WorkoutExercise`: `{ id, workoutId, name, sets, reps, weight, rpe }`
- `NutritionLog`: `{ id, date, calories, protein, carbs, fat, waterMl }`

## Code Layout
- `src/app/` — All Next.js 14 App Router routes and pages
- `src/app/api/` — Backend Route Handlers (`finance/*`, `health/*`, `sleep/*`, `tasks/*`, `planner/*`, etc.)
- `src/components/` — Shared UI components (`layout/*`, `dashboard/*`, `finance/*`, `charts/*`)
- `src/lib/` — Prisma singleton (`prisma.ts`), calculation utilities (`utils.ts`)
- `prisma/` — Schema (`schema.prisma`) and SQLite database (`dev.db`)
- `scripts/` — Seeding (`seed.mjs`, `simulate-90-days-lifecycle.mjs`) and tests (`test-core.mjs`, `test-e2e.mjs`)
