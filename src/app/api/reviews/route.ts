import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const [reviews, questions] = await Promise.all([
      prisma.dailyReview.findMany({
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.reviewQuestion.findMany({
        orderBy: { order: "asc" },
      }),
    ]);

    // Calculate today's automated real-world statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tonight = new Date();
    tonight.setHours(23, 59, 59, 999);

    const [todayTasks, todayBlocks, todayRegisters] = await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { status: "completed", completedAt: { gte: today, lte: tonight } },
            { status: "today" },
            { isBigThree: true },
          ],
        },
      }),
      prisma.calendarBlock.findMany({
        where: {
          start: { gte: today, lte: tonight },
        },
      }),
      prisma.shopCashRegister.findMany({
        where: {
          date: { gte: today, lte: tonight },
        },
        include: { costCenter: true },
      }),
    ]);

    const big3Tasks = todayTasks.filter((t) => t.isBigThree);
    const big3Completed = big3Tasks.filter((t) => t.status === "completed" || t.kanbanColumn === "Done").length;
    const totalCompletedTasks = todayTasks.filter((t) => t.status === "completed" || t.kanbanColumn === "Done").length;

    // Deep work hours calculation
    const deepWorkMinutes = todayBlocks
      .filter((b) => b.type === "Deep Work" && (b.status === "completed" || b.actualDuration > 0))
      .reduce((acc, b) => acc + (b.actualDuration || b.plannedDuration || 60), 0);

    const automatedTodayStats = {
      big3Total: big3Tasks.length,
      big3Completed,
      totalCompletedTasks,
      deepWorkHours: Number((deepWorkMinutes / 60).toFixed(1)),
      todayCashRegisters: todayRegisters.map((cr) => ({
        costCenter: cr.costCenter?.name,
        difference: cr.difference,
        reconciled: cr.reconciled,
        sales: cr.salesCash,
      })),
    };

    return NextResponse.json({
      success: true,
      reviews,
      questions,
      automatedTodayStats,
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
      // For creating custom question
      question,
      category,
      placeholder,
    } = body;

    // 1. Create / Add Custom Review Question
    if (type === "question") {
      if (!question || !question.trim()) {
        return NextResponse.json({ success: false, error: "متن پرسش الزامی است" }, { status: 400 });
      }
      const count = await prisma.reviewQuestion.count();
      const newQ = await prisma.reviewQuestion.create({
        data: {
          question: question.trim(),
          category: category || "عمومی",
          placeholder: placeholder || null,
          order: count,
          isActive: true,
        },
      });
      return NextResponse.json({ success: true, question: newQ });
    }

    // 2. Create or Update Daily Review
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

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, id, question, category, placeholder, isActive, order, reorderList } = body;

    // Batch Reorder Questions
    if (action === "reorder_questions" && reorderList && Array.isArray(reorderList)) {
      for (let i = 0; i < reorderList.length; i++) {
        await prisma.reviewQuestion.update({
          where: { id: reorderList[i] },
          data: { order: i },
        });
      }
      const updated = await prisma.reviewQuestion.findMany({ orderBy: { order: "asc" } });
      return NextResponse.json({ success: true, questions: updated });
    }

    // Update single question
    if (action === "update_question" && id) {
      const dataToUpdate: any = {};
      if (question !== undefined) dataToUpdate.question = question.trim();
      if (category !== undefined) dataToUpdate.category = category;
      if (placeholder !== undefined) dataToUpdate.placeholder = placeholder;
      if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
      if (order !== undefined) dataToUpdate.order = Number(order);

      const updated = await prisma.reviewQuestion.update({
        where: { id },
        data: dataToUpdate,
      });
      return NextResponse.json({ success: true, question: updated });
    }

    // Edit Review by ID directly
    if (id) {
      const updatedReview = await prisma.dailyReview.update({
        where: { id },
        data: body,
      });
      return NextResponse.json({ success: true, review: updatedReview });
    }

    return NextResponse.json({ success: false, error: "اقدام نامعتبر است" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });
    }

    if (type === "question") {
      await prisma.reviewQuestion.delete({ where: { id } });
    } else {
      await prisma.dailyReview.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
