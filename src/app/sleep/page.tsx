"use client";

import { useState, useEffect } from "react";
import {
  Moon,
  Sparkles,
  Clock,
  Zap,
  Plus,
  X,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { toPersianDigits, calculateSleepEfficiency } from "@/lib/utils";

export default function SleepPage() {
  const [sleep, setSleep] = useState({
    bedTime: "۲۳:۲۰",
    finalWakeTime: "۰۶:۴۵",
    outOfBedTime: "۰۷:۰۰",
    timeInBedMinutes: 445,
    totalSleepTimeMinutes: 412,
    sleepEfficiency: 92.5,
    morningEnergy: 8,
    perceivedQuality: 9,
    notes: "خواب عمیق و ریکاوری کامل پس از تمرین باشگاه",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bedTime, setBedTime] = useState("۲۳:۲۰");
  const [wakeTime, setWakeTime] = useState("۰۶:۴۵");
  const [tib, setTib] = useState(445);
  const [tst, setTst] = useState(412);
  const [energy, setEnergy] = useState(8);
  const [quality, setQuality] = useState(9);

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    const eff = calculateSleepEfficiency(Number(tst), Number(tib));

    const updated = {
      bedTime,
      finalWakeTime: wakeTime,
      outOfBedTime: "۰۷:۰۰",
      timeInBedMinutes: Number(tib),
      totalSleepTimeMinutes: Number(tst),
      sleepEfficiency: eff,
      morningEnergy: Number(energy),
      perceivedQuality: Number(quality),
      notes: "ثبت زنده خواب",
    };

    setSleep(updated);
    setIsModalOpen(false);

    try {
      await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
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
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">دفترچه خواب و ریکاوری ذهنی (Sleep & Circadian Rhythms)</h2>
            <p className="text-xs text-zinc-500">
              فرمول دقیق Sleep Efficiency = TST / TIB × ۱۰۰ و پایش هوشیاری صبحگاهی
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>ثبت گزارش خواب دیشب</span>
        </button>
      </div>

      {/* 4 Sleep Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <span className="text-xs font-semibold text-zinc-500">بهره‌وری خواب (Sleep Efficiency)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{toPersianDigits(sleep.sleepEfficiency)}٪</span>
            <span className="text-xs text-zinc-600 font-bold">عالی (&gt; ۸۵٪)</span>
          </div>
          <p className="text-[11px] text-zinc-500">فرمول: خواب خالص تقسیم بر زمان در تخت</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <span className="text-xs font-semibold text-zinc-500">زمان خواب خالص (TST)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">
              {toPersianDigits(Math.floor(sleep.totalSleepTimeMinutes / 60))} ساعت و{" "}
              {toPersianDigits(sleep.totalSleepTimeMinutes % 60)} دقیقه
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">خواب عمیق بدون احتساب بیداری شبانه</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <span className="text-xs font-semibold text-zinc-500">زمان در تخت (TIB)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-800">
              {toPersianDigits(Math.floor(sleep.timeInBedMinutes / 60))} ساعت و{" "}
              {toPersianDigits(sleep.timeInBedMinutes % 60)} دقیقه
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">خواب: {sleep.bedTime} • بیداری: {sleep.finalWakeTime}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2">
          <span className="text-xs font-semibold text-zinc-500">انرژی اول صبح</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{toPersianDigits(sleep.morningEnergy)}</span>
            <span className="text-xs text-zinc-500">/ ۱۰</span>
          </div>
          <p className="text-[11px] text-zinc-500">کیفیت ادراک‌شده: {toPersianDigits(sleep.perceivedQuality)}/۱۰</p>
        </div>
      </div>

      {/* Sleep Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت گزارش خواب دیشب</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSleep} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">ساعت ورود به تخت:</label>
                  <input
                    type="text"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    placeholder="۲۳:۱۵"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">ساعت بیداری نهایی:</label>
                  <input
                    type="text"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    placeholder="۰۶:۴۵"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">زمان در تخت (دقیقه):</label>
                  <input
                    type="number"
                    value={tib}
                    onChange={(e) => setTib(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">زمان خالص خواب (دقیقه):</label>
                  <input
                    type="number"
                    value={tst}
                    onChange={(e) => setTst(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">انرژی اول صبح (۱ تا ۱۰):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">کیفیت خواب (۱ تا ۱۰):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
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
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  محاسبه و ثبت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
