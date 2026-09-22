import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. Fetch active objectives
    const activeObjectives = await prisma.objective.findMany({
      where: { status: "in_progress" },
      include: { area: true, keyResults: true },
    });

    const dispatchedTodayTasks: any[] = [];

    // 2. Autonomous Daily Dispatcher: Check if each objective has a task for today
    for (const obj of activeObjectives) {
      if (!obj.dailyAction || obj.autoSchedule === false) continue;

      // Check if a task was already created for today for this objective
      const existingTodayTask = await prisma.task.findFirst({
        where: {
          objectiveId: obj.id,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      });

      if (!existingTodayTask) {
        // Automatically create today's required goal task
        const newTask = await prisma.task.create({
          data: {
            title: `🎯 [هدف: ${obj.title}] ${obj.dailyAction}`,
            objectiveId: obj.id,
            areaId: obj.areaId || undefined,
            workType: obj.preferredTimeSlot?.includes("عمیق") ? "Deep Work" : "Deep Work",
            eisenhowerQuadrant: obj.priority === "urgent" ? "Q1" : "Q2",
            priority: obj.priority === "urgent" ? "urgent" : "high",
            isBigThree: true,
            status: "today",
            dueDate: today,
            estimatedMinutes: obj.dailyDuration || 60,
            notes: obj.strategyNotes ? `استراتژی هدف: ${obj.strategyNotes}` : undefined,
          },
          include: { objective: true, area: true },
        });
        dispatchedTodayTasks.push(newTask);
      } else {
        dispatchedTodayTasks.push(existingTodayTask);
      }
    }

    // 3. Dynamic Slip Recovery: Detect uncompleted goal tasks from yesterday or earlier
    const missedGoalTasks = await prisma.task.findMany({
      where: {
        objectiveId: { not: null },
        status: { not: "completed" },
        dueDate: { lt: startOfToday },
      },
      include: { objective: true, area: true },
      orderBy: { dueDate: "asc" },
    });

    // 4. Find Today's Occupied Calendar Blocks to Calculate Free Slots
    const todayBlocks = await prisma.calendarBlock.findMany({
      where: {
        OR: [
          { start: { gte: startOfToday, lte: endOfToday } },
          { end: { gte: startOfToday, lte: endOfToday } },
        ],
      },
      orderBy: { start: "asc" },
    });

    // Compute standard free slots today
    // We check candidate slots: 08:30-10:00, 11:00-12:30, 14:00-15:30, 16:30-18:00, 19:00-20:30, 21:00-22:30
    const candidateWindows = [
      { startHour: 8, startMin: 30, endHour: 10, endMin: 0, label: "صبح زود (۰۸:۳۰ - ۱۰:۰۰)" },
      { startHour: 11, startMin: 0, endHour: 12, endMin: 30, label: "قبل از ظهر (۱۱:۰۰ - ۱۲:۳۰)" },
      { startHour: 14, startMin: 0, endHour: 15, endMin: 30, label: "بعدازظهر ۱ (۱۴:۰۰ - ۱۵:۳۰)" },
      { startHour: 16, startMin: 30, endHour: 18, endMin: 0, label: "عصرگاه (۱۶:۳۰ - ۱۸:۰۰)" },
      { startHour: 19, startMin: 0, endHour: 20, endMin: 30, label: "غروب (۱۹:۰۰ - ۲۰:۳۰)" },
      { startHour: 21, startMin: 0, endHour: 22, endMin: 30, label: "شب (۲۱:۰۰ - ۲۲:۳۰)" },
    ];

    const availableFreeSlots: any[] = [];

    candidateWindows.forEach((cand) => {
      const candStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), cand.startHour, cand.startMin, 0, 0);
      const candEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), cand.endHour, cand.endMin, 0, 0);

      // Check overlap with any existing block
      const isOccupied = todayBlocks.some((b) => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return candStart.getTime() < bEnd && candEnd.getTime() > bStart;
      });

      if (!isOccupied) {
        availableFreeSlots.push({
          id: `free-slot-${cand.startHour}-${cand.startMin}`,
          label: cand.label,
          startIso: candStart.toISOString(),
          endIso: candEnd.toISOString(),
          startTime: `${String(cand.startHour).padStart(2, "0")}:${String(cand.startMin).padStart(2, "0")}`,
          endTime: `${String(cand.endHour).padStart(2, "0")}:${String(cand.endMin).padStart(2, "0")}`,
          durationMinutes: 90,
        });
      }
    });

    return NextResponse.json({
      success: true,
      activeObjectivesCount: activeObjectives.length,
      dispatchedTodayTasks,
      missedGoalTasks,
      hasSlipRecoveryAlert: missedGoalTasks.length > 0,
      availableFreeSlots: availableFreeSlots.slice(0, 4), // top 4 recommended empty slots
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, slotStartIso, slotEndIso, slotLabel, setBigThree } = body;

    if (!taskId || !slotStartIso) {
      return NextResponse.json({ success: false, error: "شناسه تسک و زمان اسلات الزامی است" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { objective: true },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "تسک یافت نشد" }, { status: 404 });
    }

    const start = new Date(slotStartIso);
    const end = slotEndIso ? new Date(slotEndIso) : new Date(start.getTime() + 90 * 60000);

    // 1. Update task to today and mark as Big 3
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        dueDate: new Date(),
        status: "today",
        isBigThree: setBigThree !== false,
        eisenhowerQuadrant: "Q1", // promoted to Urgent/Important recovery
        priority: "urgent",
      },
    });

    // 2. Create CalendarBlock in that free slot
    const block = await prisma.calendarBlock.create({
      data: {
        title: `[جبران عقب‌افتادگی هدف] ${task.title}`,
        taskId: task.id,
        start,
        end,
        plannedDuration: Math.round((end.getTime() - start.getTime()) / 60000) || 90,
        type: "Deep Work",
        dayType: "روز طلایی",
        notes: `اسلات جبرانی بازتنظیم‌شده توسط سیستم هوشمند (${slotLabel || ""})`,
        status: "scheduled",
      },
    });

    return NextResponse.json({
      success: true,
      message: "تسک عقب‌افتاده با موفقیت در زمان خالی امروز رزرو و تنظیم شد",
      updatedTask,
      block,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
