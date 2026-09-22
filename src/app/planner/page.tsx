"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Zap,
  Layers,
  Plus,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import {
  toPersianDigits,
  formatPersianDate,
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthDays,
  getJalaliDayOfWeek,
  PERSIAN_MONTH_NAMES,
} from "@/lib/utils";
import { PersianDatePicker } from "@/components/ui/PersianDatePicker";

export default function PlannerPage() {
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedDayType, setSelectedDayType] = useState("روز طلایی");
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [blockTitle, setBlockTitle] = useState("");
  const [blockType, setBlockType] = useState("Deep Work");
  const [blockNotes, setBlockNotes] = useState("");

  // Smart Scheduler Modal State
  const [isSmartSchedulerOpen, setIsSmartSchedulerOpen] = useState(false);
  const [schedTitle, setSchedTitle] = useState("مطالعه کتاب تفکر سریع و کند");
  const [schedCategory, setSchedCategory] = useState("کتاب");
  const [schedMode, setSchedMode] = useState<"pages" | "hours">("pages");
  const [totalPages, setTotalPages] = useState<number>(100);
  const [pagesPerHour, setPagesPerHour] = useState<number>(25);
  const [totalHours, setTotalHours] = useState<number>(4);
  const [deadlineDays, setDeadlineDays] = useState<number>(3);
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [preferredSlot, setPreferredSlot] = useState<string>("auto");

  // Scheduler Evaluation & Confirm States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [successToast, setSuccessToast] = useState<string>("");
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [rolloverNotice, setRolloverNotice] = useState<string | null>(null);

  const handleRolloverUnfinished = async () => {
    setIsRollingOver(true);
    setRolloverNotice(null);
    try {
      const res = await fetch("/api/tasks/rollover", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRolloverNotice(
          `با موفقیت ${toPersianDigits(data.forwardedCount)} وظیفه ناتمام به فردا منتقل و در تقویم زمان‌بندی هوشمند شدند.`
        );
        window.dispatchEvent(new CustomEvent("reminders-updated"));
        loadPlanner(selectedDate);
      } else {
        setRolloverNotice(data.error || "خطا در انتقال وظایف");
      }
    } catch (e: any) {
      setRolloverNotice("خطا در ارتباط با سرور");
    } finally {
      setIsRollingOver(false);
    }
  };


  const dayTypes = [
    { name: "روز طلایی", desc: "۴+ ساعت Deep Work متمرکز صبحگاهی" },
    { name: "روز بوفه باشگاه و فروشگاه آرایشی", desc: "شارژ مکمل‌های وی، شیک بوفه، دخل و استند آرایشی" },
    { name: "روز دانشگاه", desc: "کلاس‌ها، جلسات مطالعه عمیق و تکالیف" },
    { name: "روز امتحان", desc: "مرور سرفصل‌ها و آمادگی کامل آزمون" },
    { name: "روز بحران / اطفاء حریق", desc: "رسیدگی فوری به گلوگاه‌ها بدون کار جدید" },
    { name: "جمعه / CEO Day", desc: "بازبینی هفتگی، مالی، استراتژی و بازسازی انرژی" },
  ];

  const loadPlanner = async (dateStr?: string) => {
    const target = dateStr || selectedDate;
    setLoading(true);
    try {
      const res = await fetch(`/api/planner?date=${target}`);
      const data = await res.json();
      if (data.success && data.blocks) {
        const badgeMap: any = {
          "Deep Work": "badge-deep-work",
          "Shallow Work": "badge-shallow-work",
          Admin: "badge-admin",
          Health: "badge-health",
          Buffer: "badge-shallow-work",
          Rest: "badge-health",
          Routine: "badge-shallow-work",
        };
        const mapped = data.blocks.map((b: any) => {
          const s = new Date(b.start).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
          const e = new Date(b.end).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
          return {
            id: b.id,
            time: `${s} - ${e}`,
            title: b.title,
            type: b.type,
            notes: b.notes,
            badge: badgeMap[b.type] || "badge-deep-work",
          };
        });
        setTimeBlocks(mapped);
      }
    } catch (e) {
      console.error("Failed to load planner blocks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanner(selectedDate);
    setBlockDate(selectedDate);

    const handleRemindersUpdated = () => {
      loadPlanner(selectedDate);
    };

    window.addEventListener("reminders-updated", handleRemindersUpdated);
    return () => {
      window.removeEventListener("reminders-updated", handleRemindersUpdated);
    };
  }, [selectedDate]);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blockTitle.trim(),
          type: blockType,
          date: blockDate,
          startTime,
          endTime,
          notes: blockNotes || undefined,
        }),
      });

      if (res.ok) {
        // Dispatch reminders-updated event across the app
        window.dispatchEvent(new CustomEvent("reminders-updated"));

        setIsModalOpen(false);
        setBlockTitle("");
        setBlockNotes("");
        // Reload planner for selected date
        loadPlanner(selectedDate);
      }
    } catch (err) {
      console.error("Failed to create block", err);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setTimeBlocks(timeBlocks.filter((b) => b.id !== id));
    try {
      const res = await fetch(`/api/planner?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("reminders-updated"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEvaluateSchedule = async () => {
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Number(deadlineDays));
      const deadlineISO = targetDate.toISOString().split("T")[0];

      const payload = {
        title: schedTitle,
        category: schedCategory,
        totalPages: schedMode === "pages" ? Number(totalPages) : undefined,
        pagesPerHour: schedMode === "pages" ? Number(pagesPerHour) : undefined,
        totalHours: schedMode === "hours" ? Number(totalHours) : undefined,
        deadline: deadlineISO,
        sessionDurationMinutes: Number(sessionDuration),
        preferredSlot,
        confirm: false,
      };

      const res = await fetch("/api/planner/smart-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setEvaluationResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleConfirmSchedule = async () => {
    setIsConfirming(true);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Number(deadlineDays));
      const deadlineISO = targetDate.toISOString().split("T")[0];

      const payload = {
        title: schedTitle,
        category: schedCategory,
        totalPages: schedMode === "pages" ? Number(totalPages) : undefined,
        pagesPerHour: schedMode === "pages" ? Number(pagesPerHour) : undefined,
        totalHours: schedMode === "hours" ? Number(totalHours) : undefined,
        deadline: deadlineISO,
        sessionDurationMinutes: Number(sessionDuration),
        preferredSlot,
        confirm: true,
      };

      const res = await fetch("/api/planner/smart-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessToast(`✓ ${toPersianDigits(data.totalSessions)} جلسه جدید با موفقیت در تقویم ذخیره شدند!`);
        window.dispatchEvent(new CustomEvent("reminders-updated"));
        setTimeout(() => {
          setSuccessToast("");
          setIsSmartSchedulerOpen(false);
          setEvaluationResult(null);
        }, 1800);
        loadPlanner(selectedDate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConfirming(false);
    }
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const selectedPersianDate = formatPersianDate(selectedDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isToday = selectedDate === getTodayStr();
  const isTomorrow = selectedDate === getTomorrowStr();

  return (
    <div className="space-y-6 animate-fade-in bg-white">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-200">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">
              برنامه‌ریزی، تایم‌بلاکینگ و الگوهای روزانه (Planner & Time-Blocking)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              ثبت و مدیریت بلوک‌های زمانی برای امروز، فردا و هر تاریخ دلخواه در آینده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          {/* Smart Scheduler AI Button */}
          <button
            onClick={() => {
              setIsSmartSchedulerOpen(true);
              setEvaluationResult(null);
              setSuccessToast("");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 border border-zinc-700"
            title="زمان‌بندی خودکار پروژه‌ها و مطالعه کتاب بر اساس اوقات فراغت"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>زمان‌بندی هوشمند تقویم</span>
            <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-black">AI</span>
          </button>

          {/* Manual Block Button */}
          <button
            onClick={() => {
              setBlockDate(selectedDate);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold border border-zinc-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>بلوک دستی</span>
          </button>

          {/* Rollover to Tomorrow Button */}
          <button
            onClick={handleRolloverUnfinished}
            disabled={isRollingOver}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold border border-zinc-800 transition-all active:scale-95 shadow-sm"
            title="انتقال کارهای انجام‌نشده به فردا و زمان‌بندی هوشمند در اسلات‌های خالی تقویم"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isRollingOver ? "در حال انتقال..." : "انتقال کارهای انجام‌نشده به فردا"}</span>
          </button>
        </div>
      </div>

      {rolloverNotice && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{rolloverNotice}</span>
          </div>
          <button onClick={() => setRolloverNotice(null)} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>
      )}


      {/* Date Navigation & Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Quick Date Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors"
            title="روز قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayStr())}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isToday
                ? "bg-black text-white border-black shadow-sm"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
            }`}
          >
            امروز
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTomorrowStr())}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isTomorrow
                ? "bg-black text-white border-black shadow-sm"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
            }`}
          >
            فردا (D-1)
          </button>

          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors"
            title="روز بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Date Info & Persian Date Picker */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <PersianDatePicker
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            buttonClassName="px-3.5 py-1.5"
          />
        </div>
      </div>

      {/* Day Archetypes Selector */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-xs text-zinc-950 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-zinc-500" />
          انتخاب الگوی ساختار روزانه (Day Template):
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {dayTypes.map((dt) => {
            const isSelected = selectedDayType === dt.name;
            return (
              <button
                key={dt.name}
                type="button"
                onClick={() => setSelectedDayType(dt.name)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between min-h-[90px] ${
                  isSelected
                    ? "bg-black text-white border-white shadow-sm"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800"
                }`}
              >
                <span className={`font-bold text-xs ${isSelected ? "text-white" : "text-zinc-950"}`}>
                  {dt.name}
                </span>
                <span className={`text-[10px] leading-tight ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                  {dt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Blocks Timeline */}
      <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-900" />
            <h3 className="font-bold text-sm text-zinc-950">
              بلوک‌های زمانی: {selectedPersianDate} ({selectedDayType})
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {toPersianDigits(timeBlocks.length)} بلوک در این تاریخ
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-400">در حال دریافت بلوک‌ها...</div>
        ) : timeBlocks.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-xl border border-zinc-200">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-zinc-700">هیچ بلوک زمانی برای این تاریخ ثبت نشده است.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">برای این تاریخ می‌توانید بلوک زمانی جدید ایجاد کنید.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {timeBlocks.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-zinc-500 min-w-[90px] text-left">{b.time}</span>
                  <div>
                    <span className="font-semibold text-zinc-950">{b.title}</span>
                    {b.notes && (
                      <p className="text-[10px] text-zinc-400 mt-0.5">{b.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${b.badge}`}>
                    {b.type}
                  </span>
                  <button
                    onClick={() => handleDeleteBlock(b.id)}
                    className="p-1 text-zinc-400 hover:text-black transition-colors"
                    title="حذف بلوک"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Time Block Modal (Future Dates Supported) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-950">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-zinc-950">افزودن بلوک زمانی جدید</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3.5 text-xs">
              {/* Persian Date Picker */}
              <div>
                <PersianDatePicker
                  label="تاریخ بلوک (تقویم شمسی):"
                  value={blockDate}
                  onChange={(newDate) => setBlockDate(newDate)}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-zinc-600 mb-1 font-bold">عنوان اقدام یا رویداد:</label>
                <input
                  type="text"
                  required
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  placeholder="مثلاً: توسعه هسته وب سرویس رایش / جلسه استراتژی"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1 font-bold">ساعت شروع:</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-zinc-950 font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1 font-bold">ساعت پایان:</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-zinc-950 font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Block Type */}
              <div>
                <label className="block text-zinc-600 mb-1 font-bold">نوع بلوک:</label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-zinc-800 focus:outline-none focus:border-black"
                >
                  <option value="Deep Work">کار عمیق (Deep Work)</option>
                  <option value="Shallow Work">کار کم‌عمق (Shallow Work)</option>
                  <option value="Admin">امور اداری و دخل (Admin)</option>
                  <option value="Health">سلامت و تمرین (Health)</option>
                  <option value="Buffer">بافر روزانه (Buffer)</option>
                  <option value="Routine">روتین و ژورنال (Routine)</option>
                  <option value="Rest">استراحت و ناهار (Rest)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-600 mb-1 font-bold">یادداشت تکمیلی (اختیاری):</label>
                <input
                  type="text"
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  placeholder="توضیحات کوتاه درباره نیازمندی‌ها یا اهداف این بلوک"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-black"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950 font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-all shadow-sm active:scale-95"
                >
                  ثبت در تقویم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMART AUTO-SCHEDULER MODAL */}
      {isSmartSchedulerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl my-8 text-right animate-in fade-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-black text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-950">
                    دستیار فوق‌هوشمند زمان‌بندی خودکار تقویم
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    تخصیص هوشمند به اوقات فراغت بدون تداخل با بوفه باشگاه، آرایشی، رایش و خواب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSmartSchedulerOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Toast */}
            {successToast && (
              <div className="p-3 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successToast}</span>
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-4 text-xs">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    نام اقدام، کتاب یا پروژه:
                  </label>
                  <input
                    type="text"
                    value={schedTitle}
                    onChange={(e) => setSchedTitle(e.target.value)}
                    placeholder="مثلاً: مطالعه کتاب تفکر سریع و کند"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    نوع و حوزه فعالیت:
                  </label>
                  <select
                    value={schedCategory}
                    onChange={(e) => setSchedCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:bg-white focus:outline-none focus:border-black"
                  >
                    <option value="کتاب">مطالعه کتاب و توسعه فردی</option>
                    <option value="پروژه شرکت رایش">پروژه مهندسی رایش (کار عمیق)</option>
                    <option value="فروشگاه لوازم آرایشی">فروشگاه لوازم آرایشی و انبار</option>
                    <option value="بوفه باشگاه">بوفه باشگاه بدنسازی</option>
                    <option value="دانشگاه">دروس و امتحانات دانشگاه</option>
                    <option value="کار عمیق">کار عمیق عمومی (Deep Work)</option>
                  </select>
                </div>
              </div>

              {/* Mode Toggle (Pages vs Hours) */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800">شیوه محاسبه حجم کار:</span>
                  <div className="flex bg-zinc-200 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSchedMode("pages")}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                        schedMode === "pages" ? "bg-white text-black shadow-sm" : "text-zinc-600"
                      }`}
                    >
                      بر اساس تعداد صفحات (کتاب)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchedMode("hours")}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                        schedMode === "hours" ? "bg-white text-black shadow-sm" : "text-zinc-600"
                      }`}
                    >
                      بر اساس مجموع ساعت کار
                    </button>
                  </div>
                </div>

                {schedMode === "pages" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-zinc-600 mb-1 font-medium">
                        تعداد کل صفحات:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalPages}
                        onChange={(e) => setTotalPages(Number(e.target.value))}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-600 mb-1 font-medium">
                        سرعت مطالعه (صفحه در ساعت):
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={pagesPerHour}
                        onChange={(e) => setPagesPerHour(Number(e.target.value))}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-900 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <label className="block text-zinc-600 mb-1 font-medium">
                      مجموع ساعت خالص مورد نیاز:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={totalHours}
                      onChange={(e) => setTotalHours(Number(e.target.value))}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-900 font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-200/60">
                  <span>کل زمان خالص مورد نیاز:</span>
                  <span className="font-bold text-zinc-950 font-mono">
                    {toPersianDigits(schedMode === "pages" ? (totalPages / pagesPerHour).toFixed(1) : totalHours)} ساعت
                  </span>
                </div>
              </div>

              {/* Deadline, Session Duration & Preferred Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    ضرب‌الاجل (مهلت انجام):
                  </label>
                  <select
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value={1}>تا فردا (ضرب‌الاجل فشرده)</option>
                    <option value={2}>ظرف ۲ روز آینده</option>
                    <option value={3}>ظرف ۳ روز آینده (پیشنهادی)</option>
                    <option value={5}>ظرف ۵ روز آینده</option>
                    <option value={7}>ظرف ۱ هفته آینده</option>
                    <option value={14}>ظرف ۲ هفته آینده</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    مدت زمان هر جلسه:
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value={30}>۳۰ دقیقه (چابک و سبک)</option>
                    <option value={45}>۴۵ دقیقه (پومودورو بهینه)</option>
                    <option value={60}>۶۰ دقیقه (۱ ساعت تمرکز استاندارد)</option>
                    <option value={90}>۹۰ دقیقه (کار عمیق سنگین)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1">
                    بازه زمانی ارجح روز:
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value="auto">هوشمند (اوج انرژی و ساعات صبح)</option>
                    <option value="morning">صبحگاه (۰۶:۰۰ تا ۱۰:۰۰)</option>
                    <option value="afternoon">بعدازظهر (۱۴:۰۰ تا ۱۸:۰۰)</option>
                    <option value="evening">عصر و شب (۲۰:۰۰ تا ۲۳:۰۰)</option>
                  </select>
                </div>
              </div>

              {/* Evaluate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleEvaluateSchedule}
                  disabled={isEvaluating}
                  className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold border border-zinc-300 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4 text-black" />
                  <span>
                    {isEvaluating
                      ? "در حال اسکن تقویم و سنجش امکان‌پذیری..."
                      : "سنجش امکان‌پذیری و محاسبه بلوک‌های خالی تقویم"}
                  </span>
                </button>
              </div>

              {/* EVALUATION RESULTS PANEL */}
              {evaluationResult && (
                <div className="mt-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-4 animate-fade-in">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        evaluationResult.feasible
                          ? "bg-black text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {evaluationResult.feasible
                        ? "امکان‌پذیر و متناسب با انرژی روزانه ✓"
                        : "تنگنای زمانی - پیشنهاد بهینه‌سازی ⚠️"}
                    </span>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono">
                      <span>
                        تعداد جلسات: <strong>{toPersianDigits(evaluationResult.totalSessions)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        بار روزانه: <strong>{toPersianDigits(evaluationResult.dailyLoadHours)}</strong> ساعت
                      </span>
                    </div>
                  </div>

                  {/* Optimization Advice */}
                  <p className="text-xs text-zinc-700 bg-white p-3 rounded-lg border border-zinc-200 leading-relaxed">
                    {evaluationResult.optimizationAdvice}
                  </p>

                  {/* Proposed Sessions List */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-zinc-600" />
                      پیش‌نمایش بلوک‌های زمانی پیشنهادی در تقویم:
                    </h4>

                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {evaluationResult.proposedBlocks?.map((pb: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-bold flex items-center justify-center">
                              {toPersianDigits(idx + 1)}
                            </span>
                            <span className="font-semibold text-zinc-900">{pb.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-600">
                            <span>{pb.datePersian}</span>
                            <span className="bg-zinc-100 px-2 py-0.5 rounded font-bold text-zinc-900">
                              {pb.startTime} - {pb.endTime}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleConfirmSchedule}
                      disabled={isConfirming}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {isConfirming
                          ? "در حال ثبت جلسات در تقویم..."
                          : "تأیید نهایی و ثبت خودکار در تقویم"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

