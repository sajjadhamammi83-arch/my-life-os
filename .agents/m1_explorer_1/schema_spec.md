# Technical Specification: Milestone 1 Database Schema & Migration Guide

**Document Version:** 1.0.0  
**Author:** m1_explorer_1 (Teamwork Explorer)  
**Target File:** `d:/my life/prisma/schema.prisma`  
**Target Database:** SQLite (`d:/my life/prisma/dev.db`)  
**Scope:** Milestone 1 (M1) — ShopCashRegister Multi-Center separation, Workout & WorkoutExercise models, and Safe Migration Strategy.

---

## 1. Executive Summary & Problem Analysis

In the current Life OS schema (`prisma/schema.prisma`), two key architectural gaps restrict the multi-center business and fitness logging requirements defined in `PROJECT.md`:

1. **`ShopCashRegister` Single-Tenant Limitation**:
   - `date DateTime @unique` enforces a global 1-record-per-day restriction.
   - The user operates multiple commercial centers: **Gym Buffet** (`code: BUF`) and **Cosmetics Shop** (`code: COS`). Currently, daily revenue from both centers is forcibly aggregated into a single cash register row, losing center-specific accountability.
   - Cash register sales lack field separation between electronic point-of-sale (`posSalesCash`) and physical cash in drawer (`physicalSalesCash`), making daily cash drawer reconciliation and discrepancy detection incomplete.
2. **`Workout` and `WorkoutExercise` Gym Logging Architecture**:
   - `Workout` exists in the schema (lines 404-415) along with `WorkoutExercise` (lines 417-429).
   - However, neither `Workout` nor `WorkoutExercise` is linked to `User` (orphaned model).
   - All required fields for progressive overload tracking (`sets`, `reps`, `weight`, `rpe`, `restSeconds`, `totalVolume`) need exact definition, calculation formulas, and validation for upcoming M4 health logging.
3. **Windows PowerShell Execution Policy Constraint**:
   - Running `npx prisma ...` or `npm run ...` directly in PowerShell fails on this host machine with `PSSecurityException` due to Windows script execution policies blocking `npx.ps1` and `npm.ps1`.
   - A safe, deterministic command path using Node direct binary execution (`node node_modules/prisma/build/index.js db push`) must be specified to prevent script hangs or execution failure.

---

## 2. Model Specification 1: `ShopCashRegister`

### 2.1 Context & Business Rules
- **Center Separation**: Daily registers must be separated per `CostCenter` (specifically `BUF` for Gym Buffet and `COS` for Cosmetics Shop).
- **Compound Uniqueness**: A given `CostCenter` can have at most one cash register per calendar date: `@@unique([date, costCenterId])`.
- **Payment Split**:
  - `posSalesCash`: Electronic POS / card-reader revenue settled to bank accounts.
  - `physicalSalesCash`: Physical cash bills and coins deposited into the cash drawer.
  - `salesCash`: Total daily sales revenue ($posSalesCash + physicalSalesCash$).
- **Reconciliation Formula**:
  $$\text{expectedClosingCash} = \text{openingCash} + \text{salesCash} - \text{expensesCash} - \text{withdrawalsCash}$$
  $$\text{difference} = \text{actualClosingCash} - \text{expectedClosingCash}$$
  $$\text{reconciled} = (\text{difference} == 0)$$

### 2.2 Exact Prisma Model Schema
Target location in `prisma/schema.prisma` (lines 797-811):

```prisma
model ShopCashRegister {
  id                  String      @id @default(cuid())
  date                DateTime
  costCenterId        String?
  costCenter          CostCenter? @relation(fields: [costCenterId], references: [id], onDelete: SetNull)
  openingCash         Float       @default(0) // موجودی آغاز روز (کف صندوق)
  salesCash           Float       @default(0) // کل فروش نقدی روزانه
  posSalesCash        Float       @default(0) // فروش کارتخوان / پوز
  physicalSalesCash   Float       @default(0) // فروش اسکناس نقد فیزیکی
  expensesCash        Float       @default(0) // هزینه‌های نقدی پرداختی از دخل
  withdrawalsCash     Float       @default(0) // برداشت‌های شخصی از دخل
  expectedClosingCash Float       @default(0) // موجودی انتظاری = آغاز + فروش - هزینه - برداشت
  actualClosingCash   Float       @default(0) // موجودی شمارش شده واقعی پایان روز
  difference          Float       @default(0) // کسری یا مازاد دخل (actual - expected)
  reconciled          Boolean     @default(true) // آیا دخل بالانس و بدون کسری است؟
  notes               String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@unique([date, costCenterId])
}
```

### 2.3 Required Bidirectional Relation in `CostCenter`
In `model CostCenter` (lines 468-483), add the reverse relation field `cashRegisters`:

