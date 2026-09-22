# BRIEFING — 2026-09-03T19:49:00Z

## Mission
Fix `scripts/simulate-90-days-lifecycle.mjs` to eliminate database relational integrity corruption (cash registers vs invoices, nutrition logs vs food entries, dynamic KeyResults) and ensure all verification suites pass 100%.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: d:/my life/.agents/m1_it2_worker_2
- Original parent: 86e880a5-0242-4edf-a8b5-1afaaab0a691
- Milestone: Milestone 1 Iteration 2 — Lifecycle Simulation Fix & Relational Synchronization

## 🔒 Key Constraints
- Exclusively own `scripts/simulate-90-days-lifecycle.mjs`. Do not modify other source/seed files unless explicitly directed.
- Daily cash register updates must match actual invoices per cost center, or calculate them from existing invoices.
- NutritionLog updates must maintain concordance with child foodEntry records and adhere to Atwater formula (Calories = 4*P + 4*C + 9*F).
- KeyResult progress must be calculated dynamically from real database entities.
- Must execute verification commands:
  - `node scripts/simulate-90-days-lifecycle.mjs`
  - `node scripts/verify-m1-integrity.mjs` (36/36 assertions, exit 0)
  - `node scripts/test-core.mjs` (7/7 pass, exit 0)
  - `node scripts/test-e2e-suite.mjs` (86/86 pass, exit 0)
  - `node node_modules/typescript/bin/tsc --noEmit` (exit 0)
- NO CHEATING: Genuine implementations only.

## Current Parent
- Conversation ID: 86e880a5-0242-4edf-a8b5-1afaaab0a691
- Updated: not yet

## Task Summary
- **What to build**: Update `scripts/simulate-90-days-lifecycle.mjs` to synchronize relational invariants: cash registers with invoices, nutrition logs with food entries and Atwater formula, and compute KeyResult progress dynamically from real DB entities.
- **Success criteria**: Running simulate-90-days-lifecycle followed by verify-m1-integrity passes 36/36 checks, and core/e2e/tsc pass.
- **Interface contracts**: `d:/my life/PROJECT.md`
- **Code layout**: `scripts/simulate-90-days-lifecycle.mjs`

## Key Decisions Made
- [TBD]

## Artifact Index
- `d:/my life/.agents/m1_it2_worker_2/DISPATCH.md` — Worker assignment and instructions
- `d:/my life/.agents/m1_it2_worker_2/BRIEFING.md` — Working memory and status
- `d:/my life/.agents/m1_it2_worker_2/progress.md` — Liveness heartbeat
- `d:/my life/.agents/m1_it2_worker_2/changes.md` — Detailed changes log
- `d:/my life/.agents/m1_it2_worker_2/handoff.md` — Final 5-component handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: Simulation script corrupts cash register, nutrition, and KR data

## Quality Status
- **Build/test result**: Untested
- **Lint status**: 0
- **Tests added/modified**: scripts/simulate-90-days-lifecycle.mjs verification

## Loaded Skills
- None specified in dispatch prompt.
