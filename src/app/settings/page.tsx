"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  DollarSign,
  User,
  Shield,
  Download,
  Upload,
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("مدیر سیستم‌عامل زندگی");
  const [email, setEmail] = useState("director@lifeos.local");
  const [currency, setCurrency] = useState("تومان");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [calorieUnit, setCalorieUnit] = useState("kcal");
  const [weekStartDay, setWeekStartDay] = useState("saturday");
  const [theme, setTheme] = useState("dark");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.user) {
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setCurrency(data.user.currency || "تومان");
        setWeightUnit(data.user.weightUnit || "kg");
        setCalorieUnit(data.user.calorieUnit || "kcal");
        setWeekStartDay(data.user.weekStartDay || "saturday");
        setTheme(data.user.theme || "dark");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          currency,
          weightUnit,
          calorieUnit,
          weekStartDay,
          theme,
        }),
      });

      if (res.ok) {
        setSaveMessage("تنظیمات با موفقیت ذخیره و در دیتابیس پایدار شد ✓");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = "/api/settings/backup";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">تنظیمات سیستم‌عامل (Life OS Settings)</h2>
            <p className="text-xs text-zinc-500">
              شخصی‌سازی واحد پول (تومان/ریال)، تقویم، پشتیبان‌گیری زنده دیتابیس و مدیریت هویت کاربری
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all self-start md:self-center"
        >
          <Save className="w-4 h-4 text-zinc-950" />
          <span>{isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-950 rounded-xl text-xs font-bold text-center">
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Localization & Units */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-zinc-500" />
            بومی‌سازی، ارز و واحدهای اندازه‌گیری
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-500 mb-1.5 font-medium">واحد پول پیش‌فرض سیستم:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:border-white"
              >
                <option value="تومان">تومان (پیش‌فرض ایران)</option>
                <option value="ریال">ریال</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-500 mb-1.5 font-medium">واحد سنجش وزن:</label>
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:border-white"
                >
                  <option value="kg">کیلوگرم (kg)</option>
                  <option value="lbs">پوند (lbs)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1.5 font-medium">واحد انرژی تغذیه:</label>
                <select
                  value={calorieUnit}
                  onChange={(e) => setCalorieUnit(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:border-white"
                >
                  <option value="kcal">کیلوکالری (kcal)</option>
                  <option value="kJ">کیلوژول (kJ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 mb-1.5 font-medium">روز آغازین هفته کاری:</label>
              <select
                value={weekStartDay}
                onChange={(e) => setWeekStartDay(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:border-white"
              >
                <option value="saturday">شنبه (تقویم شمسی)</option>
                <option value="monday">دوشنبه (تقویم میلادی)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Profile & Identity */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            اطلاعات مدیر سیستم و هویت کاربری
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-500 mb-1.5 font-medium">نام و عنوان مدیر:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-zinc-500 mb-1.5 font-medium">پست الکترونیک سیستم:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Database Backup & Export */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" />
            پشتیبان‌گیری زنده و امنیت داده‌ها (Database Backup & Restore)
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <h4 className="font-bold text-xs text-zinc-950 mb-1">دانلود فایل پایگاه داده SQLite</h4>
              <p className="text-[11px] text-zinc-500">
                پشتیبان‌گیری کامل از تمام جداول (اهداف، تراکنش‌های مالی، کالاها، خواب، وظایف و تنظیمات)
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Download className="w-4 h-4 text-zinc-950" />
              <span>دانلود فایل پشتیبان (Backup)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
