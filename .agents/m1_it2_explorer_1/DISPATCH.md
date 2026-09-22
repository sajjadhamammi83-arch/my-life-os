## 2026-09-03T19:16:53Z

You are m1_it2_explorer_1 (teamwork_preview_explorer).
Your working directory is: d:/my life/.agents/m1_it2_explorer_1/
Project root is: d:/my life

INPUTS:
- d:/my life/.agents/ORIGINAL_REQUEST.md
- d:/my life/PROJECT.md
- d:/my life/.agents/m1_reviewer_1/handoff.md
- d:/my life/.agents/m1_reviewer_1/review_report.md
- scripts/simulate-90-days-lifecycle.mjs
- scripts/seed.mjs
- scripts/verify-m1-integrity.mjs

CONTEXT & PROBLEM:
In Milestone 1 Iteration 1, `m1_reviewer_1` executed `node scripts/simulate-90-days-lifecycle.mjs` followed by `node scripts/verify-m1-integrity.mjs`. It failed because `simulate-90-days-lifecycle.mjs` lines 147-227 upserts arbitrary cash register sales numbers that do not match the `Invoice` totals for those dates and cost centers.

TASK:
Examine `scripts/simulate-90-days-lifecycle.mjs` and `scripts/seed.mjs`.
Provide the exact code fix for `simulate-90-days-lifecycle.mjs` so that when it updates or simulates daily cash registers, it either:
1. Derives `salesCash` and payments directly from the `Invoice` records for that day and cost center, OR
2. Creates/updates corresponding `Invoice` records to maintain 100% mathematical reconciliation with `ShopCashRegister`.
Ensure registers remain 100% balanced (`difference = 0`, `reconciled: true`).
Write your concrete fix specification in `d:/my life/.agents/m1_it2_explorer_1/fix_spec.md` and send completion message to parent.
