## 2026-09-03T18:21:00Z
You are m1_worker_2 (teamwork_preview_worker), replacing m1_worker.
Your working directory is: d:/my life/.agents/m1_worker_2/
Project root is: d:/my life

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

PORT ISOLATION WARNING:
Strictly preserve Port 3050. NEVER touch, stop, kill, or interfere with Port 3000 (user cafe server).

FILE WRITE OWNERSHIP:
You exclusively own and may modify:
- prisma/schema.prisma
- scripts/seed.mjs
- scripts/simulate-90-days-lifecycle.mjs
- scripts/verify-m1-integrity.mjs
You MUST NOT modify files outside this set.

INPUT SPECIFICATIONS:
Read these files thoroughly:
- d:/my life/.agents/ORIGINAL_REQUEST.md
- d:/my life/PROJECT.md
- d:/my life/.agents/m1_explorer_1/schema_spec.md (exact schema changes & Node commands)
- d:/my life/.agents/m1_explorer_2/seed_spec.md (exact 90-day simulation seeding code)
- d:/my life/.agents/m1_explorer_3/integrity_spec.md (exact verification assertions & script)

TASK:
1. Update `prisma/schema.prisma`:
   - Add `cashRegisters ShopCashRegister[]` to `model CostCenter`.
   - Add `workouts Workout[]` to `model User`.
   - Update `model Workout`: add `userId String?`, relation `user User? @relation(fields: [userId], references: [id], onDelete: SetNull)`, verify `totalVolume Float @default(0)`.
   - Update `model WorkoutExercise`: verify cascade on delete.
   - Update `model ShopCashRegister`: remove `@unique` on `date`, add `costCenterId String?`, `costCenter CostCenter? @relation(fields: [costCenterId], references: [id], onDelete: SetNull)`, add `posSalesCash Float @default(0)`, `physicalSalesCash Float @default(0)`, add `@@unique([date, costCenterId])`.
2. Apply schema safely using direct Node commands (do not use npx due to PowerShell policy):
   - `node node_modules/prisma/build/index.js validate`
   - `node node_modules/prisma/build/index.js db push`
   - `node node_modules/prisma/build/index.js generate`
   - Verify `node node_modules/typescript/bin/tsc --noEmit` exits with 0.
3. Update `scripts/seed.mjs`:
   - Implement the complete, granular 90-day simulation seeding detailed in `m1_explorer_2/seed_spec.md`:
     - 51 progressive workouts with ~255 exercises.
     - 270 daily cash register closes across Buffet (`BUF`), Cosmetics (`COS`), Rayesh (`RYSH`) with POS/cash split and 100% balanced registers.
     - 200 invoices with COGS and gross profit calculations.
     - 360 food entries (4 per day) strictly matching `NutritionLog` daily totals.
     - 540 habit logs (6 habits * 90 days).
     - 310 calendar blocks for deep work, shallow work, and workouts.
4. Update `scripts/simulate-90-days-lifecycle.mjs` with compound unique index where clause (`date_costCenterId`).
5. Run the seed script:
   - `node scripts/seed.mjs`
6. Create `scripts/verify-m1-integrity.mjs` from `m1_explorer_3/integrity_spec.md` and execute:
   - `node scripts/verify-m1-integrity.mjs`
   - `node scripts/test-core.mjs`
   - `node node_modules/typescript/bin/tsc --noEmit`
   Ensure all pass with Exit code 0.
7. Write your changes report to `d:/my life/.agents/m1_worker_2/changes.md` and handoff to `d:/my life/.agents/m1_worker_2/handoff.md`.
When done, send a message back to parent with your verification results.
