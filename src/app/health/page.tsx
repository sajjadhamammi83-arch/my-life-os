"use client";

import { useState, useEffect } from "react";
import {
  HeartPulse,
  Scale,
  Utensils,
  Dumbbell,
  Droplet,
  Mic,
  Plus,
  X,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function HealthPage() {
  const [weight, setWeight] = useState(78.8);
  const [waist, setWaist] = useState(83);
  const [waterMl, setWaterMl] = useState(2800);
  const [meals, setMeals] = useState([
    { id: 1, mealType: "صبحانه", title: "املت ۴ سفیده تخم‌مرغ با نان سنگک", calories: 480, protein: 32 },
    { id: 2, mealType: "شیک بوفه", title: "شیک پروتئین وی کاله با موز و شیر کم‌چرب", calories: 340, protein: 30 },
    { id: 3, mealType: "ناهار", title: "سینه مرغ گریل شده ۲۰۰ گرم + برنج کته", calories: 650, protein: 55 },
    { id: 4, mealType: "شام", title: "فیله ماهی قزل‌آلا با سبزیجات بخارپز", calories: 520, protein: 42 },
  ]);

  // Modals
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  // Form states
  const [newWeight, setNewWeight] = useState("");
  const [newWaist, setNewWaist] = useState("");
  const [mealType, setMealType] = useState("شیک بوفه");
  const [mealTitle, setMealTitle] = useState("");
  const [mealCals, setMealCals] = useState("");
  const [mealProt, setMealProt] = useState("");

  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProt = meals.reduce((sum, m) => sum + m.protein, 0);

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(newWeight);
    if (!w) return;

    setWeight(w);
    if (newWaist) setWaist(Number(newWaist));
    setIsWeightModalOpen(false);

    try {
      await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "weight", weight: w, waist: newWaist }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealTitle.trim()) return;

    const newEntry = {
      id: Date.now(),
      mealType,
      title: mealTitle,
      calories: Number(mealCals) || 300,
      protein: Number(mealProt) || 25,
    };

    setMeals([...meals, newEntry]);
    setIsMealModalOpen(false);
    setMealTitle("");
    setMealCals("");
    setMealProt("");

    try {
      await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "meal",
          mealType,
          mealTitle,
          calories: newEntry.calories,
          protein: newEntry.protein,
        }),
      });
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">سلامت، تغذیه، تمرین و بوفه (Bio-Optimization)</h2>
            <p className="text-xs text-zinc-500">
              ثبت زنده وزن، ماکروهای تغذیه‌ای، هیدراتاسیون و حجم تمرینات باشگاهی
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md"
          >
            <Scale className="w-4 h-4 text-zinc-950" />
            <span>ثبت وزن امروز</span>
          </button>
          <button
            onClick={() => setIsMealModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all border border-zinc-300"
          >
            <Utensils className="w-4 h-4 text-zinc-600" />
            <span>ثبت وعده غذایی / شیک</span>
          </button>
        </div>
      </div>

      {/* Top 4 Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weight */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">وزن ناشتا</span>
            <Scale className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{toPersianDigits(weight)}</span>
            <span className="text-xs text-zinc-500">کیلوگرم</span>
          </div>
          <p className="text-[11px] text-zinc-500 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-zinc-950" />
            <span>۵.۷ کیلوگرم کاهش چربی در ۹۰ روز</span>
          </p>
        </div>

        {/* Calories & Protein */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">کالری و پروتئین روزانه</span>
            <Utensils className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{toPersianDigits(totalCals)}</span>
            <span className="text-xs text-zinc-500">/ ۲,۴۰۰ kcal</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            پروتئین: <strong className="text-zinc-950">{toPersianDigits(totalProt)}g</strong> (هدف: ۱۵۰g)
          </p>
        </div>

        {/* Hydration */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">هیدراتاسیون آب</span>
            <Droplet className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{toPersianDigits(waterMl)}</span>
            <span className="text-xs text-zinc-500">/ ۳,۰۰۰ ml</span>
          </div>
          <button
            onClick={() => addWater(250)}
            className="w-full py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors border border-zinc-300"
          >
            + نوشیدن ۱ لیوان آب (۲۵۰ml)
          </button>
        </div>

        {/* Voice Practice */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">تمرین صداسازی و بیان</span>
            <Mic className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{toPersianDigits(15)}</span>
            <span className="text-xs text-zinc-500">دقیقه تمرین روزانه</span>
          </div>
          <p className="text-[11px] text-zinc-500">تنفس دیافراگمی و رزونانس صوتی</p>
        </div>
      </div>

      {/* Meals Table & Gym Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <h3 className="font-bold text-sm text-zinc-950">وعده‌های غذایی ثبت‌شده امروز</h3>
          <div className="space-y-2">
            {meals.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold text-[10px]">
                      {m.mealType}
                    </span>
                    <span className="font-semibold text-zinc-950">{m.title}</span>
                  </div>
                </div>
                <div className="text-left font-mono text-zinc-500">
                  <span className="text-zinc-950 font-bold">{toPersianDigits(m.calories)} kcal</span> •{" "}
                  <span>{toPersianDigits(m.protein)}g P</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workout Plan */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-zinc-500" />
              برنامه تمرینی باشگاه بدنسازی
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">
              فاز هایپرتروفی
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: "زیربغل لت سیم‌کش دست باز", sets: "۴ ست × ۱۰-۱۲ تکرار (۶۵ کیلو)" },
              { name: "زیربغل قایقی سیم‌کش", sets: "۴ ست × ۱۰ تکرار (۶۰ کیلو)" },
              { name: "پرس سرشانه دمبل", sets: "۳ ست × ۱۲ تکرار (دمبل ۲۰ کیلویی)" },
              { name: "نشر جانب دمبل کنترل‌شده", sets: "۴ ست × ۱۵ تکرار (دمبل ۱۰ کیلویی)" },
            ].map((w, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between"
              >
                <span className="font-semibold text-zinc-950">{w.name}</span>
                <span className="text-zinc-500 font-mono">{w.sets}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت اندازه‌گیری وزن و دور کمر</h3>
              <button onClick={() => setIsWeightModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">وزن ناشتا (کیلوگرم):</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="۷۸.۸"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">دور کمر (سانتی‌متر):</label>
                <input
                  type="number"
                  step="0.5"
                  value={newWaist}
                  onChange={(e) => setNewWaist(e.target.value)}
                  placeholder="۸۳"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  ثبت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Modal */}
      {isMealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت وعده غذایی یا شیک بوفه</h3>
              <button onClick={() => setIsMealModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">نوع وعده:</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                >
                  <option value="شیک بوفه">شیک پروتئینی بوفه</option>
                  <option value="صبحانه">صبحانه</option>
                  <option value="ناهار">ناهار</option>
                  <option value="شام">شام</option>
                  <option value="میان‌وعده">میان‌وعده</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان غذا / مکمل:</label>
                <input
                  type="text"
                  required
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  placeholder="شیک وی کاله با موز و جو دوسر"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">کالری (kcal):</label>
                  <input
                    type="number"
                    value={mealCals}
                    onChange={(e) => setMealCals(e.target.value)}
                    placeholder="۳۵۰"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">پروتئین (گرم):</label>
                  <input
                    type="number"
                    value={mealProt}
                    onChange={(e) => setMealProt(e.target.value)}
                    placeholder="۳۰"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsMealModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  ثبت وعده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