```prisma
model CostCenter {
  id          String   @id @default(cuid())
  name        String   @unique // Personal, Lent, Shop, Rayesh, University, Health
  code        String   @unique
  description String?
  color       String   @default("#3b82f6")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  accounts      FinancialAccount[]
  transactions  Transaction[]
  products      Product[]
  invoices      Invoice[]
  purchases     Purchase[]
  budgets       BudgetLine[]
  cashRegisters ShopCashRegister[]
}
```

### 2.4 Field Comparison Table

| Field Name | Type | Modifiers / Attributes | Rationale / Purpose |
|------------|------|------------------------|---------------------|
| `id` | `String` | `@id @default(cuid())` | Unique surrogate primary key |
| `date` | `DateTime` | (No `@unique`) | Allows multiple centers to have registers on the same date |
| `costCenterId` | `String?` | Optional foreign key | References CostCenter (`BUF`, `COS`, etc.); nullable for backwards compatibility |
| `costCenter` | `CostCenter?` | `@relation(fields: [costCenterId], references: [id], onDelete: SetNull)` | Bidirectional foreign key relation with safe null on delete |
| `openingCash` | `Float` | `@default(0)` | Float amount in Iranian Tomans for starting cash |
| `salesCash` | `Float` | `@default(0)` | Aggregate gross sales recorded in register |
| `posSalesCash` | `Float` | `@default(0)` | **NEW**: Breakdown of POS / bank terminal receipts |
| `physicalSalesCash` | `Float` | `@default(0)` | **NEW**: Breakdown of paper banknotes inside the drawer |
| `expensesCash` | `Float` | `@default(0)` | Cash disbursed for daily petty expenses |
| `withdrawalsCash` | `Float` | `@default(0)` | Cash withdrawn by owner during the day |
| `expectedClosingCash` | `Float` | `@default(0)` | Calculated expected cash |
| `actualClosingCash` | `Float` | `@default(0)` | Physically counted closing cash |
| `difference` | `Float` | `@default(0)` | Over/Short discrepancy ($actual - expected$) |
| `reconciled` | `Boolean` | `@default(true)` | True if discrepancy is 0 or approved |
| `notes` | `String?` | Optional string | Persian audit log or notes |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Modification timestamp |
| `@@unique` | Index | `[date, costCenterId]` | **NEW**: Compound unique constraint allowing 1 register per center per date |

---

## 3. Model Specification 2: `Workout` and `WorkoutExercise`

### 3.1 Context & Business Rules
- **Gym Logging Requirement**: Gym workout tracking is essential for R3 (Health & Biometrics) and integrates with the Gym Buffet (`BUF`) cost center.
- **Normalization (3NF)**:
  - `Workout` represents a complete training session on a given date (e.g., "سینه و زیربغل", "پا و سرشانه").
  - `WorkoutExercise` represents each distinct movement performed during that workout session.
  - `User` represents the Life OS user. Linking `Workout` to `User` establishes multi-user readiness and complete data ownership.
- **Calculated Metric (`totalVolume`)**:
  - Training volume is a primary driver of hypertrophy and progressive overload.
  - Calculation:
    $$\text{Volume per Exercise} = \text{sets} \times \text{reps} \times \text{weight}$$
    $$\text{Workout.totalVolume} = \sum_{i=1}^{n} (\text{sets}_i \times \text{reps}_i \times \text{weight}_i)$$
  - For bodyweight movements with 0 kg external load (e.g. pullups), weight is 0 or added load (e.g. +15 kg).
- **RPE (Rate of Perceived Exertion)**:
  - Standard Borg/RTS 1–10 scale (e.g., 8.0 = 2 reps left in reserve). Stored as `Float` to support half-increments (e.g., 7.5, 8.5).

### 3.2 Exact Prisma Model Schema
Target location in `prisma/schema.prisma` (lines 404-429):

```prisma
model Workout {
  id              String            @id @default(cuid())
  userId          String?
  user            User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  date            DateTime
  title           String            // e.g. سینه و زیربغل، پا و سرشانه
  durationMinutes Int               @default(60)
  notes           String?
  totalVolume     Float             @default(0) // مجموع تناژ وزنه جابجا شده (kg)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  exercises       WorkoutExercise[]
}

model WorkoutExercise {
  id          String   @id @default(cuid())
  workoutId   String
  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  name        String   // نام حرکت e.g. پرس سینه دمبل، زیربغل سیم‌کش
  sets        Int      @default(3) // تعداد ست
  reps        Int      @default(10) // تعداد تکرار در هر ست
  weight      Float    @default(0) // وزن به کیلوگرم (kg)
  rpe         Float    @default(8) // شاخص فشار تمرین (1-10)
  restSeconds Int      @default(90) // زمان استراحت بین ست‌ها به ثانیه
  notes       String?  // نکات اجرایی حرکت، شیوه قرارگیری دست‌ها
  createdAt   DateTime @default(now())
}
```

