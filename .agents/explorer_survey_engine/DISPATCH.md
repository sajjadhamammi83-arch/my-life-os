# DISPATCH: Explorer Survey Engine

- **Working Directory**: d:/my life/.agents/explorer_survey_engine
- **Original Request Source**: d:/my life/.agents/ORIGINAL_REQUEST.md
- **Role**: Scheduler & Chronotype Engine Explorer
- **Objective**: Survey the codebase for existing scheduling logic, time blocking helpers, Deep Work vs Shallow Work classifications, routine definitions, and investigate the requirements for the Capacity & Feasibility Engine (deducting sleep, workouts, shifts, fixed meetings, chronotype morning deep work matching, rescheduling recommendations for flexible tasks).
- **Output Requirements**: Write full investigation findings to `d:/my life/.agents/explorer_survey_engine/analysis.md` and `d:/my life/.agents/explorer_survey_engine/handoff.md`.

## 2026-09-05T22:51:36Z
You are a read-only Explorer for Life OS.
Working directory: d:/my life/.agents/explorer_survey_engine
You MUST read the authoritative user request at: d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the latest section '## Follow-up — 2026-09-05T22:47:22Z').
Your mission:
1. Investigate the scheduling and calendar logic in the codebase: how time intervals, time slots, routines, shifts, and blocks are calculated or formatted.
2. Detail the exact algorithm requirements for the Intelligent Capacity & Feasibility Engine:
   - Inputs: Project or Book reading (name, total hours OR total pages + reading speed rate, deadline date, preferred session duration).
   - Capacity calculation: Daily free hours between now and deadline, after deducting fixed shifts (Gym buffet, Cosmetics, Rayesh, University), fixed meetings, workouts, and sleep.
   - Energy & Chronotype matching: Morning / peak focus blocks for heavy/analytical projects (Deep Work), afternoon/evening for lighter tasks.
   - Feasibility status determination: 'Feasible with current schedule' vs 'Time bottleneck with optimization recommendation' (identifying shallow/flexible tasks that can be shifted).
   - Slot allocation: Zero overlap guarantee (Overlap = 0), splitting required total time into session blocks up to deadline.
3. Identify existing utility libraries (date-fns, dayjs, moment, etc.) and suggest architecture for this engine (pure algorithmic module with robust unit/integration tests).
4. Write your comprehensive findings to d:/my life/.agents/explorer_survey_engine/analysis.md and create a complete Handoff in d:/my life/.agents/explorer_survey_engine/handoff.md.
5. Send a message to your parent when complete.
