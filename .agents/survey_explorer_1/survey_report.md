# Life OS — Comprehensive Architecture, Server, Port 3050, Routes, Design & TypeScript Survey Report

**Author**: survey_explorer_1 (teamwork_preview_explorer)  
**Date**: 2026-09-03  
**Working Directory**: `d:/my life/.agents/survey_explorer_1/`  
**Project Root**: `d:/my life`  
**Original Request File**: `d:/my life/.agents/ORIGINAL_REQUEST.md`  

---

## 1. Executive Summary

A comprehensive, non-destructive survey was conducted across the **Life OS** platform. The system is a modern, full-stack personal operations and financial accounting platform built with **Next.js 14 (App Router)**, **React 18**, **TypeScript 5.6**, **Tailwind CSS 3.4**, and **Prisma ORM 5.22** with an embedded **SQLite** database (`dev.db`).

### Key Assessment Highlights:
1. **Port 3050 vs. Port 3000 Isolation (Verified & Fully Compliant)**:
   - Port 3000 is currently occupied by the user's external cafe platform server (`"D:\cafe-platform\frontend\node_modules\.bin\..\vite\bin\vite.js" --host 0.0.0.0 --port 3000`, PID 20016).
   - The Life OS dev server is actively running on **Port 3050** (`PID 19888`) as instructed. All scripts strictly enforce `-p 3050`. Port 3000 is completely untouched.
2. **TypeScript & Static Typing Health**:
   - Running `node node_modules/typescript/bin/tsc --noEmit` passes with **Exit Code 0** (0 type errors, 0 warnings).
3. **Core Mathematical & Accounting Logic**:
   - `node scripts/test-core.mjs` passes **100%** across all 7 verification suites (Sleep Efficiency, Balance Sheet equation, P&L calculations, Shop Cash Register balancing, Inventory movement on sales/purchases, OKR progress, and Account transfer neutrality).
4. **Complete Route Health (20 Routes Surveyed)**:
   - All **20 system routes** in `src/app/` respond with **HTTP 200 OK** (with `/` cleanly responding with **HTTP 307 Redirect** to `/dashboard`).
   - Gaps identified: `/calendar` and `/inventory` return **404 Not Found** (calendar functionality lives at `/planner`, and inventory management lives under `/finance`).
5. **Data Persistence Gaps**:
   - While routes `/dashboard`, `/finance`, `/goals`, `/projects`, `/review`, `/sleep`, `/learning`, `/knowledge`, and `/automation` persist directly to Prisma database models via dedicated `/api/*` endpoints, **`/planner`** and **`/routines`** currently store edits only in ephemeral React local state—despite full CRUD endpoints already existing at `/api/planner` and `/api/routines`!
6. **Design & Styling System**:
   - Standard font is **Vazirmatn** (Google Fonts loaded with weights 200–900; configured in `tailwind.config.ts` and `globals.css`).
   - Most pages adhere to the clean minimal white `#ffffff` background with high-contrast borders and buttons (`bg-black text-white`, `border-zinc-200`).
   - Visual violation detected: `src/app/layout.tsx` injects `className="dark"` on `<html>`, and `src/app/analytics/page.tsx` was implemented with dark slate backgrounds (`bg-slate-900 border-slate-800`), conflicting with Requirement R5 (clean white `#ffffff` aesthetic).

---

## 2. Technology Stack & Architecture Deep Dive

| Layer | Technology | Version | Purpose / Scope in Life OS |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `14.2.16` | Full-stack server and client rendering, file-based routing in `src/app/` |
| **Frontend UI** | React / React-DOM | `18.3.1` | Component lifecycle, client-side hooks, state management |
| **Language** | TypeScript | `5.6.3` | Type definitions, static typing, interfaces |
| **Database & ORM** | Prisma + SQLite | `5.22.0` | ORM schema (`prisma/schema.prisma`), database file (`prisma/dev.db`, 696 KB) |
| **Styling** | Tailwind CSS | `3.4.14` | Utility classes, typography, dark/light theme definitions |
| **CSS Preprocessing**| PostCSS + Autoprefixer | `8.4.47` / `10.4.20`| Cross-browser CSS transformations |
| **Icons** | Lucide React | `0.454.0` | Monochrome functional icons |
| **Data Viz** | Recharts | `2.13.3` | Charts and analytics visual progress bars |
| **Class Utilities** | `clsx` + `tailwind-merge`| `2.1.1` / `2.5.4` | Dynamic, conflict-free class name composition (`cn()`) |