### 3.3 Required Bidirectional Relation in `User`
In `model User` (lines 10-22), add the reverse relation field `workouts`:

```prisma
model User {
  id           String    @id @default(cuid())
  name         String    @default("کاربر سیستم‌عامل زندگی")
  email        String?   @unique
  avatar       String?
  currency     String    @default("تومان") // تومان یا ریال
  weightUnit   String    @default("kg")
  calorieUnit  String    @default("kcal")
  weekStartDay String    @default("saturday") // شنبه
  theme        String    @default("dark")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  workouts     Workout[]
}
```

### 3.4 Field Comparison Table: `Workout` & `WorkoutExercise`

| Model | Field | Type | Attributes | Description |
|-------|-------|------|------------|-------------|
| `Workout` | `id` | `String` | `@id @default(cuid())` | Unique workout identifier |
| `Workout` | `userId` | `String?` | Optional FK | **NEW**: Foreign key relation to `User` |
| `Workout` | `user` | `User?` | `@relation(fields: [userId], references: [id], onDelete: SetNull)` | **NEW**: Bidirectional link to User |
| `Workout` | `date` | `DateTime` | Required | Workout date and time |
| `Workout` | `title` | `String` | Required | Muscle group split title (e.g. "سینه و جلو بازو") |
| `Workout` | `durationMinutes` | `Int` | `@default(60)` | Session duration in minutes |
| `Workout` | `notes` | `String?` | Optional | Overall gym session notes |
| `Workout` | `totalVolume` | `Float` | `@default(0)` | Total kg moved across all exercises |
| `Workout` | `exercises` | `WorkoutExercise[]` | Relation | Child exercise records |
| `WorkoutExercise` | `id` | `String` | `@id @default(cuid())` | Unique exercise entry identifier |
| `WorkoutExercise` | `workoutId` | `String` | Required FK | Parent workout reference |
| `WorkoutExercise` | `workout` | `Workout` | `@relation(fields: [workoutId], references: [id], onDelete: Cascade)` | Cascades on session delete |
| `WorkoutExercise` | `name` | `String` | Required | Name of movement (e.g. "اسکوات هالتر") |
| `WorkoutExercise` | `sets` | `Int` | `@default(3)` | Number of sets performed |
| `WorkoutExercise` | `reps` | `Int` | `@default(10)` | Repetitions per set |
| `WorkoutExercise` | `weight` | `Float` | `@default(0)` | Weight used in kg |
| `WorkoutExercise` | `rpe` | `Float` | `@default(8)` | Borg RPE rating (1.0 to 10.0) |
| `WorkoutExercise` | `restSeconds` | `Int` | `@default(90)` | Inter-set rest in seconds |
| `WorkoutExercise` | `notes` | `String?` | Optional | Set performance or tempo notes |

---

## 4. Safe SQLite Schema Migration Strategy

### 4.1 Underlying Engine Analysis
- **Database Engine**: SQLite 3 file at `prisma/dev.db`.
- **Existing Rows**:
  - `ShopCashRegister`: 90 rows (simulated 3-month history).
  - `CostCenter`: 6 rows (`BUF`, `COS`, `RYSH`, `PER`, `HLT`, `UNI`).
  - `Workout` / `WorkoutExercise`: 0 rows currently.
- **Why Standard `prisma db push` is Safe for this Diff**:
  1. **No Columns Dropped**: All existing columns (`openingCash`, `salesCash`, `expensesCash`, etc.) remain untouched.
  2. **Nullable New Columns**: `costCenterId` and `userId` are optional (`String?`), allowing SQLite to populate existing rows with `NULL`.
  3. **Default Values on New Numeric Columns**: `posSalesCash` and `physicalSalesCash` have `@default(0)`, allowing SQLite to populate existing rows with `0`.
  4. **Compound Unique Index Compatibility**: The current 90 rows each possess a distinct calendar date. In SQLite, a compound unique index on `(date, costCenterId)` satisfies uniqueness for all existing `(date, NULL)` rows without violation.

### 4.2 Windows Execution Policy Safety Workaround
On this Windows machine, calling `npx prisma ...` or `npm run ...` in PowerShell triggers:
```
PSSecurityException: File C:\Program Files\nodejs\npx.ps1 cannot be loaded because running scripts is disabled on this system.
```
Additionally, calling `npx.cmd` directly can prompt `Terminate batch job (Y/N)?` and hang automation.

