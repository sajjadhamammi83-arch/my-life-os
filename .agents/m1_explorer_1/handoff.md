# Milestone 1 Schema Specification Handoff Report

**Agent:** m1_explorer_1 (teamwork_preview_explorer)  
**Parent:** e4c495e6-a5c4-4f50-b631-c190920d77f0  
**Target Specification:** `d:/my life/.agents/m1_explorer_1/schema_spec.md`  
**Working Directory:** `d:/my life/.agents/m1_explorer_1/`

---

## 1. Observation

1. **Current `ShopCashRegister` Definition**:
   - In `d:/my life/prisma/schema.prisma` lines 797–811:
     ```prisma
     model ShopCashRegister {
       id                   String   @id @default(cuid())
       date                 DateTime @unique
       openingCash          Float    @default(0) // موجودی آغاز روز
       salesCash            Float    @default(0) // فروش‌های نقدی
       expensesCash         Float    @default(0) // هزینه‌های نقدی از دخل
       withdrawalsCash      Float    @default(0) // برداشت‌های شخصی
       expectedClosingCash  Float    @default(0) // موجودی انتظاری = آغاز + فروش - هزینه - برداشت
       actualClosingCash    Float    @default(0) // موجودی شمارش شده واقعی
       difference           Float    @default(0) // کسری یا مازاد دخل
       reconciled           Boolean  @default(true)
       notes                String?
       createdAt            DateTime @default(now())
       updatedAt            DateTime @updatedAt
     }
     ```
   - Current database row count: `prisma.shopCashRegister.count()` returned exactly 90 records in `prisma/dev.db`.
   - Current cost centers in `prisma/dev.db`:
     - `BUF`: `بوفه باشگاه` (ID: `cmtkm7r77000a5f57369fpetp`)
     - `COS`: `لوازم آرایشی` (ID: `cmtkm7raw000b5f5752vut170`)
     - `RYSH`: `شرکت رایش`
     - `PER`: `شخصی`
     - `HLT`: `سلامت`
     - `UNI`: `دانشگاه`

2. **Current `Workout` and `WorkoutExercise` Definition**:
   - In `d:/my life/prisma/schema.prisma` lines 404–429:
     ```prisma
     model Workout {
       id              String            @id @default(cuid())
       date            DateTime
       title           String            // e.g. سینه و زیربغل، پا و سرشانه
       durationMinutes Int               @default(60)
       notes           String?
       totalVolume     Float             @default(0)
       createdAt       DateTime          @default(now())
       updatedAt       DateTime          @updatedAt

       exercises       WorkoutExercise[]
     }

     model WorkoutExercise {
       id          String   @id @default(cuid())
       workoutId   String
       workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
       name        String   // نام حرکت
       sets        Int      @default(3)
       reps        Int      @default(10)
       weight      Float    @default(0) // kg
       rpe         Float    @default(8) // 1-10
       restSeconds Int      @default(90)
       notes       String?
       createdAt   DateTime @default(now())
     }
     ```
   - Current database row count: `prisma.workout.count()` = 0, `prisma.workoutExercise.count()` = 0.
   - `model User` (lines 10–22) does not contain a relation to `Workout`. Neither does `Workout` contain a relation to `User`.

3. **PowerShell Script Execution Policy on Host System**:
   - Running `npx prisma validate` returned verbatim error:
     ```
     npx : File C:\Program Files\nodejs\npx.ps1 cannot be loaded because running scripts is disabled on this system. For more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170.
     ```
   - Running `node node_modules/prisma/build/index.js validate` exited with code 0:
     ```
     Environment variables loaded from .env
     Prisma schema loaded from prisma\schema.prisma
     The schema at prisma\schema.prisma is valid 🚀
     ```
   - Running `node node_modules/typescript/bin/tsc --noEmit` exited with code 0.
   - Running `node scripts/test-core.mjs` exited with code 0 (All 7 core test groups passed).

4. **Upsert Dependency in Lifecycle Simulation**:
   - In `d:/my life/scripts/simulate-90-days-lifecycle.mjs` line 160:
     `await prisma.shopCashRegister.upsert({ where: { date: currentDate }, ... })`
     Currently queries `where: { date: currentDate }`. Changing to `@@unique([date, costCenterId])` changes the Prisma Client unique input to `where: { date_costCenterId: { date: ..., costCenterId: ... } }`.

---

## 2. Logic Chain

