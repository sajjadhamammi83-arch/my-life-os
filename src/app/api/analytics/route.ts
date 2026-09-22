import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // 7, 30, 90, all

    const daysCount = range === "7" ? 7 : range === "90" ? 90 : range === "all" ? 365 : 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysCount);
    sinceDate.setHours(0, 0, 0, 0);

    const [
      reviews,
      tasks,
      projects,
      costCenters,
      transactions,
      calendarBlocks,
      sleepLogs,
      cashRegisters,
    ] = await Promise.all([
      prisma.dailyReview.findMany({
        where: { date: { gte: sinceDate } },
        orderBy: { date: "asc" },
      }),
      prisma.task.findMany({
        include: { project: true, area: true },
      }),
      prisma.project.findMany({
        include: { area: true, milestones: true, tasks: true },
      }),
      prisma.costCenter.findMany({
        include: { accounts: true },
      }),
      prisma.transaction.findMany({
        where: { date: { gte: sinceDate } },
        include: { costCenter: true, category: true },
      }),
      prisma.calendarBlock.findMany({
        where: { start: { gte: sinceDate } },
      }),
      prisma.sleepLog.findMany({
        where: { date: { gte: sinceDate } },
        orderBy: { date: "desc" },
      }),
      prisma.shopCashRegister.findMany({
        where: { date: { gte: sinceDate } },
        include: { costCenter: true },
      }),
    ]);

    // 1. Productivity & Energy Trend (Dynamic based on range: 7, 30, 90, 365 days)
    const trendLimit = range === "7" ? 7 : range === "90" ? 90 : range === "all" ? 365 : 30;
    const dailyTrends = reviews.slice(-trendLimit).map((r) => ({
      date: r.date.toISOString().substring(0, 10),
      dateFormatted: r.date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
      productivity: r.productivityScore || 8,
      deepWork: r.deepWorkHours || 0,
      physical: r.energyPhysical || 7,
      emotional: r.energyEmotional || 7,
      mental: r.energyMental || 7,
      spiritual: r.energySpiritual || 7,
      mood: r.mood || "متمرکز",
      big3Completed: r.big3Completed || 0,
    }));

    // 2. Eisenhower Matrix distribution
    const eisenhowerStats = {
      Q1: tasks.filter((t) => t.eisenhowerQuadrant === "Q1").length,
      Q2: tasks.filter((t) => t.eisenhowerQuadrant === "Q2").length,
      Q3: tasks.filter((t) => t.eisenhowerQuadrant === "Q3").length,
      Q4: tasks.filter((t) => t.eisenhowerQuadrant === "Q4").length,
      total: tasks.length || 1,
    };

    // 3. Work Type distribution
    const workTypeMap: Record<string, number> = {};
    tasks.forEach((t) => {
      const wt = t.workType || "سایر";
      workTypeMap[wt] = (workTypeMap[wt] || 0) + 1;
    });

    // 4. Financials by Cost Center (Including Cash Register Sales & Expenses, Preventing Double-Counting)
    const costCenterFinancials = costCenters.map((cc) => {
      const ccTx = transactions.filter((tx) => tx.costCenterId === cc.id);

      // Separate direct sales transactions from other incomes
      const saleTxAmount = ccTx
        .filter((tx) => tx.type === "Sale")
        .reduce((s, tx) => s + tx.amount, 0);

      const directIncome = ccTx
        .filter((tx) => tx.type === "Income")
        .reduce((s, tx) => s + tx.amount, 0);

      const expense = ccTx
        .filter((tx) => tx.type === "Expense")
        .reduce((s, tx) => s + tx.amount, 0);

      // Cash register sales and expenses
      const crSales = cashRegisters
        .filter((cr) => cr.costCenterId === cc.id)
        .reduce((s, cr) => s + (cr.salesCash || 0), 0);

      const crExpenses = cashRegisters
        .filter((cr) => cr.costCenterId === cc.id)
        .reduce((s, cr) => s + (cr.expensesCash || 0), 0);

      // Prevent double counting if both individual sales transactions and register summary exist
      const salesRevenue = Math.max(saleTxAmount, crSales);
      const totalIncome = directIncome + salesRevenue;
      const totalExpense = expense + crExpenses;
      const profit = totalIncome - totalExpense;

      return {
        id: cc.id,
        name: cc.name,
        code: cc.code,
        color: cc.color,
        income: totalIncome,
        expense: totalExpense,
        profit,
      };
    });


    // 5. Hourly Peak Energy & Deep Work distribution (Hours 6 to 23)
    const hourlyDistribution: Record<number, number> = {};
    for (let h = 6; h <= 23; h++) hourlyDistribution[h] = 0;

    calendarBlocks.forEach((b) => {
      const hour = new Date(b.start).getHours();
      if (hourlyDistribution[hour] !== undefined) {
        hourlyDistribution[hour] += b.actualDuration || b.plannedDuration || 60;
      }
    });

    const hourlyList = Object.entries(hourlyDistribution).map(([hour, minutes]) => ({
      hour: Number(hour),
      hourLabel: `${hour}:00`,
      minutes,
      hours: Number((minutes / 60).toFixed(1)),
    }));

    // 6. High-level Summary Metrics
    const avgProductivity =
      reviews.length > 0
        ? Number(
            (reviews.reduce((s, r) => s + (r.productivityScore || 8), 0) / reviews.length).toFixed(1)
          )
        : 8.5;

    const avgDeepWorkHours =
      reviews.length > 0
        ? Number(
            (reviews.reduce((s, r) => s + (r.deepWorkHours || 0), 0) / reviews.length).toFixed(1)
          )
        : 3.2;

    const totalCompletedTasks = tasks.filter(
      (t) => t.status === "completed" || t.kanbanColumn === "Done"
    ).length;
    const taskCompletionRate = Math.round((totalCompletedTasks / (tasks.length || 1)) * 100);

    const onTrackProjectsCount = projects.filter((p) => p.health === "on_track").length;
    const projectsHealthRate = Math.round((onTrackProjectsCount / (projects.length || 1)) * 100);

    const avgSleepHours =
      sleepLogs.length > 0
        ? Number(
            (sleepLogs.reduce((s, l) => s + (l.totalSleepTimeMinutes || 420), 0) / (sleepLogs.length * 60)).toFixed(1)
          )
        : 7.6;

    const summary = {
      avgProductivity,
      avgDeepWorkHours,
      totalCompletedTasks,
      totalTasks: tasks.length,
      taskCompletionRate,
      projectsHealthRate,
      onTrackProjectsCount,
      totalProjects: projects.length,
      avgSleepHours,
      totalReviewsLogged: reviews.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      dailyTrends,
      eisenhowerStats,
      workTypeMap,
      costCenterFinancials,
      hourlyList,
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        area: p.area?.name,
        progress: p.progress,
        health: p.health,
        budget: p.budget,
        actualCost: p.actualCost,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