### Server Entry Point & Process Architecture
- **Next.js Dev Server**: `node_modules/next/dist/server/lib/start-server.js`
- **Current Running Dev Process**: Process ID `19888` on `0.0.0.0:3050` (Next.js v14.2.16).
- **Client Root Layout**: `src/app/layout.tsx` wraps all pages inside `AppLayout` (`src/components/layout/AppLayout.tsx`), which mounts `Sidebar.tsx`, `Header.tsx`, and `QuickCaptureModal.tsx`.

### `package.json` Scripts Analysis

| Script Name | Command | Purpose | Evaluation / Notes |
|---|---|---|---|
| `"dev"` | `next dev -p 3050` | Start Next.js development server on port 3050 | **Compliant**: Explicitly hardcoded to `-p 3050` to prevent collision with port 3000. |
| `"build"` | `next build` | Next.js production build | Standard Next build step. |
| `"start"` | `next start -p 3050` | Start production server on port 3050 | **Compliant**: Explicitly hardcoded to `-p 3050`. |
| `"lint"` | `next lint` | Run Next.js ESLint checks | Lints Next.js codebase. |
| `"prisma:generate"` | `prisma generate` | Generate Prisma client code | Outputs to `@prisma/client`. |
| `"prisma:push"` | `prisma db push` | Push schema changes directly to SQLite | Syncs schema with `prisma/dev.db`. |
| `"prisma:seed"` | `node scripts/seed.mjs` | Execute 90-day simulation database seed | Populates over 45 entities with rich simulated history. |
| `"test"` | `node scripts/test-core.mjs` | Verify core mathematical and business formulas | Verifies 7 accounting, sleep, and OKR formula suites. |
| *(Missing)* | `tsc --noEmit` | Explicit `typecheck` script | **Recommendation**: Add `"typecheck": "tsc --noEmit"` to `package.json`. |

---

## 3. Port Configuration & Port 3000 Isolation

### Empirical Active Process Verification
Running diagnostic commands (`netstat -ano` and `Get-CimInstance Win32_Process`) produced the following conclusive state:

```text
Active Ports:
  TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    PID 20016
  TCP    0.0.0.0:3050    0.0.0.0:0    LISTENING    PID 19888
```

```text
Process Details:
  PID 20016: "node" "D:\cafe-platform\frontend\node_modules\.bin\..\vite\bin\vite.js" --host 0.0.0.0 --port 3000
  PID 19888: "C:\Program Files\nodejs\node.exe" "D:\my life\node_modules\next\dist\server\lib\start-server.js"
```

### Strict Isolation Rules:
1. **Never Touch Port 3000**: Process 20016 belongs to the user's cafe platform (`D:\cafe-platform\frontend`). Under **NO** circumstances should any script, command, or agent execute `kill`, `taskkill`, or bind to port 3000.
2. **Explicit Port Specification**: Because Next.js defaults to port 3000 when no port flag is provided, every invocation must explicitly include `-p 3050` (e.g. `next dev -p 3050` or `npm run dev`).
3. **Environment Guard**: When executing custom Node.js scripts that query the local server, explicitly set `PORT=3050` or fetch from `http://localhost:3050`.

---

## 4. Complete Enumeration of All 17 System Routes & Auxiliary Pages

Every route was tested live via HTTP `GET` against the running server on `http://localhost:3050`. The 17 primary system modules plus auxiliary routes are cataloged below:

