## 2026-09-13T20:18:09Z
You are Survey Explorer 2 (survey_explorer_2_7).
Your working directory is: d:/my life/.agents/survey_explorer_2_7
Read ORIGINAL_REQUEST.md at: d:/my life/.agents/ORIGINAL_REQUEST.md (specifically the latest follow-up under 2026-09-13T20:09:45Z).

Objective:
Investigate and map the full scope for:
1. Finance (/finance, /api/finance) connected to Cost Centers & Analytics:
   - Daily register (ShopCashRegister), transactions, revenues, and expenses linked to cost centers.
   - Reflection in P&L (profit & loss) analytics on the reports page (/analytics, /api/analytics).
   - Check Prisma models (ShopCashRegister, Transaction, CostCenter, Category, etc.), API routes (/api/finance, /api/analytics), and UI components (/finance, /analytics).
2. Reviews (/reviews, /api/reviews/daily) connected to Dashboard & Analytics:
   - Daily review metrics: productivity score, deep work hours, 4 energy levels (physical, emotional, mental, spiritual), mood, and bottlenecks.
   - Link to dashboard (/dashboard, /api/dashboard) and /analytics charts (energy matrix, productivity trends, bottleneck analysis).
   - Check Prisma models (DailyReview, ReviewMetrics, etc.), API routes (/api/reviews/daily, /api/dashboard, /api/analytics), and UI components (/reviews, /dashboard, /analytics).

Constraints:
- You are read-only Explorer. Do not modify code.
- Port 3050 strictly enforced. Never touch port 3000.
- Check current state, existing code, gaps, exact schema/API/UI changes required.
- Write your full analysis and implementation roadmap into d:/my life/.agents/survey_explorer_2_7/handoff.md.
- Send a completion message to your orchestrator parent when done.
