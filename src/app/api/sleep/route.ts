import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSleepEfficiency } from "@/lib/utils";

export async function GET() {
  try {
    const sleepLogs = await prisma.sleepLog.findMany({
      orderBy: { date: "desc" },
      take: 14,
    });

    const latest = sleepLogs[0] || null;

    // Calculate rolling 7-day average efficiency and correlation with morning energy
    const last7 = sleepLogs.slice(0, 7);
    const count = last7.length || 1;
    const avgEfficiency = Math.round((last7.reduce((s, l) => s + l.sleepEfficiency, 0) / count) * 10) / 10;
    const avgEnergy = Math.round((last7.reduce((s, l) => s + l.morningEnergy, 0) / count) * 10) / 10;

    return NextResponse.json({
      success: true,
      latest,
      sleepLogs,
      metrics: {
        avgEfficiency,
        avgEnergy,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bedTime, finalWakeTime, outOfBedTime, timeInBedMinutes, totalSleepTimeMinutes, morningEnergy, perceivedQuality, notes } = body;

    const tib = Number(timeInBedMinutes) || 450;
    const tst = Number(totalSleepTimeMinutes) || 420;
    const eff = calculateSleepEfficiency(tst, tib);

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const existing = await prisma.sleepLog.findFirst({ where: { date: today } });

    let sleep;
    if (existing) {
      sleep = await prisma.sleepLog.update({
        where: { id: existing.id },
        data: {
          bedTime: bedTime || "۲۳:۲۰",
          finalWakeTime: finalWakeTime || "۰۶:۴۵",
          outOfBedTime: outOfBedTime || "۰۷:۰۰",
          timeInBedMinutes: tib,
          totalSleepTimeMinutes: tst,
          sleepEfficiency: eff,
          morningEnergy: Number(morningEnergy) || 8,
          perceivedQuality: Number(perceivedQuality) || 8,
          notes: notes || undefined,
        },
      });
    } else {
      sleep = await prisma.sleepLog.create({
        data: {
          date: today,
          bedTime: bedTime || "۲۳:۲۰",
          finalWakeTime: finalWakeTime || "۰۶:۴۵",
          outOfBedTime: outOfBedTime || "۰۷:۰۰",
          timeInBedMinutes: tib,
          totalSleepTimeMinutes: tst,
          sleepEfficiency: eff,
          morningEnergy: Number(morningEnergy) || 8,
          perceivedQuality: Number(perceivedQuality) || 8,
          notes: notes || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, sleep });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