| # | Route Path | Source File Path | HTTP Status | Functional Domain | Render Status | Persistence & Interactive State |
|---|---|---|---|---|---|---|
| 1 | `/dashboard` | `src/app/dashboard/page.tsx` | **200 OK** | مرکز فرماندهی (Command Center) | **Fully Rendering** | Reads live Prisma data (`cycle90Day`, `task`, `area`, `project`, `financialAccount`, `product`, `sleepLog`, `shopCashRegister`). |
| 2 | `/today` | `src/app/today/page.tsx` | **200 OK** | اجرای روزانه و Big 3 (Daily Execution) | **Fully Rendering** | Connects to `/api/tasks` and `/api/habits`. Task creation, habit toggling, and hydration live logging. |
| 3 | `/inbox` | `src/app/inbox/page.tsx` | **200 OK** | اینباکس و ثبت سریع (GTD Inbox) | **Fully Rendering** | Connects to `/api/tasks`. Full capture and triage to Today/Backlog. |
| 4 | `/goals` | `src/app/goals/page.tsx` | **200 OK** | اهداف و استراتژی ۹۰ روزه (OKRs) | **Fully Rendering** | Connects to `/api/goals` and `/api/areas`. Create/edit objectives, update Key Results progress. |
| 5 | `/planner` | `src/app/planner/page.tsx` | **200 OK** | برنامه‌ریزی و تقویم (Time-Blocking) | **Fully Rendering** | **Ephemeral State Gap**: Time-blocks are saved in local React state (`useState`). Edits are lost on refresh despite `/api/planner` being ready! |
| 6 | `/projects` | `src/app/projects/page.tsx` | **200 OK** | پروژه‌ها و کانبان (Kanban Board) | **Fully Rendering** | Connects to `/api/projects` and `/api/tasks`. Kanban WIP limits, task movement across columns, milestone creation. |
| 7 | `/health` | `src/app/health/page.tsx` | **200 OK** | سلامت، تغذیه و بیومتریک (Bio-Opt) | **Fully Rendering** | Connects to `/api/health` for weight and meals. **Partial Gap**: Gym workout exercises and sets are hardcoded strings; no form to log sets/weights. |
| 8 | `/finance` | `src/app/finance/page.tsx` | **200 OK** | مالی، حسابداری، صندوق و انبار | **Fully Rendering** | Connects to `/api/finance/*`. Full sales registration with inventory deduction, cash register balancing, transactions. |
| 9 | `/review` | `src/app/review/page.tsx` | **200 OK** | بازبینی و ارزیابی شبانه (Reviews) | **Fully Rendering** | Connects to `/api/reviews`. Saves daily reviews, energy scores, and reflections to Prisma. |
| 10 | `/learning` | `src/app/learning/page.tsx` | **200 OK** | یادگیری، دانشگاه و کتب (Learning) | **Fully Rendering** | Connects to `/api/learning`. University courses, assignments, exams, and book reading tracker. |
| 11 | `/habits` | `src/app/habits/page.tsx` | **200 OK** | عادت‌ها و روتین‌ها (Habit Tracker) | **Fully Rendering** | Connects to `/api/habits`. Streaks, daily check-ins, and target management. |
| 12 | `/sleep` | `src/app/sleep/page.tsx` | **200 OK** | دفترچه خواب و راندمان زیستی | **Fully Rendering** | Connects to `/api/sleep`. Automated sleep efficiency calculation (`calculateSleepEfficiency`). |
| 13 | `/knowledge` | `src/app/knowledge/page.tsx` | **200 OK** | پایگاه دانش، SOP و تصمیمات | **Fully Rendering** | Connects to `/api/knowledge`. SOP documentation, decision logs, notes by domain. |
| 14 | `/analytics` | `src/app/analytics/page.tsx` | **200 OK** | گزارش‌ها و تحلیل چندبعدی | **Fully Rendering** | **Design Inconsistency**: Hardcoded correlation metrics and uses dark slate styling (`bg-slate-900`) instead of minimal pure white. |
| 15 | `/automation`| `src/app/automation/page.tsx`| **200 OK** | موتور خودکارسازی (Automation Engine)| **Fully Rendering** | Connects to `/api/automation`. If-This-Then-That rule engine with active toggles and creation. |
| 16 | `/settings` | `src/app/settings/page.tsx` | **200 OK** | تنظیمات سامانه و پشتیبان‌گیری | **Fully Rendering** | Connects to `/api/settings` and `/api/settings/backup`. Configures currency, units, user profile. |
| 17 | `/areas` | `src/app/areas/page.tsx` | **200 OK** | حوزه‌های مسئولیت (Life Areas) | **Fully Rendering** | Connects to `/api/areas`. Full CRUD on life and business domains (بوفه باشگاه, فروشگاه آرایشی, شرکت رایش, سلامت, دانشگاه). |

### Auxiliary & Aliased Routes Analysis

| Route Path | Source File | HTTP Status | Notes / Findings |
|---|---|---|---|
| `/` | `src/app/page.tsx` | **307 Redirect** | Uses Next.js `redirect("/dashboard")`. Seamlessly redirects users to `/dashboard` (200 OK). |
| `/routines` | `src/app/routines/page.tsx` | **200 OK** | Morning/night routine checklist. **Ephemeral State Gap**: Uses local React state; does not invoke `/api/routines`. |
| `/tasks` | `src/app/tasks/page.tsx` | **200 OK** | Eisenhower Matrix 4-quadrant view. Fully wired to `/api/tasks`. |
| `/calendar` | *(None)* | **404 Not Found** | Calendar time-blocking is provided by `/planner`. A route alias or redirect `/calendar` -> `/planner` is advisable. |
| `/inventory`| *(None)* | **404 Not Found** | Inventory management is built directly inside `/finance`. A route alias or redirect `/inventory` -> `/finance` is advisable. |

---

