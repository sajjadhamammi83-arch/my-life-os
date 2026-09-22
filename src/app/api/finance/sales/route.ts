import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, unitPrice, costCenterName, customerName, notes } = body;

    const qty = Number(quantity) || 1;
    const price = Number(unitPrice) || 0;
    const total = qty * price;

    // 1. Fetch product
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, error: "کالای مورد نظر یافت نشد" }, { status: 404 });
    }

    if (product.stock < qty) {
      return NextResponse.json({
        success: false,
        error: `موجودی ناکافی است. موجودی فعلی: ${product.stock} عدد`,
      }, { status: 400 });
    }

    // 2. Reduce inventory
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: qty } },
    });

    // 3. Record Inventory Movement
    await prisma.inventoryMovement.create({
      data: {
        productId,
        type: "sale",
        quantity: -qty,
        unitPrice: price,
        referenceType: "invoice",
        notes: `فروش ${qty} عدد ${product.name}`,
      },
    });

    // 4. Find cost center & account
    const costCenter = await prisma.costCenter.findFirst({
      where: { name: costCenterName || "بوفه باشگاه" },
    });

    const account = await prisma.financialAccount.findFirst({
      where: costCenter ? { costCenterId: costCenter.id } : undefined,
    });

    // 5. Update financial account balance
    if (account) {
      await prisma.financialAccount.update({
        where: { id: account.id },
        data: { balance: { increment: total } },
      });
    }

    // 6. Record transaction
    const tx = await prisma.transaction.create({
      data: {
        date: new Date(),
        amount: total,
        type: "Sale",
        accountToId: account?.id,
        costCenterId: costCenter?.id,
        counterparty: customerName || "مشتری حضوری",
        description: `فروش ${qty} عدد ${product.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "فروش با موفقیت ثبت و موجودی انبار کسر گردید",
      product: updatedProduct,
      transaction: tx,
    });
  } catch (error: any) {
    console.error("Sale registration error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