**Standardized Safe Invocation Method:**
Use direct Node binary execution of Prisma CLI bundled in `node_modules/prisma`:
```powershell
node node_modules/prisma/build/index.js <command>
```
This is 100% immune to PowerShell execution policies and batch wrapper hangs.

### 4.3 Step-by-Step Migration Command Sequence

Execute the following steps in order:

#### Step 1: Pre-Migration Database Backup
Creates an instant snapshot so that any unforeseen table lock or schema issue can be rolled back in under 1 second:
```powershell
Copy-Item "d:/my life/prisma/dev.db" "d:/my life/prisma/dev.db.pre_m1_backup"
```

#### Step 2: Validate Prisma Schema Syntax
Validates schema AST without connecting to the database or modifying any files:
```powershell
node node_modules/prisma/build/index.js validate
```
*Expected Output:* `The schema at prisma\schema.prisma is valid 🚀`

#### Step 3: Push Schema to SQLite Database
Applies table alterations to `prisma/dev.db`:
```powershell
node node_modules/prisma/build/index.js db push
```
*Note*: No `--accept-data-loss` flag is required because no columns or tables are deleted.

#### Step 4: Re-generate Prisma Client Typings
Updates TypeScript definitions in `node_modules/@prisma/client`:
```powershell
node node_modules/prisma/build/index.js generate
```
*Expected Output:* `✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in ...ms`

#### Step 5: Post-Migration Data Integrity Verification
Run verification script to ensure row counts, new columns, and TypeScript compilation are completely healthy:
```powershell
# 1. Check ShopCashRegister count and schema
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function verify() { const count = await prisma.shopCashRegister.count(); const sample = await prisma.shopCashRegister.findFirst(); console.log('Count:', count, 'Sample fields:', Object.keys(sample)); if (count !== 90) throw new Error('Data count mismatch!'); } verify().finally(() => prisma.`$disconnect());"

# 2. TypeScript compilation check (must return Exit code 0)
node node_modules/typescript/bin/tsc --noEmit

# 3. Core calculation tests
node scripts/test-core.mjs
```

---

## 5. Downstream Impact Analysis & Implementation Notes

### 5.1 Downstream Milestones
1. **Milestone 1 Seed Simulation Update (`scripts/seed.mjs` & `simulate-90-days-lifecycle.mjs`)**:
   - `seed.mjs` should seed separate `ShopCashRegister` entries for:
     - `CostCenter` = `BUF` (بوفه باشگاه)
     - `CostCenter` = `COS` (لوازم آرایشی)
   - `simulate-90-days-lifecycle.mjs` line 160: Replace `where: { date: currentDate }` with:
     ```javascript
     where: {
       date_costCenterId: {
         date: currentDate,
         costCenterId: buffetCostCenter.id
       }
     }
     ```
   - Seed `Workout` and `WorkoutExercise` sessions for 90 days (approx. 4 sessions per week = ~52 workouts with 4-5 exercises each).
2. **Milestone 2 Finance Module (`src/app/api/finance/cash-register/route.ts` & `src/app/finance/page.tsx`)**:
   - Update POST handler to accept `costCenterId`, `posSalesCash`, `physicalSalesCash`.
   - Add query parameter `?costCenterId=...` to filter registers by center.
   - Update UI cash register form to support switching between "بوفه باشگاه" and "لوازم آرایشی".
3. **Milestone 4 Health Module (`src/app/health/page.tsx` & `/api/health/workouts`)**:
   - Create interactive workout logging modal to submit sets, reps, weight, RPE.
   - Calculate total volume dynamically and persist to `Workout` and `WorkoutExercise`.

---

## 6. Verification Checklist for Implementer

- [ ] `prisma/schema.prisma` contains `cashRegisters ShopCashRegister[]` in `CostCenter`.
- [ ] `prisma/schema.prisma` contains `workouts Workout[]` in `User`.
- [ ] `prisma/schema.prisma` contains `userId`, `user`, and `totalVolume` in `Workout`.
- [ ] `prisma/schema.prisma` contains `costCenterId`, `costCenter`, `posSalesCash`, `physicalSalesCash`, and `@@unique([date, costCenterId])` in `ShopCashRegister`.
- [ ] `node node_modules/prisma/build/index.js validate` exits with code 0.
- [ ] `node node_modules/prisma/build/index.js db push` exits with code 0.
- [ ] `node node_modules/prisma/build/index.js generate` exits with code 0.
- [ ] Existing 90 records in `ShopCashRegister` are fully preserved.
- [ ] `node node_modules/typescript/bin/tsc --noEmit` exits with code 0.
- [ ] `node scripts/test-core.mjs` passes all tests.
