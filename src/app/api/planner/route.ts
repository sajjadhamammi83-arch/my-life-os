import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let whereClause: any = {};
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    if (dateParam !== null) {
      if (!dateParam.trim()) {
        return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
      }

      const parsed = new Date(dateParam);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
      }

      const parts = dateParam.split("-");

      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2].slice(0, 2), 10);

        rangeStart = new Date(y, m, d, 0, 0, 0, 0);
        rangeEnd = new Date(y, m, d, 23, 59, 59, 999);
      } else {
        rangeStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
      }

      if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return NextResponse.json({ success: false, error: "فرمت تاریخ ارسالی نامعتبر است" }, { status: 400 });
      }

      whereClause = {
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
      };
    }

    const blocks = await prisma.calendarBlock.findMany({
      where: whereClause,
      orderBy: { start: "asc" },
      include: { area: true, project: true },
    });

    if (rangeStart && rangeEnd) {
      const PERSIAN_DAY_MAP: Record<number, string> = {
        0: "یکشنبه",
        1: "دوشنبه",
        2: "سه‌شنبه",
        3: "چهارشنبه",
        4: "پنج‌شنبه",
        5: "جمعه",
        6: "شنبه",
      };

      const dayName = PERSIAN_DAY_MAP[rangeStart.getDay()];
      const [courses, events] = await Promise.all([
        prisma.universityCourse.findMany({
          where: {
            daysOfWeek: { contains: dayName },
          },
        }),
        prisma.universityEvent.findMany({
          where: {
            dueDate: { gte: rangeStart, lte: rangeEnd },
          },
          include: { course: true },
        }),
      ]);

      const consolidatedBlocks: any[] = [...blocks];

      // 1. Add recurring university course classes if not already present
      for (const c of courses) {
        if (c.startTime) {
          const [sh, sm] = c.startTime.split(":").map(Number);
          let eh = sh + 2;
          let em = sm || 0;
          if (c.endTime && c.endTime.includes(":")) {
            const [h, m] = c.endTime.split(":").map(Number);
            eh = h;
            em = m;
          }

          const cStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), sh, sm || 0, 0, 0);
          const cEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), eh, em || 0, 0, 0);

          const exists = consolidatedBlocks.some((b) => {
            const bStart = new Date(b.start).getTime();
            const bEnd = new Date(b.end).getTime();
            return (
              b.title.includes(c.title) ||
              (b.type === "Learning" && bStart < cEnd.getTime() && bEnd > cStart.getTime())
            );
          });

          if (!exists) {
            consolidatedBlocks.push({
              id: `uni-course-${c.id}-${rangeStart.toISOString().slice(0, 10)}`,
              title: `[دانشگاه] کلاس ${c.title}`,
              type: "Learning",
              start: cStart,
              end: cEnd,
              plannedDuration: Math.max(30, Math.round((cEnd.getTime() - cStart.getTime()) / 60000)),
              actualDuration: 0,
              status: "scheduled",
              notes: `استاد: ${c.instructor} | محل: ${c.location || "دانشگاه"}`,
              area: { name: "دانشگاه و تحصیلات", color: "#3b82f6" },
              project: null,
            });
          }
        }
      }

      // 2. Add university events if not already present
      for (const ev of events) {
        let evH = 10;
        let evM = 0;
        if (ev.time && ev.time.includes(":")) {
          const [h, m] = ev.time.split(":").map(Number);
          if (!isNaN(h)) evH = h;
          if (!isNaN(evM)) evM = m;
        }

        const evStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), evH, evM, 0, 0);
        const evEnd = new Date(evStart.getTime() + 90 * 60000);

        const exists = consolidatedBlocks.some((b) => {
          return b.title.includes(ev.title);
        });

        if (!exists) {
          consolidatedBlocks.push({
            id: `uni-event-${ev.id}`,
            title: `[دانشگاه: ${ev.course?.title || "درس"}] ${ev.type}: ${ev.title}`,
            type: "Learning",
            start: evStart,
            end: evEnd,
            plannedDuration: 90,
            actualDuration: 0,
            status: "scheduled",
            notes: `رویداد دانشگاهی: ${ev.type} | اولویت: ${ev.priority}`,
            area: { name: "دانشگاه و تحصیلات", color: "#3b82f6" },
            project: null,
          });
        }
      }

      consolidatedBlocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      return NextResponse.json({ success: true, blocks: consolidatedBlocks });
    }

    return NextResponse.json({ success: true, blocks });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      blockType,
      type,
      date: targetDateStr,
      startTime,
      endTime,
      start: startIso,
      end: endIso,
      notes,
      areaId,
      projectId,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, error: "عنوان بلوک زمانی الزامی است" }, { status: 400 });
    }

    let start: Date;
    let end: Date;

    if (startIso && endIso) {
      start = new Date(startIso);
      end = new Date(endIso);
    } else {
      let baseDate = new Date();
      if (targetDateStr) {
        const [y, m, d] = targetDateStr.split("-").map(Number);
        if (y && m && d) {
          baseDate = new Date(y, m - 1, d);
        } else {
          const parsed = new Date(targetDateStr);
          if (!isNaN(parsed.getTime())) {
            baseDate = parsed;
          }
        }
      }

      start = new Date(baseDate);
      end = new Date(baseDate);

      let startH = 9;
      let startM = 0;
      let endH = 10;
      let endM = 0;

      if (startTime && startTime.includes(":")) {
        const [sh, sm] = startTime.split(":");
        startH = parseInt(sh, 10);
        startM = parseInt(sm, 10);
      }

      if (endTime && endTime.includes(":")) {
        const [eh, em] = endTime.split(":");
        endH = parseInt(eh, 10);
        endM = parseInt(em, 10);
      } else {
        endH = startH + 1;
        endM = startM;
      }

      start.setHours(startH, startM, 0, 0);
      end.setHours(endH, endM, 0, 0);
    }

    const durationMin = Math.max(15, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));

    const block = await prisma.calendarBlock.create({
      data: {
        title: title.trim(),
        type: type || blockType || "Deep Work",
        start,
        end,
        plannedDuration: durationMin,
        notes: notes || undefined,
        areaId: areaId || undefined,
        projectId: projectId || undefined,
      },
    });

    return NextResponse.json({ success: true, block });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });

    await prisma.calendarBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
