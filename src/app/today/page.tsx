"use client";

import React, { useState, useEffect } from "react";
import {
  Sun,
  Flame,
  Star,
  CheckCircle2,
  Circle,
  Clock,
  Droplet,
  Utensils,
  Dumbbell,
  DollarSign,
  Plus,
  Sparkles,
  Zap,
  Calendar,
  Bell,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Target,
  Layers,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toPersianDigits, formatCurrency } from "@/lib/utils";
import TomorrowAgendaWidget from "@/components/dashboard/TomorrowAgendaWidget";
import DailyGoalRecoveryWidget from "@/components/goals/DailyGoalRecoveryWidget";
import {
  getLocalTodayData,
  saveLocalTasks,
  saveLocalHabits,
  saveLocalCalendarBlocks,
  createLocalTask,
  toggleLocalTask as dbToggleLocalTask,
  toggleLocalHabit as dbToggleLocalHabit,
  toggleLocalBigThree as dbToggleLocalBigThree,
  deleteLocalTask as dbDeleteLocalTask,
  queueOfflineMutation,
} from "@/lib/pwa/local-store";

// Quadrant Color Definitions & Helpers
function getQuadrantMeta(quadrant?: string, priority?: string) {
  const q = quadrant || (priority === "urgent" ? "Q1" : priority === "high" ? "Q2" : "Q3");
  switch (q) {
    case "Q1":
      return {
        id: "Q1",
        label: "سریع و فوری",
        sublabel: "فوری و مهم (Do First)",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 border",
        activeButtonClass: "bg-rose-600 text-white font-black shadow-sm ring-2 ring-rose-300 border-rose-600",
        idleButtonClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
        dotClass: "bg-rose-500",
        icon: AlertCircle,
      };
    case "Q2":
      return {
        id: "Q2",
        label: "مهم اما غیرفوری",
        sublabel: "کار عمیق (Schedule)",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 border",
        activeButtonClass: "bg-blue-600 text-white font-black shadow-sm ring-2 ring-blue-300 border-blue-600",
        idleButtonClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        dotClass: "bg-blue-500",
        icon: Target,
      };
    case "Q3":
      return {
        id: "Q3",
        label: "فوری اما غیرمهم",
        sublabel: "واگذاری و روتین (Delegate)",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200 border",
        activeButtonClass: "bg-amber-500 text-white font-black shadow-sm ring-2 ring-amber-300 border-amber-500",
        idleButtonClass: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
        dotClass: "bg-amber-500",
        icon: Zap,
      };
    case "Q4":
    default:
      return {
        id: "Q4",
        label: "غیرفوری و غیرمهم",
        sublabel: "تفریحی و جانبی (Eliminate)",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 border",
        activeButtonClass: "bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-300 border-emerald-600",
        idleButtonClass: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
        dotClass: "bg-emerald-500",
        icon: Sparkles,
      };
  }
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [waterMl, setWaterMl] = useState(2750);
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [calendarBlocks, setCalendarBlocks] = useState<any[]>([]);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q1");
  const [isBigThreeChoice, setIsBigThreeChoice] = useState(true);
  const [selectedWorkType, setSelectedWorkType] = useState("Deep Work");
  const [estimatedMins, setEstimatedMins] = useState("30");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [rolloverMessage, setRolloverMessage] = useState<string | null>(null);

  const handleRollover = async () => {
    setIsRollingOver(true);
    setRolloverMessage(null);
    try {
      const res = await fetch("/api/tasks/rollover", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRolloverMessage(
          `با موفقیت ${toPersianDigits(data.forwardedCount)} وظیفه به فردا منتقل و در تقویم زمان‌بندی هوشمند شد.`
        );
        fetchTasks();
        fetchCalendarBlocks();
        window.dispatchEvent(new CustomEvent("reminders-updated"));
      } else {
        setRolloverMessage(data.error || "خطا در انتقال وظایف");
      }
    } catch (e: any) {
      setRolloverMessage("خطا در ارتباط با سرور");
    } finally {
      setIsRollingOver(false);
    }
  };


  const [routineSteps, setRoutineSteps] = useState([
    { id: 1, title: "بیدار شدن بدون اسنوز + مرتب کردن تخت", done: true },
    { id: 2, title: "نوشیدن ۵۰۰ میلی‌لیتر آب با نمک دریا و لیمو", done: true },
    { id: 3, title: "صبحانه پرپروتئین (تخم‌مرغ و جو دوسر)", done: true },
    { id: 4, title: "تأیید ۳ اقدام اصلی روز (Big 3)", done: true },
    { id: 5, title: "شروع کار عمیق (Deep Work رایش)", done: true },
  ]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        await saveLocalTasks(data.tasks);
        // Fetch all today tasks and big three tasks
        setTasks(data.tasks.filter((t: any) => (t.status === "today" || t.isBigThree) && t.status !== "scheduled"));
      }
    } catch (e) {
      console.error("fetchTasks failed, relying on local store:", e);
    }
  };

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      if (data.success && Array.isArray(data.habits)) {
        await saveLocalHabits(data.habits);
        setHabits(data.habits);
      }
    } catch (e) {
      console.error("fetchHabits failed, relying on local store:", e);
    }
  };

  const fetchCalendarBlocks = async () => {
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const res = await fetch(`/api/calendar?date=${yyyy}-${mm}-${dd}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.blocks)) {
        await saveLocalCalendarBlocks(data.blocks);
        setCalendarBlocks(data.blocks);
      }
    } catch (e) {
      console.error("Error loading today calendar blocks:", e);
    }
  };

  // 1. Initial hydration from IndexedDB before network fetch
  useEffect(() => {
    let mounted = true;
    getLocalTodayData()
      .then((local) => {
        if (!mounted) return;
        if (local.tasks && local.tasks.length > 0) {
          setTasks(local.tasks);
        }
        if (local.habits && local.habits.length > 0) {
          setHabits(local.habits);
        }
        if (local.calendarBlocks && local.calendarBlocks.length > 0) {
          setCalendarBlocks(local.calendarBlocks);
        }
      })
      .catch((err) => console.error("Error hydrating today from IndexedDB:", err));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchHabits();
    fetchCalendarBlocks();

    const handleRemindersUpdated = () => {
      fetchTasks();
      fetchCalendarBlocks();
    };

    window.addEventListener("reminders-updated", handleRemindersUpdated);
    return () => {
      window.removeEventListener("reminders-updated", handleRemindersUpdated);
    };
  }, []);

  const toggleTask = async (task: any) => {
    const isCompleted = task.status !== "completed";
    const nextStatus = isCompleted ? "completed" : "today";
    setTasks(
      tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    // Persist change to IndexedDB immediately
    await dbToggleLocalTask(task.id, isCompleted, false);

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, isCompleted }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.dispatchEvent(new Event("reminders-updated"));
    } catch (e) {
      console.warn("Network failed in toggleTask, queued in outbox:", e);
      await queueOfflineMutation("/api/tasks", "PATCH", { id: task.id, isCompleted }, task.id, "tasks");
    }
  };

  const toggleBigThree = async (task: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextVal = !task.isBigThree;
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, isBigThree: nextVal } : t)));

    // Persist change to IndexedDB immediately
    await dbToggleLocalBigThree(task.id, nextVal, false);

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, isBigThree: nextVal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.dispatchEvent(new Event("reminders-updated"));
    } catch (e) {
      console.warn("Network failed in toggleBigThree, queued in outbox:", e);
      await queueOfflineMutation("/api/tasks", "PATCH", { id: task.id, isBigThree: nextVal }, task.id, "tasks");
    }
  };

  const deleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("آیا از حذف این تسک اطمینان دارید؟")) return;
    setTasks(tasks.filter((t) => t.id !== taskId));

    // Persist change to IndexedDB immediately
    await dbDeleteLocalTask(taskId, false);

    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.dispatchEvent(new Event("reminders-updated"));
    } catch (e) {
      console.warn("Network failed in deleteTask, queued in outbox:", e);
      await queueOfflineMutation(`/api/tasks?id=${taskId}`, "DELETE", null, taskId, "tasks");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);

    const mappedPriority =
      selectedQuadrant === "Q1"
        ? "urgent"
        : selectedQuadrant === "Q2"
        ? "high"
        : selectedQuadrant === "Q3"
        ? "medium"
        : "low";

    const payload = {
      title: newTaskTitle.trim(),
      status: "today",
      isBigThree: isBigThreeChoice,
      eisenhowerQuadrant: selectedQuadrant,
      priority: mappedPriority,
      workType: selectedWorkType,
      estimatedMinutes: Number(estimatedMins) || 30,
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewTaskTitle("");
        await fetchTasks();
        window.dispatchEvent(new Event("reminders-updated"));
      } else {
        throw new Error(`Server status ${res.status}`);
      }
    } catch (err) {
      console.warn("Failed to create task online, saving locally to IndexedDB & queueing in outbox:", err);
      const localTask = await createLocalTask(payload, true);
      setTasks((prev) => [localTask, ...prev]);
      setNewTaskTitle("");
      window.dispatchEvent(new Event("reminders-updated"));
    } finally {
      setIsAddingTask(false);
    }
  };

  const addWater = async (amount = 250) => {
    setWaterMl((prev) => prev + amount);
    try {
      await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "water", waterAmount: amount }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHabit = async (habit: any) => {
    const nextCompleted = !habit.todayDone;
    const nextStreak = nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    setHabits(
      habits.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              todayDone: nextCompleted,
              streak: nextStreak,
            }
          : h
      )
    );

    // Persist change to IndexedDB immediately
    await dbToggleLocalHabit(habit.id, nextCompleted, false);

    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: habit.id, completed: nextCompleted }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn("Network failed in toggleHabit, queued in outbox:", e);
      await queueOfflineMutation("/api/habits", "PATCH", { habitId: habit.id, completed: nextCompleted }, habit.id, "habits");
    }
  };

  const big3 = tasks.filter((t) => t.isBigThree);
  const otherTasks = tasks.filter((t) => !t.isBigThree);

  const quadrantsList: Array<"Q1" | "Q2" | "Q3" | "Q4"> = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div className="space-y-6 animate-fade-in bg-white pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-black text-white shadow-sm">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">صفحه اجرای تعاملی امروز (Today Focus)</h2>
            <p className="text-xs text-zinc-500">
              مدیریت اقدامات ۳گانه طلایی، اولویت‌بندی رنگی آیزنهاور، تیک زدن عادات و روتین‌های زیستی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold">
            تمرکز روز: کار عمیق و دخل مغازه
          </span>
        </div>
      </div>

      {/* Rollover to Tomorrow Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800 text-amber-400 border border-zinc-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">انتقال کارهای انجام‌نشده به فردا و زمان‌بندی هوشمند</h4>
            <p className="text-xs text-zinc-400">
              تسک‌های ناتمام امروز را به برنامه فردا منتقل کرده و در اسلات‌های خالی تقویم قرار می‌دهد.
            </p>
          </div>
        </div>
        <button
          onClick={handleRollover}
          disabled={isRollingOver}
          className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-100 disabled:opacity-50 text-xs font-black shrink-0 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {isRollingOver ? (
            <span>در حال انتقال و زمان‌بندی...</span>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 rotate-180" />
              <span>انتقال کارهای انجام‌نشده به فردا</span>
            </>
          )}
        </button>
      </div>
      {rolloverMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <span>{rolloverMessage}</span>
          <button onClick={() => setRolloverMessage(null)} className="text-emerald-700 hover:text-emerald-950">✕</button>
        </div>
      )}

      {/* Grid: Big 3 & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Goal Slip Recovery & Dispatched Goals Widget */}
          <DailyGoalRecoveryWidget />

          {/* Big 3 Card */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-950">اقدامات سه‌گانه طلایی امروز (Today's Big 3)</h3>
                  <p className="text-[11px] text-zinc-500">
                    مهم‌ترین کارهایی که در صورت انجام آن‌ها، امروز یک روز موفق خواهد بود ({toPersianDigits(big3.length)} مورد)
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
                کلیک برای تغییر وضعیت یا ستاره‌دار کردن
              </span>
            </div>

            {/* List of Big 3 Tasks */}
            <div className="space-y-2.5">
              {big3.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-zinc-50 border border-dashed border-zinc-300 text-zinc-500 text-xs space-y-1.5">
                  <Star className="w-8 h-8 mx-auto text-amber-400 opacity-60" />
                  <p className="font-bold text-zinc-800">هیچ اقدام طلایی هنوز برای امروز انتخاب نشده است.</p>
                  <p className="text-[11px] text-zinc-400">
                    با استفاده از فرم زیر تسک جدید اضافه کنید یا روی ستاره تسک‌های موجود کلیک نمایید.
                  </p>
                </div>
              ) : (
                big3.map((task, idx) => {
                  const isDone = task.status === "completed";
                  const qMeta = getQuadrantMeta(task.eisenhowerQuadrant, task.priority);

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isDone
                          ? "bg-zinc-50/70 border-zinc-200 opacity-60"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Index Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black flex items-center justify-center shrink-0">
                          {toPersianDigits(idx + 1)}
                        </div>

                        {/* Checkbox */}
                        <div className="shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-black" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-400 hover:text-black transition-colors" />
                          )}
                        </div>

                        {/* Title & Badges */}
                        <div>
                          <p
                            className={`text-xs font-bold leading-snug ${
                              isDone ? "line-through text-zinc-400" : "text-zinc-950"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                            {/* Color Coded Quadrant Badge */}
                            <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${qMeta.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${qMeta.dotClass}`} />
                              {qMeta.label}
                            </span>

                            {/* Work Type */}
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium border border-zinc-200">
                              {task.workType}
                            </span>

                            {task.area && (
                              <span className="text-zinc-500 font-medium">
                                • {task.area.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Star Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleBigThree(task, e)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                          title="حذف از اقدامات طلایی"
                        >
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => deleteTask(task.id, e)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          title="حذف تسک"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Task Box with Eisenhower Colors */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-black" />
                  افزودن تسک سریع با انتخاب اولویت و رنگ:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] text-zinc-500 hover:text-black font-semibold"
                >
                  {showAdvanced ? "بستن گزینه‌های پیشرفته" : "+ گزینه‌های بیشتر"}
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-3 text-xs">
                {/* Text Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="عنوان کار جدید برای امروز را وارد کنید..."
                    className="flex-1 bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-black font-medium shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={isAddingTask}
                    className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>{isAddingTask ? "در حال ثبت..." : "ثبت تسک"}</span>
                  </button>
                </div>

                {/* Eisenhower Quadrant Buttons (Colored & Selectable) */}
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold text-zinc-600">
                    انتخاب سطح فوریت و اهمیت (ماتریس آیزنهاور):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quadrantsList.map((qId) => {
                      const meta = getQuadrantMeta(qId);
                      const isSelected = selectedQuadrant === qId;
                      const Icon = meta.icon;

                      return (
                        <button
                          key={qId}
                          type="button"
                          onClick={() => setSelectedQuadrant(qId)}
                          className={`p-2 rounded-xl text-right transition-all flex flex-col justify-between border ${
                            isSelected ? meta.activeButtonClass : meta.idleButtonClass
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{meta.label}</span>
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                          </div>
                          <span
                            className={`text-[10px] mt-0.5 block ${
                              isSelected ? "text-white/80" : "text-zinc-500"
                            }`}
                          >
                            {meta.sublabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Big 3 Toggle & Advanced Fields */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-200/70 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBigThreeChoice}
                      onChange={(e) => setIsBigThreeChoice(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0 cursor-pointer"
                    />
                    <span className="font-bold text-zinc-900 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      تعیین به عنوان «اقدام طلایی» (Today's Big 3)
                    </span>
                  </label>

                  {showAdvanced && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 text-[11px]">نوع کار:</span>
                        <select
                          value={selectedWorkType}
                          onChange={(e) => setSelectedWorkType(e.target.value)}
                          className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-900 font-bold"
                        >
                          <option value="Deep Work">کار عمیق</option>
                          <option value="Shallow Work">کار کم‌عمق</option>
                          <option value="Admin">امور ادمین / دخل</option>
                          <option value="Learning">یادگیری و دانشگاه</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 text-[11px]">تخمین:</span>
                        <input
                          type="number"
                          value={estimatedMins}
                          onChange={(e) => setEstimatedMins(e.target.value)}
                          className="w-14 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-900 font-mono text-center"
                        />
                        <span className="text-[10px] text-zinc-400">دقیقه</span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Other Today Tasks List */}
            {otherTasks.length > 0 && (
              <div className="pt-3 border-t border-zinc-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700">
                    سایر تسک‌های روز جاری ({toPersianDigits(otherTasks.length)})
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    برای انتقال به اقدامات طلایی، روی آیکون ستاره کلیک کنید
                  </span>
                </div>

                <div className="space-y-1.5">
                  {otherTasks.map((t) => {
                    const isDone = t.status === "completed";
                    const qMeta = getQuadrantMeta(t.eisenhowerQuadrant, t.priority);

                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTask(t)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer select-none transition-all ${
                          isDone
                            ? "bg-zinc-50/60 border-zinc-200 opacity-60"
                            : "bg-white border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <p
                              className={`font-semibold ${
                                isDone ? "line-through text-zinc-400" : "text-zinc-900"
                              }`}
                            >
                              {t.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                              <span className={`px-1.5 py-0.2 rounded font-bold ${qMeta.badgeClass}`}>
                                {qMeta.label}
                              </span>
                              <span className="text-zinc-500">• {t.workType}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => toggleBigThree(t, e)}
                            className="p-1 text-zinc-400 hover:text-amber-500 rounded"
                            title="افزودن به اقدامات طلایی (Big 3)"
                          >
                            <Star className="w-4 h-4 text-zinc-400 hover:fill-amber-400 hover:text-amber-500" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteTask(t.id, e)}
                            className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                            title="حذف تسک"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Time Blocks */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">جدول زمانی و بلوک‌های تمرکز امروز</h3>
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                {calendarBlocks.length > 0
                  ? `${toPersianDigits(calendarBlocks.length)} بلوک تقویم امروز`
                  : "الگوی روز طلایی"}
              </span>
            </div>

            <div className="space-y-2">
              {calendarBlocks.length > 0 ? (
                calendarBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-zinc-500 min-w-[90px] text-left">
                        {b.timeFormatted ||
                          (b.start && b.end
                            ? `${new Date(b.start).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} - ${new Date(b.end).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`
                            : "ساعت مقرر")}
                      </span>
                      <span className="font-medium text-zinc-900">{b.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.type === "Deep Work"
                          ? "badge-deep-work"
                          : b.type === "Health" || b.type === "Rest"
                          ? "badge-health"
                          : b.type === "Admin"
                          ? "badge-admin"
                          : "badge-shallow-work"
                      }`}
                    >
                      {b.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500">
                  <Clock className="w-6 h-6 mx-auto mb-1.5 text-zinc-400 opacity-50" />
                  <p className="font-medium text-zinc-800">هیچ بلوک زمانی برای امروز در تقویم ثبت نشده است.</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    از منوی برنامه‌ریز تقویم یا موتور هوشمند زمان‌بندی برای ایجاد بلوک‌های کار عمیق استفاده کنید.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tomorrow's Agenda Card (D-1 Reminders & Focus Planning) */}
          <TomorrowAgendaWidget />

          {/* Quick Health & Water Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Water Interactive */}
            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">هیدراتاسیون آب</p>
                  <p className="text-[11px] text-zinc-950 font-bold">{toPersianDigits(waterMl)} / ۳,۰۰۰ ml</p>
                </div>
              </div>
              <button
                onClick={() => addWater(250)}
                className="text-xs text-white bg-black hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors font-bold shadow-sm"
              >
                + ۱ لیوان
              </button>
            </div>

            {/* Nutrition */}
            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">کالری و پروتئین</p>
                  <p className="text-[11px] text-zinc-500">۲,۳۴۰ kcal • ۱۵۸g پروتئین</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-800 font-bold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">تکمیل</span>
            </div>

            {/* Buffet Cash Register */}
            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">دخل بوفه و فروشگاه</p>
                  <p className="text-[11px] text-zinc-950 font-bold">{formatCurrency(7850000)}</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-800 font-bold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">بالانس</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Routines & Habits */}
        <div className="space-y-6">
          {/* Morning Routine Checklist */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">چک‌لیست روتین صبحگاهی</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold border border-zinc-200">
                استریک ۳۴ روز
              </span>
            </div>

            <div className="space-y-1.5">
              {routineSteps.map((step) => (
                <label
                  key={step.id}
                  className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 flex items-center gap-2.5 text-xs cursor-pointer select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() =>
                      setRoutineSteps(
                        routineSteps.map((s) => (s.id === step.id ? { ...s, done: !s.done } : s))
                      )
                    }
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0"
                  />
                  <span className={step.done ? "line-through text-zinc-400 font-medium" : "text-zinc-900 font-medium"}>
                    {step.title}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Daily Habits Tracker */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">عادات اتمی و عملکردی</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">ردیابی تعاملی</span>
            </div>

            <div className="space-y-2">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => toggleHabit(habit)}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 flex items-center justify-between text-xs cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={habit.todayDone}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className={habit.todayDone ? "line-through text-zinc-400 font-semibold" : "text-zinc-900 font-semibold"}>
                        {habit.title}
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{habit.triggerCondition}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-bold">
                    🔥 {toPersianDigits(habit.streak)} روز
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
