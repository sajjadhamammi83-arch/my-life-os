import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const costCenterId = searchParams.get("costCenterId");

    const whereCC = costCenterId && costCenterId !== "all" ? { costCenterId } : {};

    const [
      costCenters,
      accounts,
      transactions,
      cashRegisters,
      fixedExpenses,
      cheques,
    ] = await Promise.all([
      prisma.costCenter.findMany({ orderBy: { code: "asc" } }),
      prisma.financialAccount.findMany({
        where: whereCC,
        include: { costCenter: true },
        orderBy: { balance: "desc" },
      }),
      prisma.transaction.findMany({
        where: {
          ...whereCC,
          type: { in: ["Expense", "Income", "Transfer", "Sale"] },
        },
        include: {
          accountFrom: true,
          accountTo: true,
          costCenter: true,
          category: true,
        },
        orderBy: { date: "desc" },
        take: 50,
      }),
      prisma.shopCashRegister.findMany({
        where: whereCC,
        include: { costCenter: true },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.fixedExpense.findMany({
        where: whereCC,
        include: { costCenter: true },
        orderBy: { dueDayShamsi: "asc" },
      }),
      prisma.cheque.findMany({
        where: whereCC,
        include: { costCenter: true, bankAccount: true },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    // Financial Metrics Calculation
    const totalLiquidBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalIncomes = transactions
      .filter((t) => t.type === "Income" || t.type === "Sale")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncomes - totalExpenses;

    const pendingChequesPayable = cheques
      .filter((c) => c.status === "PENDING" && c.chequeType === "PAYABLE")
      .reduce((sum, c) => sum + c.amount, 0);

    const pendingChequesReceivable = cheques
      .filter((c) => c.status === "PENDING" && c.chequeType === "RECEIVABLE")
      .reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalLiquidBalance,
        totalIncomes,
        totalExpenses,
        netProfit,
        pendingChequesPayable,
        pendingChequesReceivable,
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
      },
      costCenters,
      accounts,
      transactions,
      cashRegisters,
      fixedExpenses,
      cheques,
    });
  } catch (error: any) {
    console.error("GET /api/finance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load financial data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      amount,
      title,
      description,
      costCenterId,
      bankAccountId,
      accountFromId,
      accountToId,
      categoryName,
      date,
      counterparty,
    } = body;

    const numAmount = Number(amount);

    // 1. Handling Transactions (Expense, Income, Sale)
    if (!type || type === "Expense" || type === "expense" || type === "Income" || type === "income" || type === "Sale" || type === "sale") {
      if (!amount || numAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "مبلغ معتبر الزامی است" },
          { status: 400 }
        );
      }

      let cat = null;
      if (categoryName) {
        cat = await prisma.financialCategory.findFirst({ where: { name: categoryName } });
        if (!cat) {
          cat = await prisma.financialCategory.create({
            data: {
              name: categoryName,
              type: type?.toLowerCase() === "income" || type?.toLowerCase() === "sale" ? "income" : "expense",
            },
          });
        }
      }

      const txType =
        type?.toLowerCase() === "income"
          ? "Income"
          : type?.toLowerCase() === "sale"
          ? "Sale"
          : "Expense";

      const fromAcc = bankAccountId || accountFromId || null;

      const tx = await prisma.transaction.create({
        data: {
          date: date ? new Date(date) : new Date(),
          amount: numAmount,
          type: txType,
          accountFromId: fromAcc,
          accountToId: accountToId || null,
          categoryId: cat?.id || null,
          costCenterId: costCenterId || null,
          description: description || title || "تراکنش مالی",
          counterparty: counterparty || null,
          reconciled: true,
        },
      });

      if (fromAcc && txType === "Expense") {
        await prisma.financialAccount.update({
          where: { id: fromAcc },
          data: { balance: { decrement: numAmount } },
        });
      } else if (fromAcc && (txType === "Income" || txType === "Sale")) {
        await prisma.financialAccount.update({
          where: { id: fromAcc },
          data: { balance: { increment: numAmount } },
        });
      }

      return NextResponse.json({ success: true, transaction: tx }, { status: 201 });
    }

    // 2. Handling Cheque creation
    if (type === "cheque") {
      const { chequeNumber, bankName, dueDate, payeeOrPayer, chequeType, note } = body;
      const cheque = await prisma.cheque.create({
        data: {
          chequeNumber: (chequeNumber || "CHQ-" + Date.now()).trim(),
          bankName: bankName || "بانک ملت",
          amount: numAmount,
          dueDate: dueDate ? new Date(dueDate) : new Date(),
          payeeOrPayer: (payeeOrPayer || "نامشخص").trim(),
          chequeType: chequeType || "PAYABLE",
          status: "PENDING",
          bankAccountId: bankAccountId || null,
          costCenterId: costCenterId || null,
          note: note || null,
        },
      });
      return NextResponse.json({ success: true, cheque }, { status: 201 });
    }

    // 3. Handling Cash Register
    if (type === "cash_register") {
      const {
        openingCash,
        salesCash,
        posSalesCash,
        physicalSalesCash,
        expensesCash,
        withdrawalsCash,
        actualClosingCash,
        notes,
      } = body;

      const o = Number(openingCash) || 0;
      const s = Number(salesCash) || 0;
      const pos = Number(posSalesCash) || 0;
      const phys = Number(physicalSalesCash) || 0;
      const e = Number(expensesCash) || 0;
      const w = Number(withdrawalsCash) || 0;
      const actual = Number(actualClosingCash) || 0;
      const expected = o + s - e - w;
      const diff = actual - expected;

      const registerDate = date ? new Date(date) : new Date();
      registerDate.setHours(12, 0, 0, 0);

      const cashRegister = await prisma.shopCashRegister.upsert({
        where: {
          date_costCenterId: {
            date: registerDate,
            costCenterId: costCenterId || null,
          },
        },
        update: {
          openingCash: o,
          salesCash: s,
          posSalesCash: pos,
          physicalSalesCash: phys,
          expensesCash: e,
          withdrawalsCash: w,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: diff,
          reconciled: Math.abs(diff) < 1000,
          notes: notes || null,
        },
        create: {
          date: registerDate,
          costCenterId: costCenterId || null,
          openingCash: o,
          salesCash: s,
          posSalesCash: pos,
          physicalSalesCash: phys,
          expensesCash: e,
          withdrawalsCash: w,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: diff,
          reconciled: Math.abs(diff) < 1000,
          notes: notes || null,
        },
      });

      return NextResponse.json({ success: true, cashRegister }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: `نوع عملیات مالی ناشناخته: ${type}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/finance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process financial transaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, type, entity, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });
    }
    const targetType = entity || type;
    if (targetType === "cheque") {
      const cheque = await prisma.cheque.update({ where: { id }, data: updates });
      return NextResponse.json({ success: true, cheque });
    } else if (targetType === "cash_register") {
      const register = await prisma.shopCashRegister.update({ where: { id }, data: updates });
      return NextResponse.json({ success: true, register });
    } else {
      const transaction = await prisma.transaction.update({ where: { id }, data: updates });
      return NextResponse.json({ success: true, transaction });
    }
  } catch (error: any) {
    console.error("PATCH /api/finance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update financial record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity") || searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });
    }

    if (entity === "cheque") {
      await prisma.cheque.delete({ where: { id } });
    } else if (entity === "cash_register") {
      await prisma.shopCashRegister.delete({ where: { id } });
    } else {
      // Default to transaction
      await prisma.transaction.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/finance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete financial record" },
      { status: 500 }
    );
  }
}

