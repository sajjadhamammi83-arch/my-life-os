"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Calendar, Bell, ShieldCheck, Sparkles, Clock, CheckSquare, Dumbbell, ArrowLeft, X, Receipt, GraduationCap, User as UserIcon, LogOut, Menu } from "lucide-react";
import { getTodayPersianString, toPersianDigits, formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  onOpenQuickCapture: () => void;
  onOpenMobileMenu?: () => void;
}

export default function Header({ onOpenQuickCapture, onOpenMobileMenu }: HeaderProps) {
  const [persianDate, setPersianDate] = useState("");
  const [reminderData, setReminderData] = useState<{
    tomorrowPersianDate: string;
    summary: {
      totalItems: number;
      blocksCount: number;
      tasksCount: number;
      workoutsCount: number;
      chequesCount?: number;
      examsCount?: number;
    };
    blocks: any[];
    tasks: any[];
    workouts: any[];
    cheques?: any[];
    exams?: any[];
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchTomorrowReminders = async () => {
    try {
      const res = await fetch("/api/reminders/tomorrow");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReminderData(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch tomorrow reminders", e);
    }
  };

  const [currentUser, setCurrentUser] = useState<{ username: string; name: string } | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    setPersianDate(getTodayPersianString());
    fetchCurrentUser();
    fetchTomorrowReminders();

    const handleRemindersUpdated = () => {
      fetchTomorrowReminders();
    };
    window.addEventListener("reminders-updated", handleRemindersUpdated);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("reminders-updated", handleRemindersUpdated);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const totalTomorrowCount = reminderData?.summary?.totalItems || 0;

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Start (Right in RTL): Menu button & Today Info */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center justify-center transition-all shrink-0 active:scale-95"
            title="منوی اصلی و ناوبری"
            aria-label="منو"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-600 text-xs shrink-0">
          <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="font-bold text-zinc-900 truncate">{persianDate || "امروز"}</span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-zinc-200" />
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>چرخه ۹۰ روزه: روز {toPersianDigits(34)} از {toPersianDigits(90)} (فاز ساخت)</span>
        </div>
      </div>

      {/* End (Left in RTL): Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Add Button (High-Contrast Black Button) */}
        <button
          onClick={onOpenQuickCapture}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          title="ثبت سریع (کلید میانبر: Ctrl+K)"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>ثبت سریع</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200">
            Ctrl+K
          </kbd>
        </button>

        {/* Audit Status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>صندوق و انبار بالانس</span>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-1 sm:gap-1.5 border-r border-zinc-200 pr-2 mr-0.5 sm:pr-3 sm:mr-1">
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-zinc-800 bg-zinc-100/90 border border-zinc-200 px-2 py-1 rounded-lg max-w-[100px] sm:max-w-none">
            <UserIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="font-bold truncate">{currentUser?.name || "سجاد"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-zinc-600 flex items-center justify-center transition-all shrink-0"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notifications & Tomorrow Agenda Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all relative ${
              isOpen
                ? "bg-black text-white border-black"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
            }`}
            title="یادآورها و برنامه‌های فردا (D-1)"
          >
            <Bell className="w-4 h-4" />
            {totalTomorrowCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                {toPersianDigits(totalTomorrowCount)}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {isOpen && (
            <div className="absolute left-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[390px] bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 text-right">
              {/* Popover Header */}
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-black" />
                    <h4 className="font-bold text-xs text-zinc-950">
                      برنامه فردا - {reminderData?.tomorrowPersianDate || "فردا"}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                    {toPersianDigits(totalTomorrowCount)} رویداد و کار در انتظار (D-1)
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items Content */}
              <div className="max-h-[360px] overflow-y-auto p-3 space-y-3 divide-y divide-zinc-100">
                {totalTomorrowCount === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-xs">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>هیچ رویداد یا تسکی برای فردا ثبت نشده است.</p>
                    <p className="text-[10px] text-zinc-400 mt-1">برنامه فردای شما کاملاً آزاد است.</p>
                  </div>
                ) : (
                  <>
                    {/* Calendar Blocks */}
                    {reminderData?.blocks && reminderData.blocks.length > 0 && (
                      <div className="pt-2 first:pt-0 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                          <Clock className="w-3.5 h-3.5 text-zinc-900" />
                          <span>بلوک‌های زمانی تقویم ({toPersianDigits(reminderData.blocks.length)})</span>
                        </div>
                        <div className="space-y-1.5">
                          {reminderData.blocks.map((b: any) => (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between hover:bg-zinc-100/70 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <p className="font-semibold text-zinc-900 line-clamp-1">{b.title}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">{b.timeFormatted}</p>
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
                    {reminderData?.exams && reminderData.exams.length > 0 && (
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-900" />
                          <span>امتحانات دانشگاه فردا ({toPersianDigits(reminderData.exams.length)})</span>
                        </div>
                        <div className="space-y-1.5">
                          {reminderData.exams.map((e: any) => (
                            <div
                              key={e.id}
                              className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between hover:bg-zinc-100/70 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <p className="font-semibold text-zinc-900 line-clamp-1">{e.title}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                  <span>{e.course?.title || "درس دانشگاه"}</span>
                                  {e.room && <span>• اتاق/محل: {e.room}</span>}
                                  {e.timeFormatted && <span>• ساعت: {e.timeFormatted}</span>}
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
                    {reminderData?.cheques && reminderData.cheques.length > 0 && (
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900">
                          <Receipt className="w-3.5 h-3.5 text-zinc-900" />
                          <span>چک‌های سررسید فردا ({toPersianDigits(reminderData.cheques.length)})</span>
                        </div>
                        <div className="space-y-1.5">
                          {reminderData.cheques.map((c: any) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between hover:bg-zinc-100/70 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-zinc-900 line-clamp-1">
                                    {c.bankName} - {c.chequeNumber}
                                  </span>
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

                    {/* Tasks with Due Date Tomorrow */}
                    {reminderData?.tasks && reminderData.tasks.length > 0 && (
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                          <CheckSquare className="w-3.5 h-3.5 text-zinc-900" />
                          <span>تسک‌های سررسید فردا ({toPersianDigits(reminderData.tasks.length)})</span>
                        </div>
                        <div className="space-y-1.5">
                          {reminderData.tasks.map((t: any) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between hover:bg-zinc-100/70 transition-colors"
                            >
                              <div>
                                <p className="font-semibold text-zinc-900 line-clamp-1">{t.title}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                                  {t.area && <span>{typeof t.area === "object" ? t.area.name : t.area}</span>}
                                  {t.workType && <span>•</span>}
                                  {t.workType && <span>{t.workType}</span>}
                                </div>
                              </div>
                              {t.isBigThree && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black text-white">
                                  Big 3
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Workouts */}
                    {reminderData?.workouts && reminderData.workouts.length > 0 && (
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                          <Dumbbell className="w-3.5 h-3.5 text-zinc-900" />
                          <span>برنامه ورزشی فردا ({toPersianDigits(reminderData.workouts.length)})</span>
                        </div>
                        <div className="space-y-1.5">
                          {reminderData.workouts.map((w: any) => (
                            <div
                              key={w.id}
                              className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between"
                            >
                              <p className="font-semibold text-zinc-900">{w.title || w.name}</p>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {toPersianDigits(w.durationMinutes || w.duration || 60)} دقیقه
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Popover Footer */}
              <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/planner"
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-700 hover:text-black font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>برنامه‌ریز تقویم</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-zinc-300">|</span>
                  <Link
                    href="/today"
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-700 hover:text-black font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>صفحه امروز</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <button
                  onClick={fetchTomorrowReminders}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800"
                >
                  به‌روزرسانی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
