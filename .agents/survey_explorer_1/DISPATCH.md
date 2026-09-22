## 2026-09-03T17:41:54Z

You are survey_explorer_1 (teamwork_preview_explorer).
Your working directory is: d:/my life/.agents/survey_explorer_1/
Project root is: d:/my life
Original request file: d:/my life/.agents/ORIGINAL_REQUEST.md

You are a read-only exploration agent. DO NOT write or modify implementation source code or tests. Only create your report in your working directory.

TASK:
Investigate and document:
1. Overall technology stack, framework (Next.js/React/Vite/Express/etc.), server entry point, scripts in package.json (dev, build, start, typecheck).
2. Port configuration: how the app is started, where ports are defined, how to ensure it strictly runs on port 3050 without touching port 3000.
3. Complete enumeration of all 17 system routes/pages in the application:
   - Route path (e.g. /, /finance, /calendar, /health, /analytics, /inventory, etc.)
   - Corresponding source file / component path
   - Current status of the route (renders, broken, placeholder)
4. Design & styling system:
   - CSS/Tailwind configuration
   - Font configuration (Vazirmatn setup across the app)
   - Adherence to clean minimal design (pure white #ffffff background, high-contrast cards and buttons)
5. TypeScript setup and current state:
   - tsconfig.json analysis
   - Run typecheck analysis or inspect potential type errors
6. Produce your comprehensive report at d:/my life/.agents/survey_explorer_1/survey_report.md with an executive summary and full findings table.
When done, send a message back to parent with your findings summary and the path to your report.
