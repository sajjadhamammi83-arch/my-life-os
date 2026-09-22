import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, type, description, costCenterName, accountId, counterparty } = body;

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return NextResponse.json({ success: false, error: "مبلغ باید بیشتر از صفر باشد" }, { status: 400 });
    }

    const costCenter = await prisma.costCenter.findFirst({
      where: { name: costCenterName || "شخصی" },
    });

    let account = null;
    if (accountId) {
      account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
    } else {
      account = await prisma.financialAccount.findFirst({
        where: costCenter ? { costCenterId: costCenter.id } : undefined,
      });
    }

    // Update account balance
    if (account) {
      if (type === "Income" || type === "Sale") {
        await prisma.financialAccount.update({
          where: { id: account.id },
          data: { balance: { increment: numAmount } },
        });
      } else if (type === "Expense" || type === "Purchase" || type === "OwnerWithdrawal") {
        await prisma.financialAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: numAmount } },
        });
      }
    }

    const tx = await prisma.transaction.create({
      data: {
        date: new Date(),
        amount: numAmount,
        type: type || "Expense",
        costCenterId: costCenter?.id,
        accountFromId: type === "Expense" || type === "Purchase" ? account?.id : undefined,
        accountToId: type === "Income" || type === "Sale" ? account?.id : undefined,
        counterparty: counterparty || undefined,
        description,
        reconciled: true,
      },
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
