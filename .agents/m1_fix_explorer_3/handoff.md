# Handoff Report: Goals Feedback Asymmetry / Ratchet Effect Remediation

**Agent**: `m1_fix_explorer_3`
**Role**: Read-only Exploration & Forensic Analysis
**Target File**: `src/app/api/tasks/route.ts`
**Defect Reference**: Defect #3 in `d:/my life/.agents/victory_auditor/audit_report.md`

---

## 1. Observation

### 1.1 The Ratchet Defect in `src/app/api/tasks/route.ts`
In `src/app/api/tasks/route.ts` (lines 105–147), task completion triggers an increment of `KeyResult` and `Objective` progress:

```typescript
// Lines 105-107:
const willBeCompleted = isCompleted === true || status === "completed" || kanbanColumn === "Done" || dataToUpdate.status === "completed";
const wasCompleted = existingTask.status === "completed" || existingTask.kanbanColumn === "Done";

// Lines 108-147:
// 1. Goals Feedback Loop: When task is marked completed
if (willBeCompleted && !wasCompleted && existingTask.objectiveId) {
  try {
    const obj = await prisma.objective.findUnique({
      where: { id: existingTask.objectiveId },
      include: { keyResults: true },
    });
    if (obj) {
      if (obj.keyResults && obj.keyResults.length > 0) {
        const firstKr = obj.keyResults[0];
        const span = firstKr.target - firstKr.baseline;
        const step = span > 0 ? Math.max(1, Math.round(span / 10)) : 1;
        const newKrVal = Math.min(firstKr.target, (firstKr.currentValue || 0) + step);
        const newKrProg = calculateProgress(firstKr.baseline, firstKr.target, newKrVal);

        await prisma.keyResult.update({
          where: { id: firstKr.id },
          data: { currentValue: newKrVal, progress: newKrProg },
        });

        const allKrs = await prisma.keyResult.findMany({ where: { objectiveId: obj.id } });
        const avgProg = Math.round(allKrs.reduce((acc, k) => acc + k.progress, 0) / (allKrs.length || 1));
        await prisma.objective.update({
          where: { id: obj.id },
          data: { progress: avgProg, currentValue: (obj.currentValue || 0) + 1 },
        });
      } else {
        const tgt = obj.targetValue || 100;
        const newCur = (obj.currentValue || 0) + 1;
        const newProg = calculateProgress(0, tgt, newCur);
        await prisma.objective.update({
          where: { id: obj.id },
          data: { currentValue: newCur, progress: newProg },
        });
      }
    }
  } catch (err) {
    console.error("Objective feedback loop error:", err);
  }
}
```

However, there is **no corresponding `else if (!willBeCompleted && wasCompleted && existingTask.objectiveId)` block**.
When a user unchecks a task (`PATCH /api/tasks` with `{ id, isCompleted: false }`), the task is transitioned back to `status: "today"`, but `KeyResult.currentValue`, `KeyResult.progress`, `Objective.currentValue`, and `Objective.progress` remain at their inflated values.

### 1.2 Contrast with Big 3 Feedback Loop (Which Already Possesses Rollback)
In the same file directly below (lines 161–188), the Big 3 feedback loop **does** implement symmetric rollback:
```typescript
if (willBeCompleted && !wasCompleted) {
  // Increments big3Completed ...
} else if (!willBeCompleted && wasCompleted && existingReview && existingReview.big3Completed > 0) {
  await prisma.dailyReview.update({
    where: { id: existingReview.id },
    data: { big3Completed: Math.max(0, existingReview.big3Completed - 1) },
  });
}
```
The Goals Feedback Loop is missing this exact symmetric rollback.

