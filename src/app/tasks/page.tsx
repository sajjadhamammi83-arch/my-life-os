"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  X,
  ArrowRight,
  Flame,
  Star,
  AlertCircle,
  Target,
  Zap,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";
import {
  getLocalTasks,
  saveLocalTasks,
  createLocalTask,
  toggleLocalTask as dbToggleLocalTask,
  toggleLocalBigThree as dbToggleLocalBigThree,
  deleteLocalTask as dbDeleteLocalTask,
  queueOfflineMutation,
} from "@/lib/pwa/local-store";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  const [quadrant, setQuadrant] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q1");
  const [isBigThree, setIsBigThree] = useState(false);
  const [workType, setWorkType] = useState("Deep Work");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        await saveLocalTasks(data.tasks);
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error("fetchTasks failed, relying on local store:", e);
    }
  };

  // 1. Initial hydration from IndexedDB before network fetch
  useEffect(() => {
    let mounted = true;
    getLocalTasks()
      .then((local) => {
        if (!mounted) return;
        if (local && local.length > 0) {
          setTasks(local);
        }
      })
      .catch((err) => console.error("Error hydrating tasks from IndexedDB:", err));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const priority =
      quadrant === "Q1" ? "urgent" : quadrant === "Q2" ? "high" : quadrant === "Q3" ? "medium" : "low";

    const payload = {
      title: title.trim(),
      areaId: areaId || undefined,
      eisenhowerQuadrant: quadrant,
      workType,
      estimatedMinutes: Number(estimatedMinutes),
      priority,
      isBigThree,
      status: "today",
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTitle("");
        setIsModalOpen(false);
        fetchTasks();
        window.dispatchEvent(new Event("reminders-updated"));
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err) {
      console.warn("Failed to create task online, saving locally to IndexedDB & queueing in outbox:", err);
      const localTask = await createLocalTask(payload, true);
      setTasks((prev) => [localTask, ...prev]);
      setTitle("");
      setIsModalOpen(false);
      window.dispatchEvent(new Event("reminders-updated"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: any) => {
    const isCompleted = task.status !== "completed";
    const nextStatus = isCompleted ? "completed" : "today";
    setTasks(
      tasks.map((t) =>
        t.id === task.id ? { ...t, status: nextStatus } : t
      )
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

  const deleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("آیا از حذف این تسک اطمینان دارید؟")) return;
    setTasks(tasks.filter((t) => t.id !== id));

    // Persist change to IndexedDB immediately
    await dbDeleteLocalTask(id, false);

    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.dispatchEvent(new Event("reminders-updated"));
    } catch (e) {
      console.warn("Network failed in deleteTask, queued in outbox:", e);
      await queueOfflineMutation(`/api/tasks?id=${id}`, "DELETE", null, id, "tasks");
    }
  };

  const q1 = tasks.filter((t) => t.eisenhowerQuadrant === "Q1");
  const q2 = tasks.filter((t) => t.eisenhowerQuadrant === "Q2");
  const q3 = tasks.filter((t) => t.eisenhowerQuadrant === "Q3");
  const q4 = tasks.filter((t) => t.eisenhowerQuadrant === "Q4");

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with New Task Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-black text-white shadow-sm">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">وظایف، اولویت‌بندی و ماتریس آیزنهاور (Eisenhower Matrix)</h2>
            <p className="text-xs text-zinc-500">
              تفکیک وظایف بر اساس فوریت و اهمیت با رنگ‌های متمایز و امکان تعیین اقدامات ۳گانه طلایی
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black shadow-sm transition-all active:scale-95 self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>افزودن تسک جدید</span>
        </button>
      </div>

      {/* Eisenhower Matrix 4 Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Q1: Urgent & Important - Rose/Red Theme */}
        <div className="p-5 rounded-2xl bg-white border-2 border-rose-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-xs shadow-sm">
                Q1
              </span>
              <div>
                <h4 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  سریع و فوری — فوراً انجام بده (Do First)
                </h4>
                <p className="text-[10px] text-rose-700">بحران‌ها، ددلاین‌های امروز و امور حیاتی</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {toPersianDigits(q1.length)} مورد
            </span>
          </div>

          <div className="space-y-2">
            {q1.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-3 text-center">هیچ تسک بحرانی در Q1 وجود ندارد.</p>
            ) : (
              q1.map((t) => {
                const isDone = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                      isDone
                        ? "bg-zinc-50/70 border-zinc-200 opacity-60"
                        : "bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:bg-rose-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-zinc-300 text-rose-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className={`text-xs font-bold ${isDone ? "line-through text-zinc-400" : "text-zinc-950"}`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                          {t.isBigThree && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              ⭐ اقدام طلایی
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{t.workType}</span>
                          <span>• {toPersianDigits(t.estimatedMinutes)} دقیقه</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleBigThree(t, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          t.isBigThree ? "text-amber-500 hover:bg-amber-50" : "text-zinc-400 hover:text-amber-500"
                        }`}
                        title={t.isBigThree ? "حذف از اقدامات طلایی" : "تبدیل به اقدام طلایی"}
                      >
                        <Star className={`w-4 h-4 ${t.isBigThree ? "fill-amber-400 text-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => deleteTask(t.id, e)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
        </div>

        {/* Q2: Important, Not Urgent - Blue Theme */}
        <div className="p-5 rounded-2xl bg-white border-2 border-blue-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-black text-xs shadow-sm">
                Q2
              </span>
              <div>
                <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  مهم، غیرفوری — زمان‌بندی و کار عمیق (Schedule)
                </h4>
                <p className="text-[10px] text-blue-700">توسعه نرم‌افزار، استراتژی، یادگیری و سلامتی</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {toPersianDigits(q2.length)} مورد
            </span>
          </div>

          <div className="space-y-2">
            {q2.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-3 text-center">هیچ تسکی در Q2 وجود ندارد.</p>
            ) : (
              q2.map((t) => {
                const isDone = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                      isDone
                        ? "bg-zinc-50/70 border-zinc-200 opacity-60"
                        : "bg-blue-50/40 border-blue-200 hover:border-blue-300 hover:bg-blue-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className={`text-xs font-bold ${isDone ? "line-through text-zinc-400" : "text-zinc-950"}`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                          {t.isBigThree && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              ⭐ اقدام طلایی
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{t.workType}</span>
                          <span>• {toPersianDigits(t.estimatedMinutes)} دقیقه</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleBigThree(t, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          t.isBigThree ? "text-amber-500 hover:bg-amber-50" : "text-zinc-400 hover:text-amber-500"
                        }`}
                        title={t.isBigThree ? "حذف از اقدامات طلایی" : "تبدیل به اقدام طلایی"}
                      >
                        <Star className={`w-4 h-4 ${t.isBigThree ? "fill-amber-400 text-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => deleteTask(t.id, e)}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
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
        </div>

        {/* Q3: Not Important, Urgent - Amber Theme */}
        <div className="p-5 rounded-2xl bg-white border-2 border-amber-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white font-black text-xs shadow-sm">
                Q3
              </span>
              <div>
                <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  فوری، نامهم — واگذاری یا سریع انجام بده (Delegate)
                </h4>
                <p className="text-[10px] text-amber-800">امور روتین، پاسخ پیام‌های متفرقه، کارهای کم‌اهمیت</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {toPersianDigits(q3.length)} مورد
            </span>
          </div>

          <div className="space-y-2">
            {q3.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-3 text-center">هیچ تسکی در Q3 وجود ندارد.</p>
            ) : (
              q3.map((t) => {
                const isDone = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                      isDone
                        ? "bg-zinc-50/70 border-zinc-200 opacity-60"
                        : "bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:bg-amber-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className={`text-xs font-bold ${isDone ? "line-through text-zinc-400" : "text-zinc-950"}`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{t.workType}</span>
                          <span>• {toPersianDigits(t.estimatedMinutes)} دقیقه</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleBigThree(t, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          t.isBigThree ? "text-amber-500 hover:bg-amber-50" : "text-zinc-400 hover:text-amber-500"
                        }`}
                        title={t.isBigThree ? "حذف از اقدامات طلایی" : "تبدیل به اقدام طلایی"}
                      >
                        <Star className={`w-4 h-4 ${t.isBigThree ? "fill-amber-400 text-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => deleteTask(t.id, e)}
                        className="p-1.5 text-zinc-400 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
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
        </div>

        {/* Q4: Not Urgent, Not Important - Emerald Theme */}
        <div className="p-5 rounded-2xl bg-white border-2 border-emerald-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-xs shadow-sm">
                Q4
              </span>
              <div>
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  غیرفوری، نامهم — حذف یا زمان استراحت (Eliminate)
                </h4>
                <p className="text-[10px] text-emerald-700">اتلاف وقت، وبگردی بی‌هدف و کارهای بی‌ارزش</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {toPersianDigits(q4.length)} مورد
            </span>
          </div>

          <div className="space-y-2">
            {q4.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-3 text-center">هیچ تسکی در Q4 ثبت نشده است.</p>
            ) : (
              q4.map((t) => {
                const isDone = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t)}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between select-none"
                  >
                    <p className={`text-xs ${isDone ? "line-through text-zinc-400" : "text-zinc-600"}`}>{t.title}</p>
                    <button
                      onClick={(e) => deleteTask(t.id, e)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                      title="حذف تسک"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal with Color Coded Quadrants */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-black text-white">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-zinc-950">افزودن تسک جدید با انتخاب سطح اولویت</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-950 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 mb-1 font-bold">عنوان وظیفه یا کار:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: طراحی استند جدید محصولات لافارر یا کدنویسی ماژول رایش..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-950 focus:outline-none focus:border-black font-medium"
                  autoFocus
                />
              </div>

              {/* Selectable Quadrant Buttons */}
              <div className="space-y-1.5">
                <label className="block text-zinc-700 font-bold">ناحیه اولویت آیزنهاور (Eisenhower Matrix):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuadrant("Q1")}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      quadrant === "Q1"
                        ? "bg-rose-600 text-white font-black shadow-sm ring-2 ring-rose-300 border-rose-600"
                        : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    <div>
                      <span className="font-black text-xs block">🚨 سریع و فوری (Q1)</span>
                      <span className={`text-[10px] ${quadrant === "Q1" ? "text-white/80" : "text-rose-600"}`}>
                        مهم و فوری — فوراً انجام بده
                      </span>
                    </div>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuadrant("Q2")}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      quadrant === "Q2"
                        ? "bg-blue-600 text-white font-black shadow-sm ring-2 ring-blue-300 border-blue-600"
                        : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <div>
                      <span className="font-black text-xs block">🎯 مهم اما غیرفوری (Q2)</span>
                      <span className={`text-[10px] ${quadrant === "Q2" ? "text-white/80" : "text-blue-600"}`}>
                        کار عمیق — برنامه‌ریزی کن
                      </span>
                    </div>
                    <Target className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuadrant("Q3")}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      quadrant === "Q3"
                        ? "bg-amber-500 text-white font-black shadow-sm ring-2 ring-amber-300 border-amber-500"
                        : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <div>
                      <span className="font-black text-xs block">⚡ فوری اما غیرمهم (Q3)</span>
                      <span className={`text-[10px] ${quadrant === "Q3" ? "text-white/80" : "text-amber-700"}`}>
                        امور روتین — واگذار یا سریع رد کن
                      </span>
                    </div>
                    <Zap className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuadrant("Q4")}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      quadrant === "Q4"
                        ? "bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-300 border-emerald-600"
                        : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <div>
                      <span className="font-black text-xs block">🌱 غیرفوری و غیرمهم (Q4)</span>
                      <span className={`text-[10px] ${quadrant === "Q4" ? "text-white/80" : "text-emerald-700"}`}>
                        کم‌ارزش — حذف یا تفریح
                      </span>
                    </div>
                    <Sparkles className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">نوع کار:</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium focus:outline-none focus:border-black"
                  >
                    <option value="Deep Work">کار عمیق (Deep Work)</option>
                    <option value="Shallow Work">کار کم‌عمق (Shallow)</option>
                    <option value="Admin">امور ادمین / دخل</option>
                    <option value="Learning">یادگیری و مطالعه</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">تخمین زمان (دقیقه):</label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Big 3 Checkbox */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBigThree}
                    onChange={(e) => setIsBigThree(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0 cursor-pointer"
                  />
                  <span className="font-bold text-amber-950 flex items-center gap-1 text-xs">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    قرار دادن مستقیم در اقدامات سه‌گانه طلایی امروز (Today's Big 3)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-black transition-all shadow-sm"
                >
                  {isSubmitting ? "در حال ثبت..." : "افزودن تسک"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