## 5. Design & Styling System Survey

### 1. Typography & Font Setup (Vazirmatn)
- **Import Method**: `@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@200;300;400;500;600;700;800;900&display=swap');` in `src/app/globals.css` (line 1).
- **CSS Variable**: `--font-vazirmatn: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;` defined in `:root`.
- **Tailwind Extension**: `tailwind.config.ts` extends `fontFamily.sans`:
  ```ts
  fontFamily: {
    sans: ["var(--font-vazirmatn)", "Vazirmatn", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
  }
  ```
- **Body Styling**: `body` tag in `globals.css` declares:
  ```css
  body {
    font-family: var(--font-vazirmatn);
    direction: rtl;
    text-align: right;
    background-color: #ffffff;
    color: #09090b;
  }
  ```
- **Persian Digits Utility**: `toPersianDigits()` in `src/lib/utils.ts` converts standard numbers to Persian digits (`۰-۹`) cleanly across cards, tables, and badges.

### 2. Clean Minimal Aesthetic Adherence (White `#ffffff` + High Contrast)
- **App Layout & Frame**:
  - `AppLayout.tsx`: Outer container is `bg-white text-zinc-900`.
  - `Header.tsx`: Sticky header uses `bg-white/90 border-b border-zinc-200 backdrop-blur-md`. Buttons use `bg-black text-white hover:bg-zinc-800` (crisp high contrast).
  - `Sidebar.tsx`: Uses `bg-white border-l border-zinc-200`. Active nav items render with `bg-black text-white font-bold shadow-sm`.
- **Card Surfaces**:
  - Most pages utilize clean white surfaces with zinc borders (`bg-white border border-zinc-200 shadow-sm`).
- **Discrepancies & Violations**:
  - `src/app/layout.tsx` (line 16): `<html lang="fa" dir="rtl" className="dark">` forces the Tailwind `dark` selector onto the entire document, causing unintended behavior in components with `dark:` variants.
  - `src/app/analytics/page.tsx`: Entire page is rendered with dark slate components (`bg-slate-900 border-slate-800 text-white`, `bg-slate-800`), directly violating Requirement R5 ("حفظ دقیق تم مینیمال سفید و مشکی زمینه سفید تمیز `#ffffff`").

---

## 6. TypeScript Configuration & Codebase Diagnostics

### 1. `tsconfig.json` Configuration Review
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
- Strict mode is enabled (`"strict": true`).
- Path alias `@/*` correctly maps to `./src/*`.
- Module resolution is set to modern Next.js `bundler`.

### 2. Static Type Check Command Execution
- Command: `node node_modules/typescript/bin/tsc --noEmit`
- Exit Code: **0**
- Diagnostics: **0 Errors, 0 Warnings**. TypeScript type check passes with 100% clean AST.

### 3. Core Logic & Formula Test Suite
- Command: `node scripts/test-core.mjs`
- Exit Code: **0**
- Verification Results:
  - `✓ Sleep Efficiency formula verified`
  - `✓ Balance Sheet Equation (Assets = Liabilities + Equity) verified`
  - `✓ Profit & Loss (P&L) engine verified`
  - `✓ Shop Cash Register balancing & difference detection verified`
  - `✓ Inventory movements (Sales reduction & Purchases addition) verified`
  - `✓ OKR / Key Result progress calculation verified`
  - `✓ Account transfer neutrality in cash flow verified`

---

## 7. Strategic Recommendations for Implementation Agents

1. **Port 3050 Preservation**:
   - Continue running solely on port 3050. Never run port-cleanup tools that kill port 3000.
2. **Persistence Wiring on Ephemeral Routes**:
   - Connect `src/app/planner/page.tsx` to `GET`, `POST`, and `DELETE` at `/api/planner` so time blocks persist across reloads.
   - Connect `src/app/routines/page.tsx` to `/api/routines` for morning/night routine steps.
3. **Route Aliasing**:
   - Add route redirect or rewrites in `next.config.mjs` (or page redirects) for `/calendar` -> `/planner` and `/inventory` -> `/finance`.
4. **Design Cleanup (R5 Compliance)**:
   - Refactor `src/app/analytics/page.tsx` from dark slate (`bg-slate-900`) to pure white cards (`bg-white border-zinc-200 text-zinc-950`).
   - Remove `className="dark"` from `src/app/layout.tsx` to prevent theme conflicts.
5. **Gym Workout Logging**:
   - Expand `src/app/health/page.tsx` to include an interactive form to log workout exercises (exercise name, sets, reps, weight in kg) saved to Prisma `Workout` and `WorkoutExercise` models.
