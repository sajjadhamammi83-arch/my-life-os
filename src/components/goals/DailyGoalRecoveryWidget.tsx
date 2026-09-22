"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Target,
  RefreshCw,
  Flame,
  Star,
  Check,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function DailyGoalRecoveryWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduledId, setRescheduledId] = useState<string | null>(null);

  const fetchDispatcher = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals/daily-dispatcher");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch goal dispatcher", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatcher();

    const handleUpdate = () => fetchDispatcher();
    window.addEventListener("reminders-updated", handleUpdate);
    return () => window.removeEventListener("reminders-updated", handleUpdate);
  }, []);

  const handleReschedule = async (taskId: string, slot: any) => {
    try {
      setIsRescheduling(true);
      const res = await fetch("/api/goals/daily-dispatcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          slotStartIso: slot.startIso,
          slotEndIso: slot.endIso,
          slotLabel: slot.label,
          setBigThree: true,
        }),
      });

      if (res.ok) {
        setRescheduledId(taskId);
        setTimeout(() => {
          setRescheduledId(null);
          fetchDispatcher();
          window.dispatchEvent(new Event("reminders-updated"));
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRescheduling(false);
    }
  };

  if (loading && !data) return null;

  const hasMissed = data?.missedGoalTasks && data.missedGoalTasks.length > 0;
  const dispatched = data?.dispatchedTodayTasks || [];

  if (!hasMissed && dispatched.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* 1. SLIP RECOVERY ALERT (If goal task was missed yesterday) */}
      {hasMissed && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300/80 shadow-sm space-y-3 text-right">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs text-amber-950">
                  بازتنظیم هوشمند عقب‌افتادگی هدف (Slip Recovery Assistant)
                </h4>
                <p className="text-[11px] text-amber-800">
                  {toPersianDigits(data.missedGoalTasks.length)} وظیفه کلیدی از اهداف قبلی انجام نشده است. سیستم برای جلوگیری از شکست هدف، اسلات‌های خالی امروز را شناسایی کرده است:
                </p>
              </div>
            </div>

            <button
              onClick={fetchDispatcher}
              className="p-1 rounded text-amber-700 hover:text-amber-950 transition-colors"
              title="بروزرسانی"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data.missedGoalTasks.map((task: any) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-white border border-amber-200 space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      🎯 هدف: {task.objective?.title || "هدف راهبردی"}
                    </span>
                    <h5 className="font-bold text-xs text-zinc-950 mt-1">{task.title}</h5>
                  </div>

                  {rescheduledId === task.id ? (
                    <span className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      رزرو شد در تقویم!
                    </span>
                  ) : null}
                </div>

                {/* Free Slot Recommendations */}
                {rescheduledId !== task.id && (
                  <div className="space-y-1 pt-1 border-t border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-500 block">
                      یکی از زمان‌های خالی شناسایی‌شده امروز را برای انجام انتخاب کنید:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.availableFreeSlots?.map((slot: any) => (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isRescheduling}
                          onClick={() => handleReschedule(task.id, slot)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 text-[10px] font-bold transition-all border border-zinc-200 flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{slot.label}</span>
                          <span className="opacity-70 text-[9px] font-mono">({slot.startTime})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TODAY'S AUTONOMOUS GOAL ACTION PROMPTS */}
      {dispatched.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-2.5 text-right">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-black text-white">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs text-zinc-950">
                  اقدامات استخراج‌شده خودکار اهداف برای امروز
                </h4>
                <p className="text-[11px] text-zinc-500">
                  سیستم هر روز وظیفه مشخص اهداف شما را به برنامه تزریق می‌کند تا گام‌به‌گام به هدفتان برسید
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              {toPersianDigits(dispatched.length)} هدف فعال
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dispatched.map((t: any) => (
              <div
                key={t.id}
                className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  <span className="font-bold text-zinc-950 line-clamp-1">{t.title}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 font-bold shrink-0">
                  {toPersianDigits(t.estimatedMinutes || 60)} دقیقه
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