### 1.3 Completion State Transition Inaccuracy in Line 105
Directly observed in line 105:
```typescript
const willBeCompleted = isCompleted === true || status === "completed" || kanbanColumn === "Done" || dataToUpdate.status === "completed";
```
If a client issues a PATCH request updating an unrelated field on an already completed task (e.g., `{ id, isBigThree: true }` or `{ id, notes: "..." }`), `isCompleted`, `status`, and `kanbanColumn` are `undefined`. Consequently, `willBeCompleted` evaluates to `false` even though the task remains `completed` in the database.
Furthermore, in line 102:
```typescript
if (isCompleted) dataToUpdate.kanbanColumn = "Done";
```
When `isCompleted: false` is passed, `dataToUpdate.kanbanColumn` is not reset. If `existingTask.kanbanColumn` was `"Done"`, it remained `"Done"` in the database.

### 1.4 Adversarial Test Confirmation (`scripts/test-adversarial-challenger.ts`)
In `scripts/test-adversarial-challenger.ts` (lines 430–472):
- **ADV-GOALS-02**: Checks task (`isCompleted: true`), then unchecks (`isCompleted: false`). Asserts:
  ```typescript
  const krDecremented = krAfterUncheck!.currentValue < krAfterCheck!.currentValue;
  const objDecremented = objAfterUncheck!.currentValue < objAfterCheck!.currentValue;
  ```
  Result: Failed with `ASYMMETRY CONFIRMED: Big3 review decrements correctly ... BUT KeyResult currentValue stayed at ... and Objective currentValue stayed at ...`.
- **ADV-GOALS-03B** (lines 534–585): Rapid toggle cycling (check -> uncheck -> check -> uncheck -> check).
  Result: Failed with `RATCHET INFLATION CONFIRMED: Checking/unchecking/checking the same single task 3 times caused KR currentValue to ratchet from 1 up to 3 and Objective progress to 30%`.

---

## 2. Logic Chain

1. **Root Cause**: The PATCH handler in `src/app/api/tasks/route.ts` contains only an increment branch (`if (willBeCompleted && !wasCompleted && existingTask.objectiveId)`), with no decrement / rollback branch when a task transitions from completed to uncompleted (`!willBeCompleted && wasCompleted`).
2. **Transition Detection**:
   - The completion state transition must depend strictly on the final state after applying updates vs. the existing state:
     ```typescript
     const finalStatus = dataToUpdate.status !== undefined ? dataToUpdate.status : existingTask.status;
     const finalKanban = dataToUpdate.kanbanColumn !== undefined ? dataToUpdate.kanbanColumn : existingTask.kanbanColumn;
     const willBeCompleted = finalStatus === "completed" || finalKanban === "Done";
     const wasCompleted = existingTask.status === "completed" || existingTask.kanbanColumn === "Done";
     ```
   - When `isCompleted: false` is supplied, if `existingTask.kanbanColumn === "Done"` and no explicit `kanbanColumn` was passed, `dataToUpdate.kanbanColumn` must be reset to `"Ready"`.
3. **Idempotency & Guard**:
   - An actual uncheck transition requires `!willBeCompleted && wasCompleted`.
   - If a task is already uncompleted (`wasCompleted === false`), calling `isCompleted: false` results in `!willBeCompleted && wasCompleted` being `false`. Rollback does **not** fire on repeated unchecks.
   - If a task is already completed (`wasCompleted === true`), calling `isCompleted: true` results in `willBeCompleted && !wasCompleted` being `false`. Increment does **not** fire on repeated checks.
