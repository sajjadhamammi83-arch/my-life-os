import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const costCenterId = searchParams.get("costCenterId");

    const whereCC = costCenterId && costCenterId !== "all" ? { costCenterId } : {};

    const [
      costCenters,
      accounts,
      transactions,
      fixedExpenses,
      cheques,
      cashRegisters,
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
      prisma.shopCashRegister.findMany({
        where: whereCC,
        include: { costCenter: true },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

    // Financial Metrics Calculation
    const totalLiquidBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    const expensesList = transactions.filter((t) => t.type === "Expense");
    const incomesList = transactions.filter((t) => t.type === "Income" || t.type === "Sale");

    const totalExpenses = expensesList.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalIncomes = incomesList.reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingChequesPayable = cheques
      .filter((c) => c.status === "PENDING" && c.chequeType === "PAYABLE")
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const pendingChequesReceivable = cheques
      .filter((c) => c.status === "PENDING" && c.chequeType === "RECEIVABLE")
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const pendingFixedExpenses = fixedExpenses
      .filter((f) => f.status === "PENDING")
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const summary = {
      totalLiquidBalance,
      totalIncomes,
      totalExpenses,
      netProfit: totalIncomes - totalExpenses,
      pendingChequesPayable,
      pendingChequesReceivable,
      pendingFixedExpenses,
      totalAccountsCount: accounts.length,
      unreconciledRegistersCount: cashRegisters.filter((cr) => !cr.reconciled || cr.difference !== 0).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      costCenters,
      accounts,
      expenses: expensesList,
      transactions,
      fixedExpenses,
      cheques,
      cashRegisters,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    // 1. ثبت هزینه جاری (Expense)
    if (type === "expense") {
      const {
        title,
        amount,
        categoryName,
        costCenterId,
        bankAccountId,
        paymentMethod,
        date,
        description,
      } = body;

      if (!title || !amount) {
        return NextResponse.json({ success: false, error: "عنوان و مبلغ هزینه الزامی است" }, { status: 400 });
      }

      let cat = null;
      if (categoryName) {
        cat = await prisma.financialCategory.findFirst({ where: { name: categoryName } });
        if (!cat) {
          cat = await prisma.financialCategory.create({
            data: { name: categoryName, type: "expense" },
          });
        }
      }

      const numAmount = Number(amount);

      const tx = await prisma.transaction.create({
        data: {
          date: date ? new Date(date) : new Date(),
          amount: numAmount,
          type: "Expense",
          accountFromId: bankAccountId || null,
          categoryId: cat?.id || null,
          costCenterId: costCenterId || null,
          paymentMethod: paymentMethod || "کارت / انتقال",
          description: description ? `${title}: ${description}` : title,
          counterparty: body.counterparty || null,
          reconciled: true,
        },
      });

      // Deduct from bank account if specified
      if (bankAccountId) {
        await prisma.financialAccount.update({
          where: { id: bankAccountId },
          data: { balance: { decrement: numAmount } },
        });
      }

      return NextResponse.json({ success: true, transaction: tx });
    }

    // 2. ثبت هزینه ثابت ماهانه (Fixed Expense)
    if (type === "fixed_expense") {
      const { title, category, amount, dueDayShamsi, reminderDaysBefore, costCenterId, note } = body;

      if (!title || !amount) {
        return NextResponse.json({ success: false, error: "عنوان و مبلغ هزینه ثابت الزامی است" }, { status: 400 });
      }

      const fixed = await prisma.fixedExpense.create({
        data: {
          title: title.trim(),
          category: category || "سایر",
          amount: Number(amount),
          dueDayShamsi: Number(dueDayShamsi) || 1,
          reminderDaysBefore: Number(reminderDaysBefore) || 3,
          status: "PENDING",
          costCenterId: costCenterId || null,
          note: note || null,
        },
      });

      return NextResponse.json({ success: true, fixedExpense: fixed });
    }

    // 3. ثبت چک صیادی (Cheque)
    if (type === "cheque") {
      const {
        chequeNumber,
        bankName,
        amount,
        dueDate,
        dueDateShamsi,
        payeeOrPayer,
        chequeType,
        bankAccountId,
        costCenterId,
        note,
      } = body;

      if (!chequeNumber || !amount || !payeeOrPayer) {
        return NextResponse.json({ success: false, error: "شماره چک، مبلغ و طرف حساب الزامی هستند" }, { status: 400 });
      }

      const cheque = await prisma.cheque.create({
        data: {
          chequeNumber: chequeNumber.trim(),
          bankName: bankName || "بانک ملت",
          amount: Number(amount),
          dueDate: dueDate ? new Date(dueDate) : new Date(),
          dueDateShamsi: dueDateShamsi || null,
          payeeOrPayer: payeeOrPayer.trim(),
          chequeType: chequeType || "PAYABLE",
          status: "PENDING",
          bankAccountId: bankAccountId || null,
          costCenterId: costCenterId || null,
          note: note || null,
        },
      });

      return NextResponse.json({ success: true, cheque });
    }

    // 4. ثبت حساب بانکی جدید (Bank Account)
    if (type === "bank_account") {
      const { name, bankName, accountNumber, cardNumber, balance, costCenterId, accountType } = body;

      if (!name) {
        return NextResponse.json({ success: false, error: "نام حساب الزامی است" }, { status: 400 });
      }

      const account = await prisma.financialAccount.create({
        data: {
          name: name.trim(),
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          cardNumber: cardNumber || null,
          type: accountType || "Bank",
          balance: Number(balance) || 0,
          costCenterId: costCenterId || null,
        },
      });

      return NextResponse.json({ success: true, account });
    }

    // 5. انتقال وجه بین حساب‌ها (Transfer)
    if (type === "transfer") {
      const { fromAccountId, toAccountId, amount, description } = body;
      const numAmount = Number(amount);

      if (!fromAccountId || !toAccountId || numAmount <= 0) {
        return NextResponse.json({ success: false, error: "حساب مبدأ، مقصد و مبلغ معتبر الزامی است" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: numAmount } },
        }),
        prisma.financialAccount.update({
          where: { id: toAccountId },
          data: { balance: { increment: numAmount } },
        }),
        prisma.transaction.create({
          data: {
            date: new Date(),
            amount: numAmount,
            type: "Transfer",
            accountFromId: fromAccountId,
            accountToId: toAccountId,
            description: description || "انتقال وجه بین حساب‌ها",
            reconciled: true,
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    // 6. بستن دخل روزانه (Shop Cash Register)
    if (type === "cash_register") {
      const {
        costCenterId,
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
      const e = Number(expensesCash) || 0;
      const w = Number(withdrawalsCash) || 0;
      const expected = o + s - e - w;
      const actual = Number(actualClosingCash) || 0;
      const diff = actual - expected;

      const register = await prisma.shopCashRegister.create({
        data: {
          date: new Date(),
          costCenterId: costCenterId || null,
          openingCash: o,
          salesCash: s,
          posSalesCash: Number(posSalesCash) || 0,
          physicalSalesCash: Number(physicalSalesCash) || 0,
          expensesCash: e,
          withdrawalsCash: w,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: diff,
          reconciled: diff === 0,
          notes: notes || null,
        },
      });

      return NextResponse.json({ success: true, register });
    }

    return NextResponse.json({ success: false, error: "نوع درخواست نامعتبر است" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. تغییر وضعیت چک (وصول، برگشت، ابطال، معوق)
    if (action === "update_cheque_status") {
      const { chequeId, newStatus, bankAccountId } = body;
      const chq = await prisma.cheque.findUnique({ where: { id: chequeId } });
      if (!chq) return NextResponse.json({ success: false, error: "چک یافت نشد" }, { status: 404 });

      // If clearing cheque, automatically update bank account balance & record transaction
      if (newStatus === "CLEARED" && chq.status !== "CLEARED") {
        const targetBankId = bankAccountId || chq.bankAccountId;
        if (targetBankId) {
          if (chq.chequeType === "RECEIVABLE") {
            await prisma.financialAccount.update({
              where: { id: targetBankId },
              data: { balance: { increment: chq.amount } },
            });
            await prisma.transaction.create({
              data: {
                date: new Date(),
                amount: chq.amount,
                type: "Income",
                accountToId: targetBankId,
                costCenterId: chq.costCenterId,
                description: `وصول چک دریافتی شماره ${chq.chequeNumber} (${chq.payeeOrPayer})`,
                counterparty: chq.payeeOrPayer,
                reconciled: true,
              },
            });
          } else {
            await prisma.financialAccount.update({
              where: { id: targetBankId },
              data: { balance: { decrement: chq.amount } },
            });
            await prisma.transaction.create({
              data: {
                date: new Date(),
                amount: chq.amount,
                type: "Expense",
                accountFromId: targetBankId,
                costCenterId: chq.costCenterId,
                description: `وصول و پاس‌شدن چک پرداختی شماره ${chq.chequeNumber} (${chq.payeeOrPayer})`,
                counterparty: chq.payeeOrPayer,
                reconciled: true,
              },
            });
          }
        }
      }

      const updated = await prisma.cheque.update({
        where: { id: chequeId },
        data: {
          status: newStatus,
          clearedAt: newStatus === "CLEARED" ? new Date() : null,
          bankAccountId: bankAccountId || chq.bankAccountId,
        },
      });

      return NextResponse.json({ success: true, cheque: updated });
    }

    // 2. پرداخت هزینه ثابت ماهانه (Pay Fixed Expense)
    if (action === "pay_fixed_expense") {
      const { fixedExpenseId, bankAccountId } = body;
      const fixed = await prisma.fixedExpense.findUnique({ where: { id: fixedExpenseId } });
      if (!fixed) return NextResponse.json({ success: false, error: "هزینه ثابت یافت نشد" }, { status: 404 });

      // Deduct from bank if supplied
      if (bankAccountId) {
        await prisma.financialAccount.update({
          where: { id: bankAccountId },
          data: { balance: { decrement: fixed.amount } },
        });
      }

      // Record transaction
      await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: fixed.amount,
          type: "Expense",
          accountFromId: bankAccountId || null,
          costCenterId: fixed.costCenterId,
          description: `پرداخت هزینه ثابت: ${fixed.title} (${fixed.category})`,
          reconciled: true,
        },
      });

      // Update status to PAID
      const updated = await prisma.fixedExpense.update({
        where: { id: fixedExpenseId },
        data: { status: "PAID", lastPaidDate: new Date() },
      });

      return NextResponse.json({ success: true, fixedExpense: updated });
    }

    // 3. ویرایش موجودی حساب بانکی
    if (action === "update_account_balance") {
      const { accountId, balance } = body;
      const updated = await prisma.financialAccount.update({
        where: { id: accountId },
        data: { balance: Number(balance) },
      });
      return NextResponse.json({ success: true, account: updated });
    }

    return NextResponse.json({ success: false, error: "اقدام نامعتبر است" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const id = searchParams.get("id");

    if (!entity || !id) {
      return NextResponse.json({ success: false, error: "نوع موجودیت و شناسه الزامی است" }, { status: 400 });
    }

    if (entity === "fixed_expense") {
      await prisma.fixedExpense.delete({ where: { id } });
    } else if (entity === "cheque") {
      await prisma.cheque.delete({ where: { id } });
    } else if (entity === "expense" || entity === "transaction") {
      await prisma.transaction.delete({ where: { id } });
    } else if (entity === "bank_account") {
      await prisma.financialAccount.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
