import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPersianDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    // Calculate tomorrow based on local system date
    const tomorrowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const tomorrowStart = new Date(tomorrowLocal.getFullYear(), tomorrowLocal.getMonth(), tomorrowLocal.getDate(), 0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowLocal.getFullYear(), tomorrowLocal.getMonth(), tomorrowLocal.getDate(), 23, 59, 59, 999);

    const yyyy = tomorrowLocal.getFullYear();
    const mm = String(tomorrowLocal.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrowLocal.getDate()).padStart(2, "0");
    const tomorrowDateStr = `${yyyy}-${mm}-${dd}`;

    // Strictly enforce the 24-hour window for tomorrow (from 00:00:00.000 to 23:59:59.999 local time)
    const rangeStart = tomorrowStart;
    const rangeEnd = tomorrowEnd;

    // Format Persian date for tomorrow (e.g. "یکشنبه ۱۶ شهریور")
    const tomorrowPersianDate = formatPersianDate(tomorrowStart, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: undefined,
    });

    // Fetch calendar blocks for tomorrow
    const blocks = await prisma.calendarBlock.findMany({
      where: {
        OR: [
          {
            start: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          {
            end: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
        ],
      },
      orderBy: { start: "asc" },
    });

    // Fetch tasks due tomorrow (or scheduled for tomorrow, incomplete)
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: "completed" },
        OR: [
          {
            dueDate: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          {
            scheduledStart: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
        ],
      },
      include: { area: true, project: true },
      orderBy: { priority: "asc" },
    });

    // Fetch workouts scheduled for tomorrow
    const workouts = await prisma.workout.findMany({
      where: {
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fetch university events due tomorrow (assignments, exams, presentations, quizzes)
    const universityEvents = await prisma.universityEvent.findMany({
      where: {
        dueDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        status: { not: "completed" },
      },
      include: { course: true },
      orderBy: { dueDate: "asc" },
    });

    // Fetch pending cheques due tomorrow
    const cheques = await prisma.cheque.findMany({
      where: {
        dueDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        status: "PENDING",
      },
      include: { bankAccount: true, costCenter: true },
      orderBy: { dueDate: "asc" },
    });

    // Fetch university exams scheduled for tomorrow
    const exams = await prisma.universityExam.findMany({
      where: {
        examDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: { course: true },
      orderBy: { examDate: "asc" },
    });

    // Check for weekly scheduled classes on tomorrow's Persian weekday
    const tomorrowWeekday = new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(tomorrowStart);
    const allCourses = await prisma.universityCourse.findMany();
    const tomorrowClasses = allCourses.filter(
      (c) => c.daysOfWeek && c.daysOfWeek.includes(tomorrowWeekday)
    );

    // Format blocks with timeFormatted
    const formattedBlocks = blocks.map((b) => {
      const s = new Date(b.start).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      const e = new Date(b.end).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      return {
        id: b.id,
        title: b.title,
        type: b.type,
        start: b.start.toISOString(),
        end: b.end.toISOString(),
        timeFormatted: `${s} - ${e}`,
        notes: b.notes || undefined,
      };
    });

    // Add tomorrow's university classes to blocks if not already present
    tomorrowClasses.forEach((c) => {
      const alreadyHasBlock = formattedBlocks.some((b) => b.title.includes(c.title));
      if (!alreadyHasBlock) {
        const timeDisplay = c.startTime && c.endTime ? `${c.startTime} - ${c.endTime}` : "ساعت مقرر";
        formattedBlocks.push({
          id: `univ-class-${c.id}`,
          title: `[کلاس دانشگاه] ${c.title} (${c.code}) - ${c.location || "دانشگاه"}`,
          type: "کلاس دانشگاه",
          start: tomorrowStart.toISOString(),
          end: tomorrowEnd.toISOString(),
          timeFormatted: timeDisplay,
          notes: `استاد: ${c.instructor || "نامشخص"} | محل برگزاری: ${c.location || "کلاس مشخص نشده"}`,
        });
      }
    });

    // Format tasks with isBigThree and area
    const formattedTasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      isBigThree: Boolean(t.isBigThree),
      dueDate: t.dueDate ? t.dueDate.toISOString() : "",
      workType: t.workType,
      area: t.area ? { name: t.area.name } : undefined,
    }));

    // Ensure university events are represented in tasks if not already covered
    universityEvents.forEach((ev) => {
      const alreadyInTasks = formattedTasks.some((t) => t.title.includes(ev.title));
      if (!alreadyInTasks) {
        formattedTasks.push({
          id: `univ-ev-${ev.id}`,
          title: `[رویداد دانشگاه: ${ev.type}] ${ev.title} (${ev.course?.title || ""})`,
          priority: ev.priority === "high" ? "urgent" : "medium",
          isBigThree: ev.type.includes("امتحان") || ev.type.includes("ارائه"),
          dueDate: ev.dueDate ? ev.dueDate.toISOString() : tomorrowStart.toISOString(),
          workType: "دانشگاه",
          area: { name: `مکان: ${ev.location || ev.course?.location || "دانشگاه"}` },
        });
      }
    });

    // Format workouts with durationMinutes
    const formattedWorkouts = workouts.map((w) => ({
      id: w.id,
      title: w.title,
      durationMinutes: w.durationMinutes,
      name: w.title,
      duration: w.durationMinutes,
    }));

    // Format cheques
    const formattedCheques = cheques.map((c) => ({
      id: c.id,
      chequeNumber: c.chequeNumber,
      bankName: c.bankName,
      amount: c.amount,
      dueDate: c.dueDate.toISOString(),
      dueDateShamsi: c.dueDateShamsi,
      payeeOrPayer: c.payeeOrPayer,
      chequeType: c.chequeType,
      status: c.status,
      bankAccount: c.bankAccount ? { name: c.bankAccount.name, bankName: c.bankAccount.bankName } : undefined,
      costCenter: c.costCenter ? { name: c.costCenter.name, code: c.costCenter.code } : undefined,
      note: c.note,
    }));

    // Format exams
    const formattedExams = exams.map((e) => ({
      id: e.id,
      title: e.title,
      examDate: e.examDate.toISOString(),
      timeFormatted: new Date(e.examDate).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      room: e.room || "نامشخص",
      weight: e.weight,
      score: e.score,
      course: e.course ? {
        id: e.course.id,
        title: e.course.title,
        code: e.course.code,
        instructor: e.course.instructor,
        location: e.course.location,
      } : undefined,
    }));

    const totalItems =
      formattedBlocks.length +
      formattedTasks.length +
      formattedWorkouts.length +
      formattedCheques.length +
      formattedExams.length;

    const summary = {
      totalItems,
      blocksCount: formattedBlocks.length,
      tasksCount: formattedTasks.length,
      workoutsCount: formattedWorkouts.length,
      universityClassesCount: tomorrowClasses.length,
      universityEventsCount: universityEvents.length,
      chequesCount: formattedCheques.length,
      examsCount: formattedExams.length,
    };

    return NextResponse.json({
      success: true,
      tomorrowDate: tomorrowDateStr,
      tomorrowDateIso: tomorrowStart.toISOString(),
      tomorrowPersianDate,
      summary,
      blocks: formattedBlocks,
      tasks: formattedTasks,
      workouts: formattedWorkouts,
      cheques: formattedCheques,
      exams: formattedExams,
      universityClasses: tomorrowClasses,
      universityEvents,
      reminders: {
        blocks: formattedBlocks,
        tasks: formattedTasks.map((t) => ({
          ...t,
          area: t.area?.name || "عمومی",
        })),
        workouts: formattedWorkouts.map((w) => ({
          ...w,
          duration: w.durationMinutes,
          name: w.title,
        })),
        cheques: formattedCheques,
        exams: formattedExams,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reminders/tomorrow error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