1. **Step 1 (Cash Register Multi-Center Isolation)**:
   - Based on Observation 1, `ShopCashRegister` has `@unique` on `date`.
   - Because both `BUF` (Gym Buffet) and `COS` (Cosmetics Shop) have physical cash registers daily, they cannot both store records on the same calendar day under the current schema.
   - Removing `@unique` from `date`, adding `costCenterId String?` with relation to `CostCenter`, and adding `@@unique([date, costCenterId])` allows independent daily reconciliation for each cost center.
   - Adding `posSalesCash Float @default(0)` and `physicalSalesCash Float @default(0)` preserves aggregate `salesCash` while providing exact audit breakdown between card terminal settlements and drawer banknotes.

2. **Step 2 (Workout & User Integration)**:
   - Based on Observation 2, `Workout` and `WorkoutExercise` models already contain all needed attributes for gym tracking (`sets`, `reps`, `weight`, `rpe`, `restSeconds`, `totalVolume`), but lack ownership by `User`.
   - Adding `userId String?` and `user User? @relation(fields: [userId], references: [id], onDelete: SetNull)` to `Workout`, and `workouts Workout[]` to `User`, establishes ownership without breaking existing queries (due to optional `String?`).
   - Cascade delete on `WorkoutExercise` (`workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)`) correctly handles session deletion.

3. **Step 3 (Safe SQLite Migration & Zero Data Loss)**:
   - Based on Observation 1 and 3, `prisma/dev.db` contains 90 existing records that must not be corrupted or lost.
   - Since no columns are deleted, and new columns either have defaults (`@default(0)`) or are nullable (`String?`), SQLite schema push will cleanly alter the table.
   - The unique constraint transition from `date` to `[date, costCenterId]` is valid for all existing records because each existing record has a distinct `date`.
   - Direct execution via `node node_modules/prisma/build/index.js db push` completely bypasses the PowerShell `PSSecurityException` observed in Observation 3.

---

## 3. Caveats

1. **Downstream Script Compatibility**:
   - `scripts/simulate-90-days-lifecycle.mjs` (line 160) uses `where: { date: currentDate }`. Once the compound index is applied and Prisma Client regenerated, this line must be updated to `where: { date_costCenterId: { date: currentDate, costCenterId: ... } }` or the simulation script will fail TypeScript compilation.
2. **Nullable `costCenterId` in SQLite Index**:
   - In SQLite, standard SQL treats multiple `NULL` values in a unique index as distinct. While existing 90 records with `costCenterId = NULL` will not collide with each other, future inserts should always provide a non-null `costCenterId` (e.g. `BUF` or `COS`) to ensure rigorous compound uniqueness.

---

## 4. Conclusion

The technical specification is finalized and recorded in `d:/my life/.agents/m1_explorer_1/schema_spec.md`. The exact schema modifications required in `prisma/schema.prisma` are:
1. In `ShopCashRegister`:
   - Replace `date DateTime @unique` with `date DateTime`.
   - Add `costCenterId String?`.
   - Add `costCenter CostCenter? @relation(fields: [costCenterId], references: [id], onDelete: SetNull)`.
   - Add `posSalesCash Float @default(0)`.
   - Add `physicalSalesCash Float @default(0)`.
   - Add `@@unique([date, costCenterId])`.
2. In `CostCenter`:
   - Add `cashRegisters ShopCashRegister[]`.
3. In `Workout`:
   - Add `userId String?`.
   - Add `user User? @relation(fields: [userId], references: [id], onDelete: SetNull)`.
4. In `User`:
   - Add `workouts Workout[]`.
5. Migration Commands:
   - Backup: `Copy-Item "d:/my life/prisma/dev.db" "d:/my life/prisma/dev.db.bak"`
   - Push: `node node_modules/prisma/build/index.js db push`
   - Generate: `node node_modules/prisma/build/index.js generate`

---

## 5. Verification Method

To independently verify this specification:
1. Inspect `d:/my life/.agents/m1_explorer_1/schema_spec.md`.
2. Run Prisma Schema Validation:
   ```powershell
   node node_modules/prisma/build/index.js validate
   ```
3. Run TypeScript Type Check:
   ```powershell
   node node_modules/typescript/bin/tsc --noEmit
   ```
4. Run Existing Test Suite:
   ```powershell
   node scripts/test-core.mjs
   ```
5. Invalidation Condition: If `node node_modules/prisma/build/index.js validate` returns any syntax or relation error, the specification must be amended.
