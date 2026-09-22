import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [courses, books, skills] = await Promise.all([
      prisma.universityCourse.findMany({
        include: {
          assignments: true,
          exams: true,
          events: { orderBy: { dueDate: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.learningSkill.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // Aggregate all events with course info for easy listing
    const allEvents = courses
      .flatMap((course) =>
        course.events.map((ev) => ({
          ...ev,
          courseTitle: course.title,
          courseCode: course.code,
          courseInstructor: course.instructor,
          courseLocation: course.location,
        }))
      )
      .sort((a, b) => {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return timeA - timeB;
      });

    return NextResponse.json({ success: true, courses, books, skills, allEvents });
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
      code,
      instructor,
      credits,
      semester,
      targetGrade,
      actualGrade,
      daysOfWeek,
      startTime,
      endTime,
      location,
      notes,
      courseId,
      dueDate,
      time,
      weight,
      priority,
      status,
      eventType,
      author,
      category,
      pages,
      currentPage,
      rating,
      currentLevel,
      targetLevel,
      curriculum,
      practiceProject,
      hoursInvested,
      targetHours,
    } = body;

    // 1. Course Creation
    if (type === "course") {
      if (!title) {
        return NextResponse.json({ success: false, error: "عنوان درس الزامی است" }, { status: 400 });
      }
      const course = await prisma.universityCourse.create({
        data: {
          code: code || `CS-${Math.floor(100 + Math.random() * 900)}`,
          title: title.trim(),
          instructor: instructor ? instructor.trim() : "نامشخص",
          credits: Number(credits) || 3,
          semester: semester || "نیم‌سال جاری",
          targetGrade: Number(targetGrade) || 18,
          actualGrade: actualGrade ? Number(actualGrade) : null,
          deepWorkHours: 0,
          daysOfWeek: daysOfWeek || null,
          startTime: startTime || null,
          endTime: endTime || null,
          location: location || null,
          notes: notes || null,
        },
      });

      // Synchronize Course schedule to CalendarBlock records
      if (course.daysOfWeek && course.startTime) {
        try {
          const PERSIAN_DAY_MAP: Record<string, number> = {
            "یکشنبه": 0,
            "دوشنبه": 1,
            "سه‌شنبه": 2,
            "چهارشنبه": 3,
            "پنج‌شنبه": 4,
            "جمعه": 5,
            "شنبه": 6,
          };

          const matchedDays: number[] = [];
          for (const [dayName, dayNum] of Object.entries(PERSIAN_DAY_MAP)) {
            if (course.daysOfWeek.includes(dayName)) {
              matchedDays.push(dayNum);
            }
          }

          if (matchedDays.length > 0) {
            const uniArea = await prisma.area.findFirst({
              where: { name: { contains: "دانشگاه" } },
            });

            const [startH, startM] = course.startTime.split(":").map(Number);
            let endH = startH + 2;
            let endM = startM || 0;
            if (course.endTime && course.endTime.includes(":")) {
              const [eh, em] = course.endTime.split(":").map(Number);
              endH = eh;
              endM = em;
            }

            const now = new Date();
            for (let d = 0; d < 28; d++) {
              const dateCursor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
              if (matchedDays.includes(dateCursor.getDay())) {
                const blockStart = new Date(dateCursor.getFullYear(), dateCursor.getMonth(), dateCursor.getDate(), startH, startM || 0, 0, 0);
                const blockEnd = new Date(dateCursor.getFullYear(), dateCursor.getMonth(), dateCursor.getDate(), endH, endM || 0, 0, 0);
                const duration = Math.round((blockEnd.getTime() - blockStart.getTime()) / 60000);

                await prisma.calendarBlock.create({
                  data: {
                    title: `[دانشگاه] کلاس ${course.title}`,
                    type: "Learning",
                    start: blockStart,
                    end: blockEnd,
                    plannedDuration: duration > 0 ? duration : 90,
                    areaId: uniArea?.id || undefined,
                    notes: `استاد: ${course.instructor} | محل: ${course.location || "دانشکده"}`,
                  },
                });
              }
            }
          }
        } catch (calErr) {
          console.error("Course calendar sync error:", calErr);
        }
      }

      return NextResponse.json({ success: true, course });
    }

    // 2. University Event (Assignment, Exam, Presentation, Project, Quiz...)
    if (type === "event") {
      if (!title) {
        return NextResponse.json({ success: false, error: "عنوان رویداد الزامی است" }, { status: 400 });
      }

      let cId = courseId;
      if (!cId) {
        const first = await prisma.universityCourse.findFirst();
        cId = first?.id;
      }
      if (!cId) {
        return NextResponse.json({ success: false, error: "لطفاً ابتدا حداقل یک درس تعریف کنید" }, { status: 400 });
      }

      const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 86400000);

      const event = await prisma.universityEvent.create({
        data: {
          courseId: cId,
          title: title.trim(),
          type: eventType || "تکلیف",
          dueDate: parsedDueDate,
          time: time || "10:00",
          location: location || null,
          weight: Number(weight) || 0,
          priority: priority || "medium",
          status: status || "pending",
          notes: notes || null,
        },
      });

      // Synchronize to Task & CalendarBlock
      try {
        const course = await prisma.universityCourse.findUnique({ where: { id: cId } });
        const uniArea = await prisma.area.findFirst({
          where: { name: { contains: "دانشگاه" } },
        });

        const isExamOrPres = event.type.includes("امتحان") || event.type.includes("ارائه");
        const today = new Date();
        const isToday =
          parsedDueDate.getFullYear() === today.getFullYear() &&
          parsedDueDate.getMonth() === today.getMonth() &&
          parsedDueDate.getDate() === today.getDate();

        // 1. Create Synchronized Task
        await prisma.task.create({
          data: {
            title: `[دانشگاه: ${course?.title || "درس"}] ${event.type}: ${event.title}`,
            areaId: uniArea?.id || null,
            priority: isExamOrPres ? "urgent" : event.priority === "high" ? "urgent" : "medium",
            eisenhowerQuadrant: isExamOrPres ? "Q1" : event.priority === "high" ? "Q1" : "Q2",
            workType: "Learning",
            estimatedMinutes: 90,
            isBigThree: isExamOrPres,
            status: isToday ? "today" : "next",
            kanbanColumn: "Ready",
            dueDate: parsedDueDate,
            notes: notes || `رویداد ثبت‌شده از ماژول دانشگاه (${event.type})`,
          },
        });

        // 2. Automatically create CalendarBlock on parsedDueDate
        let startH = 10;
        let startM = 0;
        if (event.time && event.time.includes(":")) {
          const [sh, sm] = event.time.split(":").map(Number);
          if (!isNaN(sh)) startH = sh;
          if (!isNaN(sm)) startM = sm;
        }

        const blockStart = new Date(parsedDueDate.getFullYear(), parsedDueDate.getMonth(), parsedDueDate.getDate(), startH, startM, 0, 0);
        const blockEnd = new Date(blockStart.getTime() + 90 * 60000); // 90 mins

        await prisma.calendarBlock.create({
          data: {
            title: `[دانشگاه] ${course?.title || "درس"}: ${event.title}`,
            type: "Learning",
            start: blockStart,
            end: blockEnd,
            plannedDuration: 90,
            areaId: uniArea?.id || undefined,
            notes: `رویداد دانشگاهی: ${event.type} | محل: ${event.location || course?.location || "دانشگاه"}`,
          },
        });
      } catch (e) {
        console.error("Task/Calendar sync error:", e);
      }

      return NextResponse.json({ success: true, event });
    }


    // 3. Book Creation
    if (type === "book") {
      if (!title) {
        return NextResponse.json({ success: false, error: "عنوان کتاب الزامی است" }, { status: 400 });
      }

      const book = await prisma.book.create({
        data: {
          title: title.trim(),
          author: author ? author.trim() : "نامشخص",
          category: category || "توسعه فردی",
          pages: Number(pages) || 200,
          currentPage: Number(currentPage) || 0,
          status: status || "Learning",
          rating: Number(rating) || 5,
          notes: notes || null,
        },
      });
      return NextResponse.json({ success: true, book });
    }

    // 4. Learning Skill Creation
    if (type === "skill") {
      if (!title) {
        return NextResponse.json({ success: false, error: "عنوان مهارت الزامی است" }, { status: 400 });
      }

      const skill = await prisma.learningSkill.create({
        data: {
          title: title.trim(),
          area: category || "فناوری و نرم‌افزار",
          currentLevel: currentLevel || "مقدماتی",
          targetLevel: targetLevel || "پیشرفته",
          curriculum: curriculum || null,
          practiceProject: practiceProject || null,
          hoursInvested: Number(hoursInvested) || 0,
          targetHours: Number(targetHours) || 50,
        },
      });
      return NextResponse.json({ success: true, skill });
    }

    return NextResponse.json({ success: false, error: "نوع درخواست نامعتبر است" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { courseId, eventId, bookId, skillId, updates, status, currentPage } = body;

    // 1. Update Course
    if (courseId) {
      const course = await prisma.universityCourse.update({
        where: { id: courseId },
        data: updates || {},
      });
      return NextResponse.json({ success: true, course });
    }

    // 2. Update Event
    if (eventId) {
      const dataToUpdate: any = updates ? { ...updates } : {};
      if (status !== undefined) dataToUpdate.status = status;
      if (dataToUpdate.dueDate) dataToUpdate.dueDate = new Date(dataToUpdate.dueDate);

      const event = await prisma.universityEvent.update({
        where: { id: eventId },
        data: dataToUpdate,
      });
      return NextResponse.json({ success: true, event });
    }

    // 3. Update Book
    if (bookId) {
      const dataToUpdate: any = updates ? { ...updates } : {};
      if (currentPage !== undefined) {
        dataToUpdate.currentPage = Number(currentPage);
        const b = await prisma.book.findUnique({ where: { id: bookId } });
        if (b && dataToUpdate.currentPage >= b.pages) {
          dataToUpdate.status = "Completed";
        }
      }

      const book = await prisma.book.update({
        where: { id: bookId },
        data: dataToUpdate,
      });
      return NextResponse.json({ success: true, book });
    }

    // 4. Update Skill
    if (skillId) {
      const skill = await prisma.learningSkill.update({
        where: { id: skillId },
        data: updates || {},
      });
      return NextResponse.json({ success: true, skill });
    }

    return NextResponse.json({ success: false, error: "شناسه برای ویرایش مشخص نیست" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });

    if (type === "course") {
      await prisma.universityAssignment.deleteMany({ where: { courseId: id } });
      await prisma.universityExam.deleteMany({ where: { courseId: id } });
      await prisma.universityEvent.deleteMany({ where: { courseId: id } });
      await prisma.universityCourse.delete({ where: { id } });
    } else if (type === "event") {
      await prisma.universityEvent.delete({ where: { id } });
    } else if (type === "book") {
      await prisma.book.delete({ where: { id } });
    } else if (type === "skill") {
      await prisma.learningSkill.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
