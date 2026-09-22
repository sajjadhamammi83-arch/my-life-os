# Task Assignment — Milestone 1 Fix Worker

## Objective
Fix the 2 defects identified by Challenger 1 in Milestone 1:
1. **Timezone Boundary Leakage**: Fix `src/app/api/reminders/tomorrow/route.ts` and `src/app/api/planner/route.ts` to strictly enforce a 24-hour window for tomorrow (from 00:00:00.000 to 23:59:59.999 local time), eliminating the 27.5-hour `Math.max(localEnd, utcEnd)` expansion that caused Day+2 events to leak into tomorrow's reminders.
2. **Malformed Date Query Validation**: In `src/app/api/planner/route.ts`, validate `dateParam`: if `dateParam` is provided but parsing yields `NaN` (`isNaN(new Date(dateParam).getTime())`), return HTTP 400 with `{ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }` instead of throwing an unhandled Prisma exception.

## 🔒 Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs
- Challenger 1 Findings: `d:/my life/.agents/m1_chal_1/handoff.md`
- Challenger 1 Stress Suite: `scripts/test-m1-challenger.mjs`
- 4-Tier E2E Suite: `scripts/test-e2e-suite.mjs`
- Master Project Architecture: `d:/my life/PROJECT.md`

## Verification Requirements
- `node node_modules/typescript/bin/tsc --noEmit` exits with 0.
- `node scripts/test-m1-challenger.mjs` passes 100% (22/22 checks pass, zero failures).
- `node scripts/test-e2e-suite.mjs` passes 100% (86/86 assertions pass).
- Verify port 3050 is healthy and port 3000 is untouched.

## Output
Write `changes.md` and `handoff.md` in `d:/my life/.agents/m1_worker_fix_6/` and report back via `send_message`.

## 2026-09-06T16:58:14Z
You are the Milestone 1 Fix Worker (m1_worker_fix_6) for the Life OS platform.

Working Directory: `d:/my life/.agents/m1_worker_fix_6`
Assignment: `d:/my life/.agents/m1_worker_fix_6/DISPATCH.md`
Challenger 1 Report with Bug Reproduction: `d:/my life/.agents/m1_chal_1/handoff.md`
Challenger 1 Test Harness: `scripts/test-m1-challenger.mjs`
Authoritative Request: `d:/my life/.agents/ORIGINAL_REQUEST.md` (read section ## Follow-up — 2026-09-05T22:47:22Z)
Project Specification: `d:/my life/PROJECT.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Initialize BRIEFING.md and progress.md in `d:/my life/.agents/m1_worker_fix_6/`.
2. Inspect and fix:
   - `src/app/api/reminders/tomorrow/route.ts`:
     Eliminate `Math.max(localEnd, utcEnd)` which expanded the query window to 27.5 hours and leaked Day+2 (01:00 AM) events into tomorrow's reminders. Strictly enforce the 24-hour window for tomorrow (from 00:00:00.000 to 23:59:59.999 local time).
   - `src/app/api/planner/route.ts`:
     Eliminate the same window expansion. In `GET`, validate `dateParam`: if `isNaN(new Date(dateParam).getTime())`, return HTTP 400 with `{ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }` instead of throwing an unhandled Prisma exception.
3. Verification:
   - Run `node scripts/test-m1-challenger.mjs` — verify 100% pass (22/22 checks, zero failures).
   - Run `node node_modules/typescript/bin/tsc --noEmit` — verify exit code 0.
   - Run `node scripts/test-e2e-suite.mjs` — verify 100% pass (86/86 assertions pass).
   - Verify port 3050 is healthy and port 3000 is untouched.
4. Write `changes.md` and `handoff.md` in `d:/my life/.agents/m1_worker_fix_6/`.
5. Send your completion message back to parent orchestrator (`00232225-0398-4919-8763-24e55761f9e4`).
