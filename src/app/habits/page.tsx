"use client";

import { useState, useEffect } from "react";
import {
  RotateCcw,
  Flame,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [preferredTime, setPreferredTime] = useState("صبح");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("مرتبه");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      if (data.success) setHabits(data.habits);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const toggleHabitToday = async (habit: any) => {
    const isDone = habit.todayDone !== undefined ? !habit.todayDone : false;
    setHabits(
      habits.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              todayDone: isDone,
              streak: isDone ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      )
    );

    try {
      await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: habit.id, completed: isDone }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          frequency,
          preferredTime,
          target: Number(target),
          unit,
        }),
      });

      if (res.ok) {
        setTitle("");
        setIsModalOpen(false);
        fetchHabits();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">ردیابی عادات و استریک‌ها (Habits & Streaks)</h2>
            <p className="text-xs text-zinc-500">
              روی هر عادت کلیک کنید تا تیک امروز زده شود و استریک روزانه افزایش یابد
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>عادت جدید</span>
        </button>
      </div>

      {/* Habits Grid */}
      <div className="space-y-3">
        {habits.map((h) => {
          const isDone = h.todayDone !== undefined ? h.todayDone : true;
          return (
            <div
              key={h.id}
              onClick={() => toggleHabitToday(h)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
                isDone
                  ? "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                  : "bg-zinc-50/40 border-zinc-200 hover:border-zinc-750"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-zinc-300 bg-white text-zinc-950 focus:ring-0 cursor-pointer"
                  />
                  <h3 className={`font-bold text-sm ${isDone ? "text-zinc-950" : "text-zinc-500"}`}>
                    {h.title}
                  </h3>
                  {h.area && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                      {h.area.name}
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold border border-zinc-300">
                    {toPersianDigits(h.streak)} روز پیوسته
                  </span>
                </div>
                <p className="text-xs text-zinc-500 pr-7">
                  زمان: {h.preferredTime} • هدف: {toPersianDigits(h.target)} {h.unit} • نرخ موفقیت: {toPersianDigits(h.completionRate)}٪
                </p>
              </div>

              {/* 7 Days Mini Heatmap */}
              <div className="flex items-center gap-1.5 self-end md:self-center pr-7 md:pr-0">
                {weekDays.map((d, idx) => {
                  const isDayDone = idx < 6 || isDone;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-zinc-500">{d}</span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isDayDone
                            ? "bg-black text-white font-black"
                            : "bg-white text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {isDayDone ? "✓" : "○"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">تعریف عادت جدید</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان عادت:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: ۲۰ دقیقه تمرین تنفس و صداسازی"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">دوره تکرار:</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                  >
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">زمان ترجیحی:</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                  >
                    <option value="صبح">صبح</option>
                    <option value="ظهر">ظهر</option>
                    <option value="شب">شب</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">هدف عددی:</label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">واحد:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  {isSubmitting ? "در حال ثبت..." : "افزودن عادت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