4. **Symmetric Rollback Computation**:
   - **KeyResult Branch (`obj.keyResults.length > 0`)**:
     - `step = span > 0 ? Math.max(1, Math.round(span / 10)) : 1;` (identical to increment).
     - Floor boundary: `const floorKrVal = Math.min(firstKr.baseline, firstKr.target);` (prevents dropping below baseline or 0).
     - New KR value: `const newKrVal = Math.max(floorKrVal, (firstKr.currentValue || 0) - step);`
     - Recalculate KR progress: `const newKrProg = calculateProgress(firstKr.baseline, firstKr.target, newKrVal);`
     - Update KR in DB.
     - Recalculate objective average progress across all KRs:
       `const allKrs = await prisma.keyResult.findMany({ where: { objectiveId: obj.id } });`
       `const avgProg = Math.round(allKrs.reduce((acc, k) => acc + k.progress, 0) / (allKrs.length || 1));`
     - Decrement Objective `currentValue`: `const newObjCur = Math.max(0, (obj.currentValue || 0) - 1);`
     - Update Objective with `progress: avgProg` and `currentValue: newObjCur`.
   - **Direct Objective Branch (`obj.keyResults.length === 0`)**:
     - Target: `const tgt = obj.targetValue || 100;`
     - Decrement: `const newCur = Math.max(0, (obj.currentValue || 0) - 1);`
     - Recalculate progress: `const newProg = calculateProgress(0, tgt, newCur);`
     - Update Objective in DB.
5. **Impact on E2E & Adversarial Suites**:
   - In `scripts/test-e2e-all.ts`: Phase 4 Chain 1 performs `isCompleted: true` and verifies progress increments. The increment logic is unchanged.
   - In `scripts/test-adversarial-challenger.ts`: ADV-GOALS-02 verifies `krAfterUncheck!.currentValue < krAfterCheck!.currentValue` and `objAfterUncheck!.currentValue < objAfterCheck!.currentValue`. Both will be decremented symmetrically, resolving ADV-GOALS-02 and ADV-GOALS-03B.

---

## 3. Caveats

1. **Multi-KR Strategy**: Currently, the increment logic selects `firstKr = obj.keyResults[0]` as the primary metric to increment when a linked task completes. The rollback mirrors this exact choice (`firstKr = obj.keyResults[0]`) to guarantee arithmetic symmetry. If future architecture links specific tasks to specific `keyResultId` rather than `objectiveId`, the schema would need a `task.keyResultId` column (currently `Task` only has `objectiveId`).
2. **Batch Rollover**: The rollover action (`POST /api/tasks/rollover` or `body.action === "rollover_to_tomorrow"`) operates on incomplete tasks, so it does not trigger goal completion or rollback.

---

## 4. Conclusion & Proposed Code

The solution consists of:
1. Enhancing `dataToUpdate.kanbanColumn` reset when `isCompleted: false`.
2. Accurately determining `finalStatus`, `finalKanban`, `willBeCompleted`, and `wasCompleted`.
3. Adding the symmetric `else if (!willBeCompleted && wasCompleted && existingTask.objectiveId)` block with floor-protected decrements.

### Exact Line-by-Line Diff

