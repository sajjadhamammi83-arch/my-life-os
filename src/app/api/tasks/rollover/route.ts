import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRolloverToTomorrow } from "@/lib/task-rollover";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const uncompletedTasks = await prisma.task.findMany({
      where: {
        status: { not: "completed" },
        OR: [
          { dueDate: { lte: todayEnd } },
          { status: "today" },
        ],
      },
      include: { area: true, project: true, objective: true },
      orderBy: { priority: "desc" },
    });

    const tomorrowBlocks = await prisma.calendarBlock.findMany({
      where: {
        start: { gte: tomorrowStart, lte: tomorrowEnd },
      },
      orderBy: { start: "asc" },
    });

    const candidateWindows = [
      { startH: 9, startM: 0, endH: 10, endM: 30, label: "۰۹:۰۰ - ۱۰:۳۰ (کار عمیق صبحگاهی)" },
      { startH: 11, startM: 0, endH: 12, endM: 30, label: "۱۱:۰۰ - ۱۲:۳۰ (بخش دوم تمرکز)" },
      { startH: 14, startM: 0, endH: 15, endM: 30, label: "۱۴:۰۰ - ۱۵:۳۰ (پیگیری‌های بعدازظهر)" },
      { startH: 16, startM: 30, endH: 18, endM: 0, label: "۱۶:۳۰ - ۱۸:۰۰ (عملیات و هماهنگی)" },
      { startH: 20, startM: 0, endH: 21, endM: 30, label: "۲۰:۰۰ - ۲۱:۳۰ (مرور شبانه و جمع‌بندی)" },
    ];

    const freeSlots: Array<{
      start: Date;
      end: Date;
      label: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
    }> = [];

    for (const win of candidateWindows) {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, win.startH, win.startM, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, win.endH, win.endM, 0, 0);

      const overlaps = tomorrowBlocks.some((b) => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return bStart < e.getTime() && bEnd > s.getTime();
      });

      if (!overlaps) {
        freeSlots.push({
          start: s,
          end: e,
          label: win.label,
          startTime: `${String(win.startH).padStart(2, "0")}:${String(win.startM).padStart(2, "0")}`,
          endTime: `${String(win.endH).padStart(2, "0")}:${String(win.endM).padStart(2, "0")}`,
          durationMinutes: Math.round((e.getTime() - s.getTime()) / 60000),
        });

      }
    }

    return NextResponse.json({
      success: true,
      unfinishedCount: uncompletedTasks.length,
      tasks: uncompletedTasks,
      proposedSlots: freeSlots,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await handleRolloverToTomorrow();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}