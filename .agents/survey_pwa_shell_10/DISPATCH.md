## 2026-09-23T00:49:25Z

You are survey_pwa_shell_10 (Explorer).
Working directory: d:/my life/.agents/survey_pwa_shell_10
Workspace root: d:/my life
Original request path: d:/my life/.agents/ORIGINAL_REQUEST.md

MANDATORY INSTRUCTION:
Read d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the section under timestamp 2026-09-23T00:45:30Z) before starting work. Do not skip this step.

Your Mission:
Investigate R1: PWA Shell & iOS Native Integration.
- Inspect Next.js 14 layout (src/app/layout.tsx), existing public/ folder, HTML head, icons, and styling.
- Design the complete PWA manifest (manifest.json or manifest.webmanifest) with name, short_name, icons, start_url, display: standalone, orientation: portrait, theme_color (#ffffff), background_color (#ffffff).
- Design iOS Safari meta tags: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-touch-icon, and viewport configurations for iPhone screen notches.
- Design icon asset generation requirements (sizes 192x192, 512x512, apple-touch-icon 180x180, SVG maskable).
- Design the dedicated Service Worker (public/sw.js) and its registration in Next.js layout:
  - Cache strategies: Stale-While-Revalidate for core pages (/today, /dashboard, /tasks, /finance, /planner, /goals, /review, /analytics), Network-First with Cache-Fallback, cache for Vazirmatn fonts and static assets (_next/static).
  - Offline fallback shell so that opening the app on an iPhone with zero network opens instantaneously in milliseconds.
- Output requirements:
  Write your comprehensive findings and technical design to d:/my life/.agents/survey_pwa_shell_10/analysis.md and write your completion handoff report to d:/my life/.agents/survey_pwa_shell_10/handoff.md.
  Notify orchestrator_10 when complete.
