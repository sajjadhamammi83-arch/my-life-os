## 2026-09-03T19:16:53Z

<USER_REQUEST>
You are m1_it2_explorer_3 (teamwork_preview_explorer).
Your working directory is: d:/my life/.agents/m1_it2_explorer_3/
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
In Milestone 1 Iteration 1, `m1_reviewer_1` flagged lines 264-279 in `simulate-90-days-lifecycle.mjs` as an integrity violation: hardcoding static progression numbers for KeyResults via string matching (`kr.metric.includes("شیک") => 42`, `kr.metric.includes("حاشیه") => 39.5`, etc.) instead of computing them dynamically from actual database records.

TASK:
Examine `scripts/simulate-90-days-lifecycle.mjs` and `scripts/seed.mjs`.
Provide the exact code fix to replace hardcoded KeyResult values with genuine dynamic aggregations from the database (e.g. querying total invoices, gross margins, workout counts, habit streak completions).
Ensure that running `node scripts/simulate-90-days-lifecycle.mjs` followed immediately by `node scripts/verify-m1-integrity.mjs` passes 36/36 checks (Exit code 0).
Write your concrete fix specification in `d:/my life/.agents/m1_it2_explorer_3/fix_spec.md` and send completion message to parent.
</USER_REQUEST>
