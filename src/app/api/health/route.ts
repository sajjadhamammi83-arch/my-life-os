import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [latestMeasurement, measurements, latestNutrition, nutritionHistory, workouts] = await Promise.all([
      prisma.bodyMeasurement.findFirst({ orderBy: { date: "desc" } }),
      prisma.bodyMeasurement.findMany({ orderBy: { date: "desc" }, take: 14 }),
      prisma.nutritionLog.findFirst({
        orderBy: { date: "desc" },
        include: { meals: true },
      }),
      prisma.nutritionLog.findMany({
        orderBy: { date: "desc" },
        take: 7,
      }),
      prisma.workout.findMany({
        orderBy: { date: "desc" },
        take: 10,
        include: { exercises: true },
      }),
    ]);

    // Rolling 7-day averages
    const count7 = nutritionHistory.length || 1;
    const avgCalories = Math.round(nutritionHistory.reduce((s, n) => s + n.calories, 0) / count7);
    const avgProtein = Math.round((nutritionHistory.reduce((s, n) => s + n.protein, 0) / count7) * 10) / 10;
    const avgWater = Math.round(nutritionHistory.reduce((s, n) => s + n.waterMl, 0) / count7);

    return NextResponse.json({
      success: true,
      latestMeasurement,
      measurements,
      latestNutrition,
      nutritionHistory,
      rolling7Day: {
        avgCalories,
        avgProtein,
        avgWater,
      },
      workouts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, weight, waist, waterAmount, mealType, mealTitle, calories, protein, workoutTitle, durationMinutes, exercises } = body;

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (action === "weight") {
      const w = Number(weight);
      const bmi = Math.round((w / 3.24) * 10) / 10;
      const measurement = await prisma.bodyMeasurement.create({
        data: {
          date: new Date(),
          weight: w,
          waist: waist ? Number(waist) : undefined,
          bmi,
          notes: "ثبت زنده وزن",
        },
      });
      return NextResponse.json({ success: true, measurement });
    }

    if (action === "water") {
      const addWater = Number(waterAmount) || 250;
      const log = await prisma.nutritionLog.findFirst({
        where: { date: today },
      });

      if (log) {
        await prisma.nutritionLog.update({
          where: { id: log.id },
          data: { waterMl: { increment: addWater } },
        });
      } else {
        await prisma.nutritionLog.create({
          data: {
            date: today,
            waterMl: addWater,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "meal") {
      let log = await prisma.nutritionLog.findFirst({
        where: { date: today },
      });

      if (!log) {
        log = await prisma.nutritionLog.create({
          data: {
            date: today,
            calories: Number(calories) || 0,
            protein: Number(protein) || 0,
          },
        });
      } else {
        await prisma.nutritionLog.update({
          where: { id: log.id },
          data: {
            calories: { increment: Number(calories) || 0 },
            protein: { increment: Number(protein) || 0 },
          },
        });
      }

      const entry = await prisma.foodEntry.create({
        data: {
          nutritionLogId: log.id,
          mealType: mealType || "میان‌وعده",
          title: mealTitle,
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
        },
      });

      return NextResponse.json({ success: true, entry });
    }

    if (action === "workout") {
      let totalVol = 0;
      if (Array.isArray(exercises)) {
        totalVol = exercises.reduce((sum: number, ex: any) => {
          return sum + (Number(ex.sets) || 0) * (Number(ex.reps) || 0) * (Number(ex.weight) || 0);
        }, 0);
      }

      const workout = await prisma.workout.create({
        data: {
          date: new Date(),
          title: workoutTitle || "تمرین قدرتی باشگاه",
          durationMinutes: Number(durationMinutes) || 60,
          totalVolume: totalVol,
          exercises: {
            create: Array.isArray(exercises)
              ? exercises.map((ex: any) => ({
                  name: ex.name || "حرکت تمرینی",
                  sets: Number(ex.sets) || 3,
                  reps: Number(ex.reps) || 10,
                  weight: Number(ex.weight) || 0,
                  rpe: Number(ex.rpe) || 8,
                }))
              : [],
          },
        },
        include: { exercises: true },
      });

      return NextResponse.json({ success: true, workout });
    }

    return NextResponse.json({ success: false, error: "Action not recognized" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
