import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [projects, areas, objectives] = await Promise.all([
      prisma.project.findMany({
        include: {
          milestones: { orderBy: { createdAt: "asc" } },
          area: true,
          objective: true,
          tasks: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.area.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.objective.findMany({
        select: { id: true, title: true, priority: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ success: true, projects, areas, objectives });
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
      objectiveId,
      owner,
      status,
      priority,
      startDate,
      deadline,
      budget,
      actualCost,
      progress,
      health,
      expectedOutput,
      notes,
      projectId,
      targetDate,
      dueDate,
      initialMilestones,
    } = body;

    // Handle single milestone creation
    if (type === "milestone") {
      const milestone = await prisma.milestone.create({
        data: {
          projectId,
          title: title.trim(),
          dueDate: targetDate || dueDate ? new Date(targetDate || dueDate) : new Date(Date.now() + 14 * 86400000),
          status: "pending",
        },
      });
      return NextResponse.json({ success: true, milestone });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "عنوان پروژه الزامی است" }, { status: 400 });
    }

    // Create rich project
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        areaId: areaId || null,
        objectiveId: objectiveId || null,
        owner: owner ? owner.trim() : "کاربر",
        status: status || "active",
        priority: priority || "high",
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: Number(budget) || 0,
        actualCost: Number(actualCost) || 0,
        progress: Number(progress) || 0,
        health: health || "on_track",
        expectedOutput: expectedOutput ? expectedOutput.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    // Create any initial milestones if provided
    if (initialMilestones && Array.isArray(initialMilestones) && initialMilestones.length > 0) {
      for (const m of initialMilestones) {
        const mTitle = typeof m === "string" ? m.trim() : m?.title?.trim();
        if (mTitle) {
          await prisma.milestone.create({
            data: {
              projectId: project.id,
              title: mTitle,
              dueDate: m.dueDate ? new Date(m.dueDate) : null,
              status: "pending",
            },
          });
        }
      }
    }

    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: { milestones: true, area: true, objective: true, tasks: true },
    });

    return NextResponse.json({ success: true, project: fullProject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      milestoneId,
      deleteMilestoneId,
      isReached,
      status,
      progress,
      actualCost,
      budget,
      title,
      description,
      areaId,
      objectiveId,
      owner,
      priority,
      startDate,
      deadline,
      health,
      expectedOutput,
      notes,
    } = body;

    // Delete single milestone
    if (deleteMilestoneId) {
      await prisma.milestone.delete({ where: { id: deleteMilestoneId } });
      return NextResponse.json({ success: true, deleted: true });
    }

    // Update single milestone status / title
    if (milestoneId) {
      const dataToUpdate: any = {};
      if (isReached !== undefined || status !== undefined) {
        dataToUpdate.status = isReached || status === "completed" ? "completed" : "pending";
      }
      if (title !== undefined) dataToUpdate.title = title.trim();

      const updatedM = await prisma.milestone.update({
        where: { id: milestoneId },
        data: dataToUpdate,
      });
      return NextResponse.json({ success: true, milestone: updatedM });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه پروژه الزامی است" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (areaId !== undefined) dataToUpdate.areaId = areaId || null;
    if (objectiveId !== undefined) dataToUpdate.objectiveId = objectiveId || null;
    if (owner !== undefined) dataToUpdate.owner = owner.trim();
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (health !== undefined) dataToUpdate.health = health;
    if (progress !== undefined) dataToUpdate.progress = Number(progress);
    if (actualCost !== undefined) dataToUpdate.actualCost = Number(actualCost);
    if (budget !== undefined) dataToUpdate.budget = Number(budget);
    if (expectedOutput !== undefined) dataToUpdate.expectedOutput = expectedOutput ? expectedOutput.trim() : null;
    if (notes !== undefined) dataToUpdate.notes = notes ? notes.trim() : null;
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (deadline !== undefined) dataToUpdate.deadline = deadline ? new Date(deadline) : null;

    const project = await prisma.project.update({
      where: { id },
      data: dataToUpdate,
      include: { milestones: true, area: true, objective: true, tasks: true },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });

    await prisma.milestone.deleteMany({ where: { projectId: id } });
    await prisma.task.updateMany({ where: { projectId: id }, data: { projectId: null } });
    await prisma.calendarBlock.updateMany({ where: { projectId: id }, data: { projectId: null } });
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
