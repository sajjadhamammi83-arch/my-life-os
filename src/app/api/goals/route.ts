import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateProgress } from "@/lib/utils";

export async function GET() {
  try {
    const objectives = await prisma.objective.findMany({
      include: {
        keyResults: true,
        area: true,
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const cycles = await prisma.cycle90Day.findMany({ where: { status: "active" } });

    // Detect missed goal tasks from yesterday or earlier
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uncompletedGoalTasks = await prisma.task.findMany({
      where: {
        objectiveId: { not: null },
        status: { not: "completed" },
        dueDate: { lt: today },
      },
      include: { objective: true, area: true },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      objectives,
      activeCycle: cycles[0],
      uncompletedGoalTasks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      title,
      description,
      areaId,
      cycleId,
      priority,
      confidence,
      startDate,
      deadline,
      dailyAction,
      dailyDuration,
      preferredTimeSlot,
      weeklyDays,
      targetMetric,
      targetValue,
      currentValue,
      metricUnit,
      strategyNotes,
      potentialObstacles,
      autoSchedule,
      metric,
      baseline,
      target,
      unit,
      objectiveId,
    } = body;

    if (type === "key_result") {
      const base = Number(baseline) || 0;
      const tgt = Number(target) || 100;
      const initialVal = base;
      const progress = calculateProgress(base, tgt, initialVal);

      const kr = await prisma.keyResult.create({
        data: {
          objectiveId,
          metric,
          baseline: base,
          target: tgt,
          currentValue: initialVal,
          unit: unit || "",
          progress,
        },
      });

      return NextResponse.json({ success: true, keyResult: kr });
    }

    // Create Objective
    let cId = cycleId;
    if (!cId) {
      const activeCycle = await prisma.cycle90Day.findFirst({ where: { status: "active" } });
      cId = activeCycle?.id;
    }

    const curVal = currentValue !== undefined ? Number(currentValue) : 0;
    const tgtVal = targetValue !== undefined ? Number(targetValue) : 100;
    const initialProgress = calculateProgress(0, tgtVal, curVal);

    const obj = await prisma.objective.create({
      data: {
        title,
        description: description || undefined,
        areaId: areaId || undefined,
        cycleId: cId,
        priority: priority || "high",
        confidence: Number(confidence) || 80,
        startDate: startDate ? new Date(startDate) : new Date(),
        deadline: deadline ? new Date(deadline) : undefined,
        status: "in_progress",
        progress: initialProgress,
        dailyAction: dailyAction || undefined,
        dailyDuration: Number(dailyDuration) || 60,
        preferredTimeSlot: preferredTimeSlot || "کار عمیق صبح (۰۸:۳۰ - ۱۰:۳۰)",
        weeklyDays: weeklyDays || "همه روزها",
        targetMetric: targetMetric || undefined,
        targetValue: targetValue !== undefined ? Number(targetValue) : undefined,
        currentValue: currentValue !== undefined ? Number(currentValue) : undefined,
        metricUnit: metricUnit || undefined,
        strategyNotes: strategyNotes || undefined,
        potentialObstacles: potentialObstacles || undefined,
        autoSchedule: autoSchedule !== false,
      },
      include: { area: true, keyResults: true },
    });

    // If key metric specified, create initial KeyResult
    if (targetMetric) {
      await prisma.keyResult.create({
        data: {
          objectiveId: obj.id,
          metric: targetMetric,
          baseline: 0,
          target: tgtVal,
          currentValue: curVal,
          unit: metricUnit || "واحد",
          progress: initialProgress,
        },
      });
    }

    // If dailyAction is defined and autoSchedule is true, immediately dispatch today's task
    if (dailyAction && autoSchedule !== false) {
      const today = new Date();
      await prisma.task.create({
        data: {
          title: `🎯 [هدف: ${title}] ${dailyAction}`,
          objectiveId: obj.id,
          areaId: areaId || undefined,
          workType: preferredTimeSlot?.includes("عمیق") ? "Deep Work" : "Deep Work",
          eisenhowerQuadrant: priority === "urgent" ? "Q1" : "Q2",
          priority: priority === "urgent" ? "urgent" : "high",
          isBigThree: true,
          status: "today",
          dueDate: today,
          estimatedMinutes: Number(dailyDuration) || 60,
          notes: strategyNotes ? `استراتژی: ${strategyNotes}` : undefined,
        },
      });
    }

    return NextResponse.json({ success: true, objective: obj });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { keyResultId, newValue, objectiveId, title, description, confidence, priority, status, updates } = body;

    if (keyResultId) {
      const kr = await prisma.keyResult.findUnique({ where: { id: keyResultId } });
      if (!kr) return NextResponse.json({ success: false, error: "KR not found" }, { status: 404 });

      const val = Number(newValue);
      const progress = calculateProgress(kr.baseline, kr.target, val);

      const updatedKr = await prisma.keyResult.update({
        where: { id: keyResultId },
        data: { currentValue: val, progress },
      });

      const allKrs = await prisma.keyResult.findMany({ where: { objectiveId: kr.objectiveId } });
      const avgProgress = Math.round(allKrs.reduce((sum, k) => sum + k.progress, 0) / (allKrs.length || 1));

      await prisma.objective.update({
        where: { id: kr.objectiveId },
        data: { progress: avgProgress },
      });

      return NextResponse.json({ success: true, keyResult: updatedKr, objectiveProgress: avgProgress });
    }

    if (objectiveId) {
      const updateData: any = updates || {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (confidence !== undefined) updateData.confidence = Number(confidence);
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (body.areaId !== undefined) updateData.areaId = body.areaId;
      if (body.dailyAction !== undefined) updateData.dailyAction = body.dailyAction;
      if (body.dailyDuration !== undefined) updateData.dailyDuration = Number(body.dailyDuration);
      if (body.preferredTimeSlot !== undefined) updateData.preferredTimeSlot = body.preferredTimeSlot;
      if (body.weeklyDays !== undefined) updateData.weeklyDays = body.weeklyDays;
      if (body.targetMetric !== undefined) updateData.targetMetric = body.targetMetric;
      if (body.targetValue !== undefined) updateData.targetValue = Number(body.targetValue);
      if (body.currentValue !== undefined) updateData.currentValue = Number(body.currentValue);
      if (body.metricUnit !== undefined) updateData.metricUnit = body.metricUnit;
      if (body.strategyNotes !== undefined) updateData.strategyNotes = body.strategyNotes;
      if (body.potentialObstacles !== undefined) updateData.potentialObstacles = body.potentialObstacles;
      if (body.autoSchedule !== undefined) updateData.autoSchedule = Boolean(body.autoSchedule);
      if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
      if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;

      const updatedObj = await prisma.objective.update({
        where: { id: objectiveId },
        data: updateData,
        include: { area: true, keyResults: true },
      });

      return NextResponse.json({ success: true, objective: updatedObj });
    }

    return NextResponse.json({ success: false, error: "شناسه یافت نشد" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const objectiveId = searchParams.get("objectiveId");
    const keyResultId = searchParams.get("keyResultId");

    if (keyResultId) {
      await prisma.keyResult.delete({ where: { id: keyResultId } });
      return NextResponse.json({ success: true });
    }

    if (objectiveId) {
      await prisma.keyResult.deleteMany({ where: { objectiveId } });
      await prisma.task.updateMany({
        where: { objectiveId },
        data: { objectiveId: null },
      });
      await prisma.objective.delete({ where: { id: objectiveId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
