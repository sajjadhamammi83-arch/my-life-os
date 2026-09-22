"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, Clock, CheckSquare, Dumbbell, ArrowLeft, Receipt, GraduationCap } from "lucide-react";
import { toPersianDigits, formatCurrency } from "@/lib/utils";

interface TomorrowAgendaWidgetProps {
  initialData?: {
    tomorrowPersianDate?: string;
    summary?: {
      totalItems: number;
      blocksCount: number;
      tasksCount: number;
      workoutsCount: number;
      chequesCount?: number;
      examsCount?: number;
    };
    blocks?: any[];
    tasks?: any[];
    workouts?: any[];
    cheques?: any[];
    exams?: any[];
  } | null;
}

export default function TomorrowAgendaWidget({ initialData }: TomorrowAgendaWidgetProps) {
  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders/tomorrow");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (e) {
      console.error("Failed to fetch tomorrow agenda", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchReminders();
    }

    const handleRemindersUpdated = () => {
      fetchReminders();
    };

    window.addEventListener("reminders-updated", handleRemindersUpdated);
    return () => {
      window.removeEventListener("reminders-updated", handleRemindersUpdated);
    };
  }, [initialData]);

  const totalItems = data?.summary?.totalItems ?? (
    (data?.blocks?.length || 0) +
    (data?.tasks?.length || 0) +
    (data?.workouts?.length || 0) +
    (data?.cheques?.length || 0) +
    (data?.exams?.length || 0)
  );

  return (
    <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-950">
              یادآور پیش‌دستانه: برنامه و رویدادهای فردا (D-1)
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
              {data?.tomorrowPersianDate || "فردا"} • {toPersianDigits(totalItems)} رویداد و برنامه پیش‌رو
            </p>
          </div>
        </div>

        <Link
          href="/planner"
          className="text-xs text-zinc-700 hover:text-black font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300"
        >
          <span>برنامه‌ریز تقویم</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-6 text-center text-xs text-zinc-400">در حال دریافت برنامه‌های فردا...</div>
      ) : totalItems === 0 ? (
        <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500">
          <Calendar className="w-6 h-6 mx-auto mb-1.5 text-zinc-400 opacity-60" />
          <p className="font-medium text-zinc-800">هیچ رویداد یا تعهدی برای فردا ثبت نشده است.</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">روز شما کاملاً آزاد است و می‌توانید برای آن برنامه‌ریزی کنید.</p>
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-zinc-100">
          {/* Calendar Blocks */}
          {data?.blocks && data.blocks.length > 0 && (
            <div className="pt-2 first:pt-0 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-900" />
                <span>بلوک‌های زمانی تقویم ({toPersianDigits(data.blocks.length)})</span>
              </div>
              <div className="space-y-1.5">
                {data.blocks.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between hover:border-zinc-300 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-zinc-500 min-w-[90px] text-left">{b.timeFormatted}</span>
                      <span className="font-semibold text-zinc-900">{b.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-900">
                      {b.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* University Exams */}
          {data?.exams && data.exams.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <GraduationCap className="w-3.5 h-3.5 text-zinc-900" />
                <span>امتحانات دانشگاه فردا ({toPersianDigits(data.exams.length)})</span>
              </div>
              <div className="space-y-1.5">
                {data.exams.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                        <span className="font-semibold text-zinc-900">{e.title}</span>
                        {e.course && (
                          <span className="text-[10px] text-zinc-700 bg-zinc-200 px-1.5 py-0.5 rounded font-medium">
                            {e.course.title} ({e.course.code})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 mr-3.5">
                        {e.room && <span>محل: {e.room}</span>}
                        {e.timeFormatted && <span className="mr-2">ساعت: {e.timeFormatted}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-white">
                      امتحان
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Cheques */}
          {data?.cheques && data.cheques.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <Receipt className="w-3.5 h-3.5 text-zinc-900" />
                <span>چک‌های سررسید فردا ({toPersianDigits(data.cheques.length)})</span>
              </div>
              <div className="space-y-1.5">
                {data.cheques.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">{c.bankName} - {c.chequeNumber}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            c.chequeType === "PAYABLE"
                              ? "bg-zinc-200 text-zinc-900"
                              : "bg-zinc-900 text-white"
                          }`}
                        >
                          {c.chequeType === "PAYABLE" ? "پرداختی" : "دریافتی"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        طرف حساب: {c.payeeOrPayer} {c.costCenter ? `• مرکز: ${c.costCenter.name}` : ""}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 text-xs">
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {data?.tasks && data.tasks.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-900" />
                <span>تسک‌های سررسید فردا ({toPersianDigits(data.tasks.length)})</span>
              </div>
              <div className="space-y-1.5">
                {data.tasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                      <span className="font-semibold text-zinc-900">{t.title}</span>
                      {t.area && (
                        <span className="text-[10px] text-zinc-600 bg-zinc-200 px-1.5 py-0.5 rounded font-medium">
                          {typeof t.area === "object" ? t.area.name : t.area}
                        </span>
                      )}
                      {t.workType && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {t.workType}
                        </span>
                      )}
                    </div>
                    {t.isBigThree ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-black text-white shadow-sm">
                        Big 3
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {t.priority === "high" || t.priority === "urgent" ? "اولویت بالا" : "عادی"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workouts */}
          {data?.workouts && data.workouts.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <Dumbbell className="w-3.5 h-3.5 text-zinc-900" />
                <span>برنامه ورزشی فردا ({toPersianDigits(data.workouts.length)})</span>
              </div>
              <div className="space-y-1.5">
                {data.workouts.map((w: any) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-zinc-900">{w.title || w.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 bg-zinc-200 px-2 py-0.5 rounded font-mono font-bold">
                      {toPersianDigits(w.durationMinutes || w.duration || 60)} دقیقه
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