```diff
--- a/src/app/api/tasks/route.ts
+++ b/src/app/api/tasks/route.ts
@@ -99,14 +99,18 @@ export async function PATCH(request: Request) {
     if (isCompleted !== undefined) {
       dataToUpdate.status = isCompleted ? "completed" : "today";
       dataToUpdate.completedAt = isCompleted ? new Date() : null;
-      if (isCompleted) dataToUpdate.kanbanColumn = "Done";
+      if (isCompleted) {
+        dataToUpdate.kanbanColumn = "Done";
+      } else if (existingTask.kanbanColumn === "Done" && kanbanColumn === undefined) {
+        dataToUpdate.kanbanColumn = "Ready";
+      }
     }
 
-    const willBeCompleted = isCompleted === true || status === "completed" || kanbanColumn === "Done" || dataToUpdate.status === "completed";
+    const finalStatus = dataToUpdate.status !== undefined ? dataToUpdate.status : existingTask.status;
+    const finalKanban = dataToUpdate.kanbanColumn !== undefined ? dataToUpdate.kanbanColumn : existingTask.kanbanColumn;
+    const willBeCompleted = finalStatus === "completed" || finalKanban === "Done";
     const wasCompleted = existingTask.status === "completed" || existingTask.kanbanColumn === "Done";
 
-    // 1. Goals Feedback Loop: When task is marked completed
+    // 1. Goals Feedback Loop: When task is marked completed or uncompleted
     if (willBeCompleted && !wasCompleted && existingTask.objectiveId) {
       try {
         const obj = await prisma.objective.findUnique({
@@ -144,6 +148,45 @@ export async function PATCH(request: Request) {
       } catch (err) {
         console.error("Objective feedback loop error:", err);
       }
+    } else if (!willBeCompleted && wasCompleted && existingTask.objectiveId) {
+      try {
+        const obj = await prisma.objective.findUnique({
+          where: { id: existingTask.objectiveId },
+          include: { keyResults: true },
+        });
+        if (obj) {
+          if (obj.keyResults && obj.keyResults.length > 0) {
+            const firstKr = obj.keyResults[0];
+            const span = firstKr.target - firstKr.baseline;
+            const step = span > 0 ? Math.max(1, Math.round(span / 10)) : 1;
+            const floorKrVal = Math.min(firstKr.baseline, firstKr.target);
+            const newKrVal = Math.max(floorKrVal, (firstKr.currentValue || 0) - step);
+            const newKrProg = calculateProgress(firstKr.baseline, firstKr.target, newKrVal);
+
+            await prisma.keyResult.update({
+              where: { id: firstKr.id },
+              data: { currentValue: newKrVal, progress: newKrProg },
+            });
+
+            const allKrs = await prisma.keyResult.findMany({ where: { objectiveId: obj.id } });
+            const avgProg = Math.round(allKrs.reduce((acc, k) => acc + k.progress, 0) / (allKrs.length || 1));
+            const newObjCur = Math.max(0, (obj.currentValue || 0) - 1);
+            await prisma.objective.update({
+              where: { id: obj.id },
+              data: { progress: avgProg, currentValue: newObjCur },
+            });
+          } else {
+            const tgt = obj.targetValue || 100;
+            const newCur = Math.max(0, (obj.currentValue || 0) - 1);
+            const newProg = calculateProgress(0, tgt, newCur);
+            await prisma.objective.update({
+              where: { id: obj.id },
+              data: { currentValue: newCur, progress: newProg },
+            });
+          }
+        }
+      } catch (err) {
+        console.error("Objective rollback error:", err);
+      }
     }
 
     // 2. Big 3 Feedback Loop: When Big 3 task is completed
```

Artifacts provided:
- Unified patch: `d:/my life/.agents/m1_fix_explorer_3/goals_feedback_rollback.patch`
- Full replacement reference: `d:/my life/.agents/m1_fix_explorer_3/proposed_route.ts`

---

## 5. Verification Method

### 5.1 Verification Commands
1. **TypeScript Typecheck**:
   ```powershell
   node node_modules/typescript/bin/tsc --noEmit
   ```
   *Expected*: Exit code 0 (once Explorer 1 null-check fix in test-adversarial-challenger is applied).
2. **Universal E2E Test Suite**:
   ```powershell
   node --experimental-strip-types scripts/test-e2e-all.ts
   ```
   *Expected*: 100% pass (49/49 assertions), Phase 4 Chain 1 passes cleanly.
3. **Adversarial Challenger Test Suite**:
   ```powershell
   node --experimental-strip-types scripts/test-adversarial-challenger.ts
   ```
   *Expected*: ADV-GOALS-02 (Unchecking task: KR/Objective decrementation) and ADV-GOALS-03B (Toggle cycling ratchet effect) both pass.

### 5.2 Direct Empirical Verification
Run an empirical HTTP probe against the live server:
1. Create a test objective and key result with baseline = 0, target = 10, currentValue = 0.
2. Create a task linked to that objective.
3. `PATCH /api/tasks` with `{ id: task.id, isCompleted: true }`. Verify KR currentValue is 1 and Objective currentValue is 1.
4. `PATCH /api/tasks` with `{ id: task.id, isCompleted: false }`. Verify KR currentValue drops back to 0 and Objective currentValue drops back to 0.
5. `PATCH /api/tasks` with `{ id: task.id, isCompleted: false }` again. Verify KR currentValue remains 0 (does not become negative).
6. Clean up test records.
