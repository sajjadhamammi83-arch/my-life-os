# BRIEFING — 2026-09-06T02:20:00Z

## Mission
Deliver the Intelligent Life OS Auto-Scheduler (سیستم فوق‌هوشمند زمان‌بندی خودکار تقویم) including D-1 Advance Reminders, Capacity & Feasibility Engine, and 1-Click Calendar Registration with zero overlap, full persistence, minimal white styling, and zero TypeScript errors on port 3050.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: d:/my life/.agents/orchestrator_3
- Original parent: parent (Sentinel)
- Original parent conversation ID: 5b80a530-68f9-4ca6-b42c-adc3a9a0dc70

## 🔒 My Workflow
- **Pattern**: Project Pattern (Dual Track: Implementation + E2E Testing)
- **Scope document**: d:/my life/PROJECT.md
1. **Survey**: Dispatch 3 parallel explorers to investigate the existing calendar, header bell, dashboard, today, and planner implementations, data models, and routes.
2. **Decompose & Plan**: Update PROJECT.md and TEST_INFRA.md with architecture, feature inventory, milestone boundaries, interface contracts.
3. **Dispatch & Execute**:
   - Implementation Track: Explorer -> Worker -> Reviewer -> Challenger -> Auditor gate per milestone.
   - E2E Testing Track: Design & run verification test suites (Tiers 1-4).
4. **On failure**: Retry -> Replace -> Skip -> Redistribute -> Redesign -> Escalate.
5. **Succession**: Threshold at 16 spawns.

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands directly — require workers to do so.
- NEVER investigate or explore at the code level — dispatch Explorers.
- Audit is a BINARY VETO: If Forensic Auditor reports INTEGRITY VIOLATION, fail milestone unconditionally.
- Never touch port 3000 (user cafe server). Keep port 3050 healthy.
- Include path to ORIGINAL_REQUEST.md in all subagent dispatches.
- Do NOT reuse subagents after handoff — spawn fresh subagents.

## Current Parent
- Conversation ID: 5b80a530-68f9-4ca6-b42c-adc3a9a0dc70
- Updated: 2026-09-06T02:20:00Z

## Key Decisions Made
- Selected Project Pattern with Dual Track (Implementation Track + E2E Testing Track).
- Survey phase begins immediately with 3 specialized Explorers.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_survey_data | teamwork_preview_explorer | Survey DB schema, models, calendar APIs | in-progress | 2ecbbbcf-2d96-41f5-9809-7787b7486478 |
| explorer_survey_ui | teamwork_preview_explorer | Survey UI components, Header Bell, Planner, Today | in-progress | caa66ea7-5b4d-4ca6-b7e0-e358063a39f9 |
| explorer_survey_engine | teamwork_preview_explorer | Survey scheduler engine, chronotype, capacity | in-progress | bc1a6591-5acb-4688-8451-5e5de0c661d1 |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: 2ecbbbcf-2d96-41f5-9809-7787b7486478, caa66ea7-5b4d-4ca6-b7e0-e358063a39f9, bc1a6591-5acb-4688-8451-5e5de0c661d1
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 665e2058-b5cb-46b4-8b74-0f0fe47d1152/task-14
- Safety timer: none

## Artifact Index
- d:/my life/.agents/orchestrator_3/DISPATCH.md — Dispatch log
- d:/my life/.agents/orchestrator_3/BRIEFING.md — Persistent context & identity
- d:/my life/.agents/orchestrator_3/progress.md — Liveness & milestone checklist
- d:/my life/.agents/orchestrator_3/plan.md — Orchestration execution plan
- d:/my life/PROJECT.md — Global project architecture and milestone index
