import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      include: { area: true, logs: true },
      orderBy: { streak: "desc" },
    });
    return NextResponse.json({ success: true, habits });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, areaId, frequency, target, unit, preferredTime } = body;

    const habit = await prisma.habit.create({
      data: {
        title,
        areaId: areaId || undefined,
        frequency: frequency || "daily",
        target: Number(target) || 1,
        unit: unit || "مرتبه",
        preferredTime: preferredTime || "صبح",
        streak: 1,
        completionRate: 100,
        active: true,
      },
    });

    return NextResponse.json({ success: true, habit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { habitId, completed } = body;

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const existingLog = await prisma.habitLog.findFirst({
      where: { habitId, date: today },
    });

    if (existingLog) {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: Boolean(completed) },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId,
          date: today,
          completed: Boolean(completed),
          value: 1,
        },
      });
    }

    // Update streak
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        streak: completed ? { increment: 1 } : { decrement: 1 },
      },
    });

    return NextResponse.json({ success: true, habit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
