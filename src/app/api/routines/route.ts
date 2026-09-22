import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const routines = await prisma.routine.findMany({
      include: {
        phases: {
          include: { steps: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    return NextResponse.json({ success: true, routines });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { routineType, phaseId, title, durationMin } = body;

    let targetPhaseId = phaseId;
    if (!targetPhaseId) {
      const routine = await prisma.routine.findFirst({
        where: { type: routineType || "morning" },
        include: { phases: true },
      });
      targetPhaseId = routine?.phases[0]?.id;
    }

    if (!targetPhaseId) {
      return NextResponse.json({ success: false, error: "فاز روتین یافت نشد" }, { status: 404 });
    }

    const step = await prisma.routineStep.create({
      data: {
        phaseId: targetPhaseId,
        title,
        durationMin: Number(durationMin) || 5,
        isCompleted: false,
        sortOrder: 10,
      },
    });

    return NextResponse.json({ success: true, step });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { stepId, isCompleted, title, durationMin } = body;

    const dataToUpdate: any = {};
    if (isCompleted !== undefined) dataToUpdate.isCompleted = Boolean(isCompleted);
    if (title !== undefined) dataToUpdate.title = title;
    if (durationMin !== undefined) dataToUpdate.durationMin = Number(durationMin);

    const updatedStep = await prisma.routineStep.update({
      where: { id: stepId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, step: updatedStep });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get("stepId");
    if (!stepId) return NextResponse.json({ success: false, error: "شناسه گام الزامی است" }, { status: 400 });

    await prisma.routineStep.delete({ where: { id: stepId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
