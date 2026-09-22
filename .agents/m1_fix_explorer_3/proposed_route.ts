import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateProgress } from "@/lib/utils";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: { area: true, project: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { handleRolloverToTomorrow } from "@/lib/task-rollover";


export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "rollover_to_tomorrow") {
      const result = await handleRolloverToTomorrow();
      return NextResponse.json(result);
    }

    const { title, areaId, projectId, priority, workType, estimatedMinutes, eisenhowerQuadrant, isBigThree, status, kanbanColumn, dueDate, notes } = body;

    const task = await prisma.task.create({
      data: {
        title,
        areaId: areaId || undefined,
        projectId: projectId || undefined,
        priority: priority || "medium",
        workType: workType || "Deep Work",
        estimatedMinutes: Number(estimatedMinutes) || 30,
        eisenhowerQuadrant: eisenhowerQuadrant || "Q2",
        isBigThree: Boolean(isBigThree),
        status: status || (isBigThree ? "today" : "inbox"),
        kanbanColumn: kanbanColumn || "Ready",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || undefined,
      },
      include: { area: true },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "rollover_to_tomorrow") {
      const result = await handleRolloverToTomorrow();
      return NextResponse.json(result);
    }

    // Batch Action: Auto-forward uncompleted past-due tasks to today
    if (body.action === "auto_forward") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const forwarded = await prisma.task.updateMany({
        where: {
          status: { not: "completed" },
          dueDate: { lt: today },
        },
        data: {
          dueDate: new Date(),
          status: "today",
        },
      });

      return NextResponse.json({ success: true, forwardedCount: forwarded.count });
    }

    const { id, status, isCompleted, kanbanColumn, isBigThree, dueDate, eisenhowerQuadrant, priority } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { objective: true },
    });
    if (!existingTask) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (kanbanColumn !== undefined) dataToUpdate.kanbanColumn = kanbanColumn;
    if (isBigThree !== undefined) dataToUpdate.isBigThree = isBigThree;
    if (eisenhowerQuadrant !== undefined) dataToUpdate.eisenhowerQuadrant = eisenhowerQuadrant;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (isCompleted !== undefined) {
      dataToUpdate.status = isCompleted ? "completed" : "today";
      dataToUpdate.completedAt = isCompleted ? new Date() : null;
      if (isCompleted) {
        dataToUpdate.kanbanColumn = "Done";
      } else if (existingTask.kanbanColumn === "Done" && kanbanColumn === undefined) {
        dataToUpdate.kanbanColumn = "Ready";
      }
    }

    const finalStatus = dataToUpdate.status !== undefined ? dataToUpdate.status : existingTask.status;
    const finalKanban = dataToUpdate.kanbanColumn !== undefined ? dataToUpdate.kanbanColumn : existingTask.kanbanColumn;
    const willBeCompleted = finalStatus === "completed" || finalKanban === "Done";
    const wasCompleted = existingTask.status === "completed" || existingTask.kanbanColumn === "Done";

    // 1. Goals Feedback Loop: When task is marked completed or uncompleted
    if (willBeCompleted && !wasCompleted && existingTask.objectiveId) {
      try {
        const obj = await prisma.objective.findUnique({
          where: { id: existingTask.objectiveId },
          include: { keyResults: true },
        });
        if (obj) {
          if (obj.keyResults && obj.keyResults.length > 0) {
            const firstKr = obj.keyResults[0];
            const span = firstKr.target - firstKr.baseline;
            const step = span > 0 ? Math.max(1, Math.round(span / 10)) : 1;
            const newKrVal = Math.min(firstKr.target, (firstKr.currentValue || 0) + step);
            const newKrProg = calculateProgress(firstKr.baseline, firstKr.target, newKrVal);

            await prisma.keyResult.update({
              where: { id: firstKr.id },
              data: { currentValue: newKrVal, progress: newKrProg },
            });

            const allKrs = await prisma.keyResult.findMany({ where: { objectiveId: obj.id } });
            const avgProg = Math.round(allKrs.reduce((acc, k) => acc + k.progress, 0) / (allKrs.length || 1));
            await prisma.objective.update({
              where: { id: obj.id },
              data: { progress: avgProg, currentValue: (obj.currentValue || 0) + 1 },
            });
          } else {
            const tgt = obj.targetValue || 100;
            const newCur = (obj.currentValue || 0) + 1;
            const newProg = calculateProgress(0, tgt, newCur);
            await prisma.objective.update({
              where: { id: obj.id },
              data: { currentValue: newCur, progress: newProg },
            });
          }
        }
      } catch (err) {
        console.error("Objective feedback loop error:", err);
      }
    } else if (!willBeCompleted && wasCompleted && existingTask.objectiveId) {
      try {
        const obj = await prisma.objective.findUnique({
          where: { id: existingTask.objectiveId },
          include: { keyResults: true },
        });
        if (obj) {
          if (obj.keyResults && obj.keyResults.length > 0) {
            const firstKr = obj.keyResults[0];
            const span = firstKr.target - firstKr.baseline;
            const step = span > 0 ? Math.max(1, Math.round(span / 10)) : 1;
            const floorKrVal = Math.min(firstKr.baseline, firstKr.target);
            const newKrVal = Math.max(floorKrVal, (firstKr.currentValue || 0) - step);
            const newKrProg = calculateProgress(firstKr.baseline, firstKr.target, newKrVal);

            await prisma.keyResult.update({
              where: { id: firstKr.id },
              data: { currentValue: newKrVal, progress: newKrProg },
            });

            const allKrs = await prisma.keyResult.findMany({ where: { objectiveId: obj.id } });
            const avgProg = Math.round(allKrs.reduce((acc, k) => acc + k.progress, 0) / (allKrs.length || 1));
            const newObjCur = Math.max(0, (obj.currentValue || 0) - 1);
            await prisma.objective.update({
              where: { id: obj.id },
              data: { progress: avgProg, currentValue: newObjCur },
            });
          } else {
            const tgt = obj.targetValue || 100;
            const newCur = Math.max(0, (obj.currentValue || 0) - 1);
            const newProg = calculateProgress(0, tgt, newCur);
            await prisma.objective.update({
              where: { id: obj.id },
              data: { currentValue: newCur, progress: newProg },
            });
          }
        }
      } catch (err) {
        console.error("Objective rollback error:", err);
      }
    }

    // 2. Big 3 Feedback Loop: When Big 3 task is completed
    const isBig3 = existingTask.isBigThree || isBigThree === true || dataToUpdate.isBigThree === true;
    if (isBig3) {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const existingReview = await prisma.dailyReview.findFirst({
          where: { date: { gte: startOfDay, lte: endOfDay } },
        });

        if (willBeCompleted && !wasCompleted) {
          if (existingReview) {
            await prisma.dailyReview.update({
              where: { id: existingReview.id },
              data: { big3Completed: Math.min(3, (existingReview.big3Completed || 0) + 1) },
            });
          } else {
            const noon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
            await prisma.dailyReview.create({
              data: {
                date: noon,
                big3Completed: 1,
                productivityScore: 8,
                mood: "متمرکز",
                energyPhysical: 8,
                energyEmotional: 8,
                energyMental: 8,
                energySpiritual: 8,
                deepWorkHours: 3.5,
              },
            });
          }
        } else if (!willBeCompleted && wasCompleted && existingReview && existingReview.big3Completed > 0) {
          await prisma.dailyReview.update({
            where: { id: existingReview.id },
            data: { big3Completed: Math.max(0, existingReview.big3Completed - 1) },
          });
        }
      } catch (err) {
        console.error("Big3 review feedback loop error:", err);
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: { area: true },
    });

    return NextResponse.json({ success: true, task });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
