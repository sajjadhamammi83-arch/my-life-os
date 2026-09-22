import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { type, title, amount, category, extra } = data;

    if (type === "task") {
      const area = await prisma.area.findFirst({ where: { name: category } });
      const task = await prisma.task.create({
        data: {
          title,
          areaId: area?.id,
          status: "inbox",
          workType: "Deep Work",
          priority: "medium",
          notes: extra || undefined,
        },
      });
      return NextResponse.json({ success: true, task });
    }

    if (type === "expense" || type === "income") {
      const costCenter = await prisma.costCenter.findFirst({ where: { name: category } });
      const account = await prisma.financialAccount.findFirst({
        where: costCenter ? { costCenterId: costCenter.id } : undefined,
      });

      const tx = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: Number(amount) || 0,
          type: type === "income" ? "Income" : "Expense",
          description: extra ? `${title} (${extra})` : title,
          costCenterId: costCenter?.id,
          accountFromId: type === "expense" ? account?.id : undefined,
          accountToId: type === "income" ? account?.id : undefined,
        },
      });
      return NextResponse.json({ success: true, tx });
    }

    if (type === "sale") {
      const costCenter = await prisma.costCenter.findFirst({ where: { name: category || "بوفه باشگاه" } });
      const account = await prisma.financialAccount.findFirst({
        where: costCenter ? { costCenterId: costCenter.id } : undefined,
      });

      const tx = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: Number(amount) || 0,
          type: "Sale",
          description: title,
          costCenterId: costCenter?.id,
          accountToId: account?.id,
        },
      });
      return NextResponse.json({ success: true, tx });
    }

    if (type === "note") {
      const area = await prisma.area.findFirst({ where: { name: category } });
      const note = await prisma.note.create({
        data: {
          title,
          content: extra || title,
          category: "ایده",
          areaId: area?.id,
        },
      });
      return NextResponse.json({ success: true, note });
    }

    if (type === "water") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingLog = await prisma.nutritionLog.findFirst({
        where: { date: { gte: today } },
      });

      const addWater = Number(amount) || 250;
      if (existingLog) {
        await prisma.nutritionLog.update({
          where: { id: existingLog.id },
          data: { waterMl: { increment: addWater } },
        });
      } else {
        await prisma.nutritionLog.create({
          data: {
            date: new Date(),
            waterMl: addWater,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (type === "weight") {
      const weightVal = Number(amount) || 0;
      if (weightVal > 0) {
        await prisma.bodyMeasurement.create({
          data: {
            date: new Date(),
            weight: weightVal,
            notes: title || "ثبت سریع وزن",
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: "Type received" });
  } catch (error: any) {
    console.error("Quick capture error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
