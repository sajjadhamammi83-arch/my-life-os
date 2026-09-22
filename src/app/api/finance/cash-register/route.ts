import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const costCenterId = searchParams.get("costCenterId");

    const where: any = {};
    if (costCenterId) {
      where.costCenterId = costCenterId;
    }

    const registers = await prisma.shopCashRegister.findMany({
      where,
      orderBy: { date: "desc" },
      take: 30,
      include: { costCenter: true },
    });

    const latest = registers[0] || null;

    return NextResponse.json({ success: true, registers, latest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { openingCash, salesCash, expensesCash, withdrawalsCash, actualClosingCash, costCenterId, notes } = body;

    const opening = Number(openingCash) || 0;
    const sales = Number(salesCash) || 0;
    const expenses = Number(expensesCash) || 0;
    const withdrawals = Number(withdrawalsCash) || 0;
    const actual = Number(actualClosingCash) || 0;

    const expected = opening + sales - expenses - withdrawals;
    const diff = actual - expected;

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const whereClause: any = { date: today };
    if (costCenterId) {
      whereClause.costCenterId = costCenterId;
    }

    const existing = await prisma.shopCashRegister.findFirst({
      where: whereClause,
    });

    let entry;
    if (existing) {
      entry = await prisma.shopCashRegister.update({
        where: { id: existing.id },
        data: {
          openingCash: opening,
          salesCash: sales,
          expensesCash: expenses,
          withdrawalsCash: withdrawals,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: diff,
          reconciled: diff === 0,
          costCenterId: costCenterId || existing.costCenterId,
          notes: notes || undefined,
        },
      });
    } else {
      entry = await prisma.shopCashRegister.create({
        data: {
          date: today,
          openingCash: opening,
          salesCash: sales,
          expensesCash: expenses,
          withdrawalsCash: withdrawals,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: diff,
          reconciled: diff === 0,
          costCenterId: costCenterId || undefined,
          notes: notes || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, entry, difference: diff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
