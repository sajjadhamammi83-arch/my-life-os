import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { sortOrder: "asc" },
      include: { projects: true, tasks: true },
    });
    return NextResponse.json({ success: true, areas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, color, purpose, standard, reviewFrequency, sortOrder } = body;

    const area = await prisma.area.create({
      data: {
        name,
        icon: icon || "Activity",
        color: color || "#3b82f6",
        purpose: purpose || "",
        standard: standard || "",
        reviewFrequency: reviewFrequency || "هفتگی",
        sortOrder: Number(sortOrder) || 10,
      },
    });

    return NextResponse.json({ success: true, area });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, color, purpose, standard, reviewFrequency } = body;

    const updated = await prisma.area.update({
      where: { id },
      data: {
        name: name || undefined,
        color: color || undefined,
        purpose: purpose || undefined,
        standard: standard || undefined,
        reviewFrequency: reviewFrequency || undefined,
      },
    });

    return NextResponse.json({ success: true, area: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "شناسه حوزه الزامی است" }, { status: 400 });

    await prisma.area.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
