import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const [todayReview, recentReviews, questions] = await Promise.all([
      prisma.dailyReview.findFirst({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.dailyReview.findMany({
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.reviewQuestion.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
    ]);

    // Calculate automated stats for the target day
    const [dayTasks, dayBlocks, dayRegisters] = await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { status: "completed", completedAt: { gte: startOfDay, lte: endOfDay } },
            { status: "today" },
            { isBigThree: true },
          ],
        },
      }),
      prisma.calendarBlock.findMany({
        where: {
          start: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.shopCashRegister.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: { costCenter: true },
      }),
    ]);

    const big3Tasks = dayTasks.filter((t) => t.isBigThree);
    const big3Completed = big3Tasks.filter((t) => t.status === "completed" || t.kanbanColumn === "Done").length;
    const totalCompletedTasks = dayTasks.filter((t) => t.status === "completed" || t.kanbanColumn === "Done").length;

    const deepWorkMinutes = dayBlocks
      .filter((b) => b.type === "Deep Work" && (b.status === "completed" || b.actualDuration > 0))
      .reduce((acc, b) => acc + (b.actualDuration || b.plannedDuration || 60), 0);

    const automatedStats = {
      big3Total: big3Tasks.length,
      big3Completed,
      totalCompletedTasks,
      deepWorkHours: Number((deepWorkMinutes / 60).toFixed(1)),
      cashRegisters: dayRegisters.map((cr) => ({
        costCenter: cr.costCenter?.name,
        difference: cr.difference,
        reconciled: cr.reconciled,
        sales: cr.salesCash,
      })),
    };

    return NextResponse.json({
      success: true,
      review: todayReview,
      reviews: recentReviews,
      questions,
      automatedStats,
    });
  } catch (error: any) {
    console.error("GET /api/reviews/daily error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load daily review" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      date,
      big3Completed,
      productivityScore,
      mood,
      deepWorkHours,
      whatWentWell,
      whatFailed,
      bottleneck,
      lessonsLearned,
      tomorrowChanges,
      gratitude,
      keyInsight,
      customAnswers,
      energyPhysical,
      energyEmotional,
      energyMental,
      energySpiritual,
    } = body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(12, 0, 0, 0);

    const reviewData = {
      big3Completed: Number(big3Completed) || 0,
      productivityScore: Number(productivityScore) || 8,
      mood: mood || "متمرکز",
      deepWorkHours: Number(deepWorkHours) || 0,
      whatWentWell: whatWentWell || null,
      whatFailed: whatFailed || null,
      bottleneck: bottleneck || null,
      lessonsLearned: lessonsLearned || null,
      tomorrowChanges: tomorrowChanges || null,
      gratitude: gratitude || null,
      keyInsight: keyInsight || null,
      customAnswers: customAnswers ? (typeof customAnswers === "string" ? customAnswers : JSON.stringify(customAnswers)) : null,
      energyPhysical: Number(energyPhysical) || 7,
      energyEmotional: Number(energyEmotional) || 7,
      energyMental: Number(energyMental) || 7,
      energySpiritual: Number(energySpiritual) || 7,
    };

    let review;
    if (id) {
      review = await prisma.dailyReview.update({
        where: { id },
        data: reviewData,
      });
    } else {
      const existing = await prisma.dailyReview.findFirst({ where: { date: targetDate } });
      if (existing) {
        review = await prisma.dailyReview.update({
          where: { id: existing.id },
          data: reviewData,
        });
      } else {
        review = await prisma.dailyReview.create({
          data: {
            date: targetDate,
            ...reviewData,
          },
        });
      }
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reviews/daily error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save daily review" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "شناسه ارزیابی الزامی است" },
        { status: 400 }
      );
    }

    const review = await prisma.dailyReview.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("PATCH /api/reviews/daily error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update daily review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "شناسه ارزیابی الزامی است" },
        { status: 400 }
      );
    }
    await prisma.dailyReview.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/reviews/daily error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete daily review" },
      { status: 500 }
    );
  }
}

