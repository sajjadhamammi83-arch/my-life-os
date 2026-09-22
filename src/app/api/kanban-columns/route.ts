import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let columns = await prisma.kanbanColumn.findMany({
      orderBy: { order: "asc" },
    });

    if (columns.length === 0) {
      const initial = [
        { key: "Backlog", title: "بک‌لاگ (Backlog)", limit: null, order: 0, color: "#6b7280" },
        { key: "Ready", title: "آماده اقدام (Ready)", limit: 5, order: 1, color: "#3b82f6" },
        { key: "Doing", title: "در حال انجام (Doing)", limit: 1, order: 2, color: "#f59e0b" },
        { key: "Review", title: "بررسی و تست (Review)", limit: 3, order: 3, color: "#8b5cf6" },
        { key: "Done", title: "تکمیل شده (Done)", limit: null, order: 4, color: "#10b981" },
      ];
      for (const item of initial) {
        await prisma.kanbanColumn.upsert({ where: { key: item.key }, update: {}, create: item });
      }
      columns = await prisma.kanbanColumn.findMany({ orderBy: { order: "asc" } });
    }

    return NextResponse.json({ success: true, columns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, limit, color } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "عنوان ستون الزامی است" }, { status: 400 });
    }

    const rawKey = body.key ? body.key.trim() : ("custom_" + Date.now());
    const count = await prisma.kanbanColumn.count();

    const column = await prisma.kanbanColumn.create({
      data: {
        key: rawKey,
        title: title.trim(),
        limit: limit !== undefined && limit !== null && limit !== "" ? Number(limit) : null,
        color: color || "#6366f1",
        order: count,
      },
    });

    return NextResponse.json({ success: true, column });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, title, limit, color, order, reorderList } = body;

    if (reorderList && Array.isArray(reorderList)) {
      for (let i = 0; i < reorderList.length; i++) {
        await prisma.kanbanColumn.update({
          where: { id: reorderList[i] },
          data: { order: i },
        });
      }
      const updated = await prisma.kanbanColumn.findMany({ orderBy: { order: "asc" } });
      return NextResponse.json({ success: true, columns: updated });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه ستون الزامی است" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (limit !== undefined) {
      dataToUpdate.limit = limit !== null && limit !== "" ? Number(limit) : null;
    }
    if (color !== undefined) dataToUpdate.color = color;
    if (order !== undefined) dataToUpdate.order = Number(order);

    const column = await prisma.kanbanColumn.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, column });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه ستون الزامی است" }, { status: 400 });
    }

    const col = await prisma.kanbanColumn.findUnique({ where: { id } });
    if (!col) {
      return NextResponse.json({ success: false, error: "ستون یافت نشد" }, { status: 404 });
    }

    await prisma.task.updateMany({
      where: { kanbanColumn: col.key },
      data: { kanbanColumn: "Backlog" },
    });

    await prisma.kanbanColumn.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
