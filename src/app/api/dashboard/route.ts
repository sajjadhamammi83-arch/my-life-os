import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPersianDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const [
      cycle,
      objectives,
      bigThreeTasks,
      todayReview,
      accounts,
      todayTransactions,
      todayCashRegister,
      latestSleep,
      lowStockProducts,
      tomorrowBlocksCount,
      tomorrowTasksCount,
      tomorrowChequesCount,
      tomorrowExamsCount,
    ] = await Promise.all([
      prisma.cycle90Day.findFirst({
        where: { status: "active" },
        include: { objectives: { include: { keyResults: true } } },
      }),
      prisma.objective.findMany({
        where: { status: "in_progress" },
        include: { keyResults: true, tasks: { take: 3 } },
      }),
      prisma.task.findMany({
        where: {
          isBigThree: true,
          OR: [
            { dueDate: { gte: startOfToday, lte: endOfToday } },
            { status: "today" },
          ],
        },
        include: { area: true, project: true, objective: true },
        take: 3,
      }),
      prisma.dailyReview.findFirst({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.financialAccount.findMany({
        include: { costCenter: true },
        orderBy: { balance: "desc" },
      }),
      prisma.transaction.findMany({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.shopCashRegister.findFirst({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
        include: { costCenter: true },
      }),
      prisma.sleepLog.findFirst({
        orderBy: { date: "desc" },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        take: 5,
      }),
      prisma.calendarBlock.count({
        where: {
          start: { gte: tomorrowStart, lte: tomorrowEnd },
        },
      }),
      prisma.task.count({
        where: {
          status: { not: "completed" },
          dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
        },
      }),
      prisma.cheque.count({
        where: {
          dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
          status: "PENDING",
        },
      }),
      prisma.universityExam.count({
        where: {
          examDate: { gte: tomorrowStart, lte: tomorrowEnd },
        },
      }),
    ]);

    const liquidBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    const todayIncome = todayTransactions
      .filter((t) => t.type === "Income" || t.type === "Sale")
      .reduce((sum, t) => sum + t.amount, 0);

    const todayExpense = todayTransactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const tomorrowPersianDate = formatPersianDate(tomorrowStart, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const tomorrowSummary = {
      persianDate: tomorrowPersianDate,
      totalItems: tomorrowBlocksCount + tomorrowTasksCount + tomorrowChequesCount + tomorrowExamsCount,
      blocksCount: tomorrowBlocksCount,
      tasksCount: tomorrowTasksCount,
      chequesCount: tomorrowChequesCount,
      examsCount: tomorrowExamsCount,
    };

    return NextResponse.json({
      success: true,
      cycle,
      objectives,
      bigThreeTasks,
      dailyReview: todayReview,
      liquidBalance,
      accounts,
      todayFinancials: {
        income: todayIncome,
        expense: todayExpense,
        net: todayIncome - todayExpense,
      },
      todayCashRegister,
      latestSleep,
      lowStockProducts,
      tomorrowSummary,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
