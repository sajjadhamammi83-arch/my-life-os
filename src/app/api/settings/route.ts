import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, currency, weightUnit, calorieUnit, weekStartDay, theme } = body;

    const user = await prisma.user.findFirst();
    let updated;
    if (user) {
      updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || undefined,
          email: email || undefined,
          currency: currency || undefined,
          weightUnit: weightUnit || undefined,
          calorieUnit: calorieUnit || undefined,
          weekStartDay: weekStartDay || undefined,
          theme: theme || undefined,
        },
      });
    } else {
      updated = await prisma.user.create({
        data: {
          name: name || "کاربر Life OS",
          email: email || "user@lifeos.local",
          currency: currency || "تومان",
          weightUnit: weightUnit || "kg",
          calorieUnit: calorieUnit || "kcal",
          weekStartDay: weekStartDay || "saturday",
          theme: theme || "dark",
        },
      });
    }

    return NextResponse.json({ success: true, user: updated, message: "تنظیمات با موفقیت ذخیره شد" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
