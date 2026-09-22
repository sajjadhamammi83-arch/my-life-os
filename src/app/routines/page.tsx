"use client";

import { useState, useEffect } from "react";
import {
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function RoutinesPage() {
  const [morningSteps, setMorningSteps] = useState([
    { id: "m1", title: "بیدار شدن بدون اسنوز و مرتب کردن تخت خواب", duration: 3, done: true, phase: "فاز ۱: فعال‌سازی زیستی" },
    { id: "m2", title: "نوشیدن ۵۰۰ میلی‌لیتر آب خنک با نمک دریا و لیمو", duration: 2, done: true, phase: "فاز ۱: فعال‌سازی زیستی" },
    { id: "m3", title: "۱۰ دقیقه کشش و تابش نور خورشید به چشم", duration: 10, done: true, phase: "فاز ۱: فعال‌سازی زیستی" },
    { id: "m4", title: "صبحانه پرپروتئین (۴ عدد سفیده تخم‌مرغ + جو دوسر)", duration: 15, done: true, phase: "فاز ۲: تغذیه و صداسازی" },
    { id: "m5", title: "تمرین صداسازی و تنفس دیافراگمی", duration: 10, done: true, phase: "فاز ۲: تغذیه و صداسازی" },
    { id: "m6", title: "تأیید ۳ اقدام اصلی روز (Today's Big 3)", duration: 5, done: true, phase: "فاز ۳: تمرکز و شروع کار" },
  ]);

  const [nightSteps, setNightSteps] = useState([
    { id: "n1", title: "بستن دخل روزانه بوفه باشگاه و فروشگاه آرایشی در Life OS", duration: 10, done: true, phase: "فاز ۱: دخل و تدارکات" },
    { id: "n2", title: "آماده‌سازی وسایل تمرین و لباس‌های ورزشی فردا", duration: 10, done: true, phase: "فاز ۱: دخل و تدارکات" },
    { id: "n3", title: "پاسخ به ۳ پرسش ژورنال روزانه (چه عالی بود؟ چه آموختم؟)", duration: 10, done: true, phase: "فاز ۲: ژورنال و خاموشی" },
    { id: "n4", title: "تاریکی مطلق اتاق خواب، دمای ۱۹ درجه و ورود به تخت", duration: 10, done: false, phase: "فاز ۲: ژورنال و خاموشی" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stepType, setStepType] = useState<"morning" | "night">("morning");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDuration, setNewStepDuration] = useState("5");

  const loadRoutines = async () => {
    try {
      const res = await fetch("/api/routines");
      const data = await res.json();
      if (data.success && data.routines && data.routines.length > 0) {
        const m = data.routines.find((r: any) => r.type === "morning");
        const n = data.routines.find((r: any) => r.type === "night");
        if (m && m.phases) {
          const allM = m.phases.flatMap((ph: any) =>
            ph.steps.map((st: any) => ({
              id: st.id,
              title: st.title,
              duration: st.durationMin,
              done: st.isCompleted,
              phase: ph.name,
            }))
          );
          if (allM.length > 0) setMorningSteps(allM);
        }
        if (n && n.phases) {
          const allN = n.phases.flatMap((ph: any) =>
            ph.steps.map((st: any) => ({
              id: st.id,
              title: st.title,
              duration: st.durationMin,
              done: st.isCompleted,
              phase: ph.name,
            }))
          );
          if (allN.length > 0) setNightSteps(allN);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const toggleStep = async (type: "morning" | "night", id: string) => {
    let nextDone = false;
    if (type === "morning") {
      setMorningSteps(
        morningSteps.map((s) => {
          if (s.id === id) {
            nextDone = !s.done;
            return { ...s, done: nextDone };
          }
          return s;
        })
      );
    } else {
      setNightSteps(
        nightSteps.map((s) => {
          if (s.id === id) {
            nextDone = !s.done;
            return { ...s, done: nextDone };
          }
          return s;
        })
      );
    }

    try {
      await fetch("/api/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: id, isCompleted: nextDone }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineType: stepType,
          title: newStepTitle,
          durationMin: Number(newStepDuration) || 5,
        }),
      });
      if (res.ok) {
        setNewStepTitle("");
        setIsModalOpen(false);
        loadRoutines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStep = (type: "morning" | "night", id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "morning") {
      setMorningSteps(morningSteps.filter((s) => s.id !== id));
    } else {
      setNightSteps(nightSteps.filter((s) => s.id !== id));
    }
  };

  const morningDoneCount = morningSteps.filter((s) => s.done).length;
  const nightDoneCount = nightSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">روتین‌های زیستی و ذهنی (Morning & Night Protocols)</h2>
            <p className="text-xs text-zinc-500">
              چک‌لیست تعاملی روتین صبحگاهی برای شروع انفجاری و روتین شبانه برای خواب عمیق ترمیمی
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setStepType("morning");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>گام روتین صبح</span>
          </button>
          <button
            onClick={() => {
              setStepType("night");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all border border-zinc-300"
          >
            <Plus className="w-4 h-4 text-zinc-600" />
            <span>گام روتین شب</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Routine Card */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-950">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-950">روتین صبحگاهی طلایی</h3>
                <p className="text-[11px] text-zinc-500">ساعت ۰۶:۰۰ • بیدار شدن بدون اسنوز</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-950 border border-zinc-300">
              {toPersianDigits(morningDoneCount)} از {toPersianDigits(morningSteps.length)} انجام شد
            </span>
          </div>

          <div className="space-y-2">
            {morningSteps.map((step) => (
              <label
                key={step.id}
                onClick={() => toggleStep("morning", step.id)}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors select-none ${
                  step.done
                    ? "bg-zinc-50 border-zinc-200"
                    : "bg-zinc-50/40 border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-zinc-300 bg-white text-zinc-950 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className={`font-semibold ${step.done ? "text-zinc-950" : "text-zinc-500"}`}>
                      {step.title}
                    </p>
                    <span className="text-[10px] text-zinc-500">{step.phase}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {toPersianDigits(step.duration)} دقیقه
                  </span>
                  <button
                    onClick={(e) => handleDeleteStep("morning", step.id, e)}
                    className="p-1 text-zinc-500 hover:text-zinc-950"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Night Routine Card */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-950">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-950">روتین شبانه و تخلیه ذهنی</h3>
                <p className="text-[11px] text-zinc-500">ساعت ۲۲:۰۰ • خاموشی کامل مانیتور و گوشی</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-950 border border-zinc-300">
              {toPersianDigits(nightDoneCount)} از {toPersianDigits(nightSteps.length)} انجام شد
            </span>
          </div>

          <div className="space-y-2">
            {nightSteps.map((step) => (
              <label
                key={step.id}
                onClick={() => toggleStep("night", step.id)}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors select-none ${
                  step.done
                    ? "bg-zinc-50 border-zinc-200"
                    : "bg-zinc-50/40 border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-zinc-300 bg-white text-zinc-950 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className={`font-semibold ${step.done ? "text-zinc-950" : "text-zinc-500"}`}>
                      {step.title}
                    </p>
                    <span className="text-[10px] text-zinc-500">{step.phase}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {toPersianDigits(step.duration)} دقیقه
                  </span>
                  <button
                    onClick={(e) => handleDeleteStep("night", step.id, e)}
                    className="p-1 text-zinc-500 hover:text-zinc-950"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Add Step Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                افزودن مرحله به {stepType === "morning" ? "روتین صبح" : "روتین شب"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStep} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان اقدام:</label>
                <input
                  type="text"
                  required
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="مثلاً: دوش آب سرد و فعال‌سازی تنفس"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">مدت زمان (دقیقه):</label>
                <input
                  type="number"
                  value={newStepDuration}
                  onChange={(e) => setNewStepDuration(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                />
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
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  افزودن مرحله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
