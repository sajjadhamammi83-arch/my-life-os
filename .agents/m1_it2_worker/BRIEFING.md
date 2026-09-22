# BRIEFING — 2026-09-03T19:43:02Z

## Mission
Fix relational integrity and synchronization in scripts/simulate-90-days-lifecycle.mjs to pass 36/36 checks on verify-m1-integrity.mjs.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: d:/my life/.agents/m1_it2_worker
- Original parent: 86e880a5-0242-4edf-a8b5-1afaaab0a691
- Milestone: Milestone 1 Iteration 2

## 🔒 Key Constraints
- Owned file: scripts/simulate-90-days-lifecycle.mjs (exclusively owned)
- DO NOT CHEAT: No hardcoded test results, facade implementations, or circumventing tests.
- Daily cash register updates must match actual invoices per cost center, or calculate them from existing invoices.
- NutritionLog updates must maintain concordance with child foodEntry records and adhere to Atwater formula.
- KeyResult progress must be calculated dynamically from real database entities.
- Must verify: node scripts/simulate-90-days-lifecycle.mjs followed by node scripts/verify-m1-integrity.mjs passes 36/36 checks.
- Must verify test-core (7/7), test-e2e-suite (86/86), and tsc --noEmit (0 errors).
- Port 3050 respected, Port 3000 untouched.

## Current Parent
- Conversation ID: 86e880a5-0242-4edf-a8b5-1afaaab0a691
- Updated: not yet

## Task Summary
- **What to build**: Fix scripts/simulate-90-days-lifecycle.mjs to ensure strict relational integrity with Prisma models, invoices, food entries, and OKRs.
- **Success criteria**: All verification commands pass with 100% exit 0.
- **Interface contracts**: PROJECT.md
- **Code layout**: scripts/simulate-90-days-lifecycle.mjs

## Key Decisions Made
- Investigating scripts/simulate-90-days-lifecycle.mjs, scripts/verify-m1-integrity.mjs, and scripts/seed.mjs.

## Artifact Index
- d:/my life/.agents/m1_it2_worker/changes.md — Implementation changes log
- d:/my life/.agents/m1_it2_worker/handoff.md — Handoff report
- d:/my life/.agents/m1_it2_worker/progress.md — Progress and liveness heartbeat

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending initial run
- **Pending issues**: Simulation script desynchronizes cash registers and nutrition logs.

## Quality Status
- **Build/test result**: Pending
- **Lint status**: 0 violations known
- **Tests added/modified**: Pending

## Loaded Skills
- None
