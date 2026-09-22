import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let whereClause: any = {};

    if (dateParam !== null && dateParam.trim()) {
      const parts = dateParam.split("-");
      let rangeStart: Date;
      let rangeEnd: Date;

      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2].slice(0, 2), 10);

        rangeStart = new Date(y, m, d, 0, 0, 0, 0);
        rangeEnd = new Date(y, m, d, 23, 59, 59, 999);
      } else {
        const parsed = new Date(dateParam);
        rangeStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
      }

      whereClause = {
        OR: [
          { start: { gte: rangeStart, lte: rangeEnd } },
          { end: { gte: rangeStart, lte: rangeEnd } },
        ],
      };
    } else if (startDateParam && endDateParam) {
      whereClause = {
        OR: [
          { start: { gte: new Date(startDateParam), lte: new Date(endDateParam) } },
          { end: { gte: new Date(startDateParam), lte: new Date(endDateParam) } },
        ],
      };
    }

    const blocks = await prisma.calendarBlock.findMany({
      where: whereClause,
      orderBy: { start: "asc" },
      include: { area: true, project: true },
    });

    const formattedBlocks = blocks.map((b) => {
      const s = new Date(b.start).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      const e = new Date(b.end).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      return {
        ...b,
        startIso: b.start.toISOString(),
        endIso: b.end.toISOString(),
        timeFormatted: `${s} - ${e}`,
      };
    });

    return NextResponse.json({ success: true, blocks: formattedBlocks });
  } catch (error: any) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load calendar blocks" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: "عنوان بلوک زمانی الزامی است" },
        { status: 400 }
      );
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
      include: { area: true, project: true },
    });

    return NextResponse.json({ success: true, block }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create calendar block" },
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
        { success: false, error: "شناسه بلوک الزامی است" },
        { status: 400 }
      );
    }

    await prisma.calendarBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete calendar block" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, title, type, blockType, start, end, plannedDuration, actualDuration, status, notes } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه بلوک الزامی است" }, { status: 400 });
    }
    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (type !== undefined || blockType !== undefined) dataToUpdate.type = type || blockType;
    if (start !== undefined) dataToUpdate.start = new Date(start);
    if (end !== undefined) dataToUpdate.end = new Date(end);
    if (plannedDuration !== undefined) dataToUpdate.plannedDuration = Number(plannedDuration);
    if (actualDuration !== undefined) dataToUpdate.actualDuration = Number(actualDuration);
    if (status !== undefined) dataToUpdate.status = status;
    if (notes !== undefined) dataToUpdate.notes = notes;

    const block = await prisma.calendarBlock.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json({ success: true, block });
  } catch (error: any) {
    console.error("PATCH /api/calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update calendar block" },
      { status: 500 }
    );
  }
}

