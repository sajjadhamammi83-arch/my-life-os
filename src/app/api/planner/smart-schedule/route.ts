import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SmartScheduleRequest {
  title: string;
  category?: "Book" | "Project" | "University" | "Deep Work" | "General";
  totalHours?: number;
  totalPages?: number;
  pagesPerHour?: number;
  deadline: string; // ISO date or YYYY-MM-DD
  sessionDurationMinutes?: number; // e.g. 45, 60, 90
  preferredSlot?: "morning" | "afternoon" | "evening" | "auto";
  confirm?: boolean; // If true, commits directly to DB
}

export async function POST(request: Request) {
  try {
    const body: SmartScheduleRequest = await request.json();
    const {
      title,
      category = "Deep Work",
      totalHours: inputHours,
      totalPages,
      pagesPerHour = 25,
      deadline,
      sessionDurationMinutes = 60,
      preferredSlot = "auto",
      confirm = false,
    } = body;

    if (!title || !deadline) {
      return NextResponse.json(
        { success: false, error: "عنوان و تاریخ سررسید الزامی هستند" },
        { status: 400 }
      );
    }

    // Calculate total required minutes
    let requiredMinutes = 0;
    if (inputHours && inputHours > 0) {
      requiredMinutes = inputHours * 60;
    } else if (totalPages && totalPages > 0) {
      const hours = totalPages / pagesPerHour;
      requiredMinutes = Math.round(hours * 60);
    } else {
      requiredMinutes = 180; // 3 hours default
    }

    const sessionMinutes = Math.max(30, Math.min(180, sessionDurationMinutes));
    const targetDate = new Date(deadline);
    targetDate.setHours(23, 59, 59, 999);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + 1); // Start scheduling from tomorrow
    startDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) {
      return NextResponse.json(
        { success: false, error: "تاریخ سررسید باید حداقل برای فردا یا روزهای آینده باشد" },
        { status: 400 }
      );
    }

    // Fetch existing calendar blocks in this window
    const existingBlocks = await prisma.calendarBlock.findMany({
      where: {
        start: {
          gte: startDate,
          lte: targetDate,
        },
      },
      orderBy: { start: "asc" },
    });

    // Preferred standard windows
    // Morning: 08:30 - 11:30 (Deep work high focus)
    // Afternoon: 15:00 - 18:00 (Buffer / Study / Secondary)
    // Evening: 19:30 - 21:30 (Reading / Planning / Light)
    const slotConfigs = {
      morning: { startHour: 8, startMin: 30, endHour: 12, endMin: 0 },
      afternoon: { startHour: 15, startMin: 0, endHour: 18, endMin: 0 },
      evening: { startHour: 19, startMin: 30, endHour: 22, endMin: 0 },
    };

    let remainingMinutes = requiredMinutes;
    const proposedSessions: Array<{
      date: string;
      startTime: string;
      endTime: string;
      startIso: string;
      endIso: string;
      durationMinutes: number;
      type: string;
      title: string;
    }> = [];

    // Iterate through days
    for (let dayOffset = 0; dayOffset < diffDays && remainingMinutes > 0; dayOffset++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + dayOffset);

      // Determine which windows to check based on preference & category
      let windowsToCheck: Array<{ startHour: number; startMin: number; endHour: number; endMin: number }> = [];
      if (preferredSlot === "morning" || (preferredSlot === "auto" && category === "Deep Work")) {
        windowsToCheck = [slotConfigs.morning, slotConfigs.afternoon, slotConfigs.evening];
      } else if (preferredSlot === "evening" || (preferredSlot === "auto" && category === "Book")) {
        windowsToCheck = [slotConfigs.evening, slotConfigs.afternoon, slotConfigs.morning];
      } else {
        windowsToCheck = [slotConfigs.afternoon, slotConfigs.morning, slotConfigs.evening];
      }

      // Check each window for a free gap
      for (const win of windowsToCheck) {
        if (remainingMinutes <= 0) break;

        const candidateStart = new Date(currentDay);
        candidateStart.setHours(win.startHour, win.startMin, 0, 0);

        const currentSessionMinutes = Math.min(sessionMinutes, remainingMinutes);
        const candidateEnd = new Date(candidateStart);
        candidateEnd.setMinutes(candidateStart.getMinutes() + currentSessionMinutes);

        // Check collision with existing blocks
        const hasCollision = existingBlocks.some((b) => {
          const bStart = new Date(b.start).getTime();
          const bEnd = new Date(b.end).getTime();
          const cStart = candidateStart.getTime();
          const cEnd = candidateEnd.getTime();
          return cStart < bEnd && cEnd > bStart;
        });

        // Also check collision with already proposed sessions
        const hasProposedCollision = proposedSessions.some((p) => {
          const pStart = new Date(p.startIso).getTime();
          const pEnd = new Date(p.endIso).getTime();
          const cStart = candidateStart.getTime();
          const cEnd = candidateEnd.getTime();
          return cStart < pEnd && cEnd > pStart;
        });

        if (!hasCollision && !hasProposedCollision) {
          const sFormatted = candidateStart.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
          const eFormatted = candidateEnd.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
          const dFormatted = candidateStart.toLocaleDateString("fa-IR");

          proposedSessions.push({
            date: dFormatted,
            startTime: sFormatted,
            endTime: eFormatted,
            startIso: candidateStart.toISOString(),
            endIso: candidateEnd.toISOString(),
            durationMinutes: currentSessionMinutes,
            type: category === "Book" ? "Learning" : "Deep Work",
            title: `${title} (جلسه ${proposedSessions.length + 1})`,
          });

          remainingMinutes -= currentSessionMinutes;
        }
      }
    }

    const scheduledMinutes = requiredMinutes - remainingMinutes;
    const scheduledHours = Math.round((scheduledMinutes / 60) * 10) / 10;
    const totalRequiredHours = Math.round((requiredMinutes / 60) * 10) / 10;

    let feasibilityStatus: "FEASIBLE" | "TIGHT" | "IMPOSSIBLE" = "FEASIBLE";
    let advice = "برنامه با موفقیت در فضاهای خالی و متناسب با ریتم تمرکز شما چیده شد.";

    if (remainingMinutes === 0) {
      feasibilityStatus = "FEASIBLE";
      advice = `کاملاً امکان‌پذیر: تمام ${totalRequiredHours} ساعت کار در ${proposedSessions.length} جلسه قبل از سررسید برنامه‌ریزی شد.`;
    } else if (scheduledMinutes > 0) {
      feasibilityStatus = "TIGHT";
      advice = `تنگنای ظرفیت: از ${totalRequiredHours} ساعت، تنها ${scheduledHours} ساعت فضای خالی بدون تداخل یافت شد. پیشنهاد می‌شود کارهای کم‌اهمیت جابه‌جا شوند یا سررسید چند روز تمدید گردد.`;
    } else {
      feasibilityStatus = "IMPOSSIBLE";
      advice = "ظرفیت خالی تا تاریخ سررسید یافت نشد! برنامه روزهای آینده کاملاً پر است.";
    }

    // If confirm is requested, commit the sessions to DB
    if (confirm && proposedSessions.length > 0) {
      for (const s of proposedSessions) {
        await prisma.calendarBlock.create({
          data: {
            title: s.title,
            type: s.type,
            start: new Date(s.startIso),
            end: new Date(s.endIso),
            notes: `${s.startTime} - ${s.endTime}`,
          },
        });
      }
    }

    const daysDiff = Math.max(1, Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    const dailyLoadHours = (totalRequiredHours / daysDiff).toFixed(1);

    return NextResponse.json({
      success: true,
      feasibility: feasibilityStatus,
      feasible: feasibilityStatus === "FEASIBLE",
      advice,
      optimizationAdvice: advice,
      totalRequiredHours,
      scheduledHours,
      sessionsCount: proposedSessions.length,
      totalSessions: proposedSessions.length,
      dailyLoadHours,
      remainingMinutes,
      isCommitted: confirm,
      proposedSessions,
      proposedBlocks: proposedSessions.map((s) => ({ ...s, datePersian: s.date })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
