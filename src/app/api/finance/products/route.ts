import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, name, category, costCenterName, buyPrice, sellPrice, stock, minimumStock, supplier } = body;

    const costCenter = await prisma.costCenter.findFirst({
      where: { name: costCenterName || "بوفه باشگاه" },
    });

    const product = await prisma.product.create({
      data: {
        sku: sku || `PRD-${Date.now().toString().slice(-4)}`,
        name,
        category: category || "عمومی",
        costCenterId: costCenter?.id,
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        stock: Number(stock) || 0,
        minimumStock: Number(minimumStock) || 5,
        supplier: supplier || undefined,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stockChange, buyPrice, sellPrice } = body;

    const dataToUpdate: any = {};
    if (stockChange !== undefined) {
      dataToUpdate.stock = { increment: Number(stockChange) };
    }
    if (buyPrice !== undefined) dataToUpdate.buyPrice = Number(buyPrice);
    if (sellPrice !== undefined) dataToUpdate.sellPrice = Number(sellPrice);

    const product = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
