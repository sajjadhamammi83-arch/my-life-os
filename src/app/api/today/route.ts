import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPersianDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      big3Tasks,
      otherTasks,
      calendarBlocks,
      habits,
      shopCashRegister,
      nutritionLog,
      dailyReview,
    ] = await Promise.all([
      prisma.task.findMany({
        where: {
          isBigThree: true,
          OR: [
            { dueDate: { gte: startOfToday, lte: endOfToday } },
            { status: "today" },
          ],
        },
        include: { area: true, project: true, objective: true },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      }),
      prisma.task.findMany({
        where: {
          isBigThree: false,
          OR: [
            { dueDate: { gte: startOfToday, lte: endOfToday } },
            { status: "today" },
          ],
        },
        include: { area: true, project: true, objective: true },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      }),
      prisma.calendarBlock.findMany({
        where: {
          OR: [
            { start: { gte: startOfToday, lte: endOfToday } },
            { end: { gte: startOfToday, lte: endOfToday } },
          ],
        },
        orderBy: { start: "asc" },
      }),
      prisma.habit.findMany({
        where: { active: true },
        include: {
          area: true,
          logs: {
            where: {
              date: { gte: startOfToday, lte: endOfToday },
            },
          },
        },
        orderBy: { streak: "desc" },
      }),
      prisma.shopCashRegister.findFirst({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
        include: { costCenter: true },
      }),
      prisma.nutritionLog.findFirst({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.dailyReview.findFirst({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
      }),
    ]);

    const formattedBlocks = calendarBlocks.map((b) => {
      const s = new Date(b.start).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      const e = new Date(b.end).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      return {
        ...b,
        startIso: b.start.toISOString(),
        endIso: b.end.toISOString(),
        timeFormatted: `${s} - ${e}`,
      };
    });

    const formattedHabits = habits.map((h) => {
      const todayLog = h.logs[0];
      return {
        id: h.id,
        title: h.title,
        unit: h.unit,
        target: h.target,
        streak: h.streak,
        preferredTime: h.preferredTime,
        area: h.area,
        todayDone: Boolean(todayLog?.completed),
      };
    });

    const hydration = {
      waterMl: nutritionLog?.waterMl || 0,
      targetWaterMl: 3000,
      percentage: Math.min(100, Math.round(((nutritionLog?.waterMl || 0) / 3000) * 100)),
    };

    const big3CompletedCount = big3Tasks.filter((t) => t.status === "completed").length;
    const totalTasksCount = big3Tasks.length + otherTasks.length;
    const completedTasksCount =
      big3Tasks.filter((t) => t.status === "completed").length +
      otherTasks.filter((t) => t.status === "completed").length;

    const persianDate = formatPersianDate(now, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return NextResponse.json({
      success: true,
      date: now.toISOString().slice(0, 10),
      persianDate,
      summary: {
        big3Total: big3Tasks.length,
        big3Completed: big3CompletedCount,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        habitsDone: formattedHabits.filter((h) => h.todayDone).length,
        habitsTotal: formattedHabits.length,
        hydrationMl: hydration.waterMl,
        blocksCount: formattedBlocks.length,
      },
      big3Tasks,
      otherTasks,
      calendarBlocks: formattedBlocks,
      habits: formattedHabits,
      shopCashRegister,
      hydration,
      dailyReview,
    });
  } catch (error: any) {
    console.error("GET /api/today error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch today data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      areaId,
      projectId,
      objectiveId,
      priority,
      workType,
      estimatedMinutes,
      eisenhowerQuadrant,
      isBigThree,
      status,
      kanbanColumn,
      notes,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "عنوان کار الزامی است" },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        areaId: areaId || undefined,
        projectId: projectId || undefined,
        objectiveId: objectiveId || undefined,
        priority: priority || "medium",
        workType: workType || "Deep Work",
        estimatedMinutes: Number(estimatedMinutes) || 30,
        eisenhowerQuadrant: eisenhowerQuadrant || (isBigThree ? "Q1" : "Q2"),
        isBigThree: Boolean(isBigThree),
        status: status || "today",
        kanbanColumn: kanbanColumn || "Ready",
        dueDate: today,
        notes: notes || undefined,
      },
      include: { area: true, project: true, objective: true },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/today error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
