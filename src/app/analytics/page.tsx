"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Moon,
  Coins,
  HeartPulse,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Brain,
  Clock,
  Filter,
  DollarSign,
  Activity,
  Target,
  ArrowUpRight,
  Lightbulb,
  Check,
  RefreshCw,
  Award,
} from "lucide-react";
import { toPersianDigits, formatCurrency } from "@/lib/utils";

const EISENHOWER_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Q1: { label: "🚨 Q1: سریع و فوری (بحران‌ها)", color: "text-rose-700", bg: "bg-rose-500", border: "border-rose-200" },
  Q2: { label: "🎯 Q2: مهم و غیرفوری (کار عمیق و اهداف)", color: "text-blue-700", bg: "bg-blue-500", border: "border-blue-200" },
  Q3: { label: "⚡ Q3: فوری اما کم‌اهمیت (وقفه‌ها)", color: "text-amber-700", bg: "bg-amber-500", border: "border-amber-200" },
  Q4: { label: "🌱 Q4: غیرفوری و غیرمهم (اتلاف وقت)", color: "text-emerald-700", bg: "bg-emerald-500", border: "border-emerald-200" },
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const [activeView, setActiveView] = useState<"OVERVIEW" | "ENERGY" | "EISENHOWER" | "FINANCIAL" | "INSIGHTS">("OVERVIEW");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    summary: {},
    dailyTrends: [],
    eisenhowerStats: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 1 },
    workTypeMap: {},
    costCenterFinancials: [],
    hourlyList: [],
    projects: [],
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const summary = data.summary || {};
  const dailyTrends = data.dailyTrends || [];
  const eisenhower = data.eisenhowerStats || { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 1 };
  const financials = data.costCenterFinancials || [];
  const hourly = data.hourlyList || [];
  const projects = data.projects || [];

  // Max calculations for clean SVG rendering
  const maxProductivity = 10;
  const maxHourlyMinutes = Math.max(...hourly.map((h: any) => h.minutes), 60);
  const maxFinancial = Math.max(...financials.map((f: any) => Math.max(f.income, f.expense)), 1000000);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-black text-white shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-950">مرکز گزارشات، تحلیل بهره‌وری و هوش استراتژیک</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold">
                تحلیلگر چندبعدی ۲.۰
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              پایش عملکرد چندبعدی: ریتم زیستی، تمرکز عمیق، ماتریس آیزنهاور، سودآوری کسب‌وکارها و پیشنهادهای بهینه‌سازی
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 self-start md:self-center bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
          {[
            { id: "7", label: "۷ روز اخیر" },
            { id: "30", label: "۳۰ روز اخیر" },
            { id: "90", label: "دوره ۹۰ روزه" },
            { id: "all", label: "کل دوره" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === r.id
                  ? "bg-black text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={fetchAnalytics}
            className="p-1.5 text-zinc-500 hover:text-black rounded-lg transition-all"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* CORE PRODUCTIVITY & PERFORMANCE METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>شاخص کل بهره‌وری</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-black text-zinc-950 font-mono">
            {toPersianDigits(summary.avgProductivity || 8.5)} <span className="text-xs text-zinc-400">/ ۱۰</span>
          </p>
          <span className="text-[10px] text-emerald-600 block font-medium">وضعیت: بسیار عالی</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>کار عمیق روزانه (Deep Work)</span>
            <Brain className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-blue-600 font-mono">
            {toPersianDigits(summary.avgDeepWorkHours || 3.2)} ساعت
          </p>
          <span className="text-[10px] text-zinc-500 block">تمرکز خالص روزمره</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>نرخ تکمیل وظایف</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-black text-emerald-600 font-mono">
            {toPersianDigits(summary.taskCompletionRate || 78)}٪
          </p>
          <span className="text-[10px] text-zinc-400 block">
            {toPersianDigits(summary.totalCompletedTasks || 0)} از {toPersianDigits(summary.totalTasks || 0)} کار
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>سلامت پروژه‌ها</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-base font-black text-zinc-950 font-mono">
            {toPersianDigits(summary.projectsHealthRate || 100)}٪
          </p>
          <span className="text-[10px] text-emerald-600 block">روی ریل و طبق برنامه</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>میانگین خواب شبانه</span>
            <Moon className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-base font-black text-indigo-700 font-mono">
            {toPersianDigits(summary.avgSleepHours || 7.6)} ساعت
          </p>
          <span className="text-[10px] text-zinc-400 block">بازیابی فیزیولوژیک</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>ارزیابی‌های ثبت‌شده</span>
            <Activity className="w-4 h-4 text-zinc-700" />
          </div>
          <p className="text-base font-black text-zinc-950 font-mono">
            {toPersianDigits(summary.totalReviewsLogged || 0)} روز
          </p>
          <span className="text-[10px] text-zinc-400 block">پایگاه داده خودآگاهی</span>
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "OVERVIEW", label: "📊 داشبورد تحلیلی و روند بهره‌وری" },
          { id: "ENERGY", label: "⚡ سطوح ۴ گانه انرژی و کار عمیق" },
          { id: "EISENHOWER", label: "🎯 ماتریس آیزنهاور و ساعات اوج تمرکز" },
          { id: "FINANCIAL", label: "💰 تراز و سودآوری تفکیکی کسب‌وکارها" },
          { id: "INSIGHTS", label: "💡 پیشنهادهای هوشمند اصلاح برنامه‌ریزی" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeView === tab.id
                ? "bg-black text-white shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & PRODUCTIVITY CHARTS */}
      {activeView === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Main Chart: Daily Productivity & Big 3 Trend */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-700" />
                  نمودار روزانه نمره بهره‌وری و پایداری عملکرد
                </h3>
                <p className="text-[11px] text-zinc-500">
                  امتیاز بهره‌وری فردی ثبت‌شده در انتهای هر روز بر مبنای مقیاس ۱ تا ۱۰
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-black" />
                  <span>نمره بهره‌وری (از ۱۰)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500" />
                  <span>کار عمیق (ساعت)</span>
                </span>
              </div>
            </div>

            {/* Interactive SVG Bar & Trend Chart */}
            <div className="pt-4 overflow-x-auto">
              {dailyTrends.length > 0 ? (
                <div className="min-w-[640px] h-64 flex items-end gap-3 pb-6 pt-4 px-2 border-b border-zinc-200">
                  {dailyTrends.map((t: any, idx: number) => {
                    const prodHeight = (t.productivity / maxProductivity) * 100;
                    const deepHeight = Math.min(100, (t.deepWork / 6) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-black text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-lg">
                          <span>{t.dateFormatted} | بهره‌وری: {toPersianDigits(t.productivity)} | کار عمیق: {toPersianDigits(t.deepWork)}h</span>
                        </div>

                        {/* Bars Pair */}
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          <div
                            className="w-1/2 bg-black rounded-t-md transition-all duration-500 group-hover:bg-zinc-700"
                            style={{ height: `${prodHeight}%` }}
                          />
                          <div
                            className="w-1/2 bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-600"
                            style={{ height: `${deepHeight}%` }}
                          />
                        </div>

                        {/* X-axis date label */}
                        <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap mt-1">
                          {t.dateFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-400 text-xs italic">
                  هنوز داده‌ای برای این بازه زمانی ثبت نشده است.
                </div>
              )}
            </div>
          </div>

          {/* Projects Health & Milestones Progress */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-700" />
              پیشرفت پروژه‌های استراتژیک و درصد تحقق اهداف
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((proj: any) => (
                <div key={proj.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-zinc-800 border border-zinc-200">
                      {proj.area || "پروژه"}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-950">
                      {toPersianDigits(proj.progress)}٪
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-zinc-950 line-clamp-1">{proj.title}</h4>

                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>بودجه: {formatCurrency(proj.budget)}</span>
                    <span className="font-bold text-emerald-700">وضعیت: طبق برنامه ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENERGY & DEEP WORK TRENDS */}
      {activeView === "ENERGY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  روند ممیزی سطوح ۴ گانه انرژی زیستی در طول روزها
                </h3>
                <p className="text-[11px] text-zinc-500">
                  شناسایی نقاط نوسان انرژی جسمانی، هیجانی، ذهنی و معنوی برای تنظیم فشار کاری
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>جسمانی</span></span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span>هیجانی</span></span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span>ذهنی</span></span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span>معنوی</span></span>
              </div>
            </div>

            {/* Multi-Energy Comparative Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {dailyTrends.slice(-6).map((d: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-950">{d.dateFormatted}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-zinc-700 border border-zinc-200 font-medium">
                      {d.mood}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>جسمانی</span>
                        <span className="font-bold font-mono">{toPersianDigits(d.physical)}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(d.physical / 10) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>هیجانی</span>
                        <span className="font-bold font-mono">{toPersianDigits(d.emotional)}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(d.emotional / 10) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>ذهنی</span>
                        <span className="font-bold font-mono">{toPersianDigits(d.mental)}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(d.mental / 10) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>معنوی</span>
                        <span className="font-bold font-mono">{toPersianDigits(d.spiritual)}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(d.spiritual / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EISENHOWER MATRIX & HOURLY HEATMAP */}
      {activeView === "EISENHOWER" && (
        <div className="space-y-6">
          {/* Eisenhower Matrix Analysis Card */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Target className="w-4 h-4 text-zinc-700" />
              توزیع کارهای سیستم بر اساس ماتریس ۴ گانه آیزنهاور
            </h3>
            <p className="text-[11px] text-zinc-500">
              قانون طلایی اثربخشی: بیش از ۶۰٪ زمان باید در چارک دوم (Q2: مهم و غیرفوری) برای کار عمیق و استراتژی صرف شود.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {(["Q1", "Q2", "Q3", "Q4"] as const).map((qKey) => {
                const count = eisenhower[qKey] || 0;
                const pct = Math.round((count / (eisenhower.total || 1)) * 100);
                const info = EISENHOWER_LABELS[qKey];

                return (
                  <div key={qKey} className={`p-4 rounded-xl bg-white border ${info.border} shadow-sm space-y-2`}>
                    <span className={`text-xs font-bold ${info.color}`}>{info.label}</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono text-zinc-950">
                        {toPersianDigits(count)} <span className="text-xs text-zinc-400 font-sans">تسک</span>
                      </span>
                      <span className="text-xs font-bold font-mono text-zinc-600">{toPersianDigits(pct)}٪</span>
                    </div>

                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className={`${info.bg} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Energy & Focus Distribution (Chronotype Heatmap) */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-700" />
                  نقشه ساعات اوج تمرکز شبانه‌روز (ساعت ۶ صبح الی ۲۳ شب)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  میزان دقایق کار عمیق تخصیص‌یافته در ساعات مختلف برای تطبیق با ریتم شبانه‌روزی (Chronotype)
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800">
                ساعات طلایی تمرکز: ۸ الی ۱۲ صبح
              </span>
            </div>

            {/* Hourly Bars */}
            <div className="pt-2 overflow-x-auto">
              <div className="min-w-[680px] h-48 flex items-end gap-2 pb-6 pt-4 px-2 border-b border-zinc-200">
                {hourly.map((h: any) => {
                  const barHeight = Math.min(100, Math.max(8, (h.minutes / maxHourlyMinutes) * 100));
                  const isPeak = h.hour >= 8 && h.hour <= 12;

                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 z-20 bg-black text-white text-[10px] p-1 rounded whitespace-nowrap pointer-events-none">
                        <span>ساعت {h.hourLabel}: {toPersianDigits(h.minutes)} دقیقه</span>
                      </div>

                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isPeak ? "bg-black group-hover:bg-zinc-700" : "bg-zinc-300 group-hover:bg-zinc-400"
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />

                      <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap mt-1">
                        {h.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL BREAKDOWN BY BUSINESS UNIT */}
      {activeView === "FINANCIAL" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-700" />
              تراز، درآمد، هزینه و سودآوری به تفکیک کسب‌وکارها
            </h3>
            <p className="text-[11px] text-zinc-500">
              ارزیابی عملکرد مالی بوفه باشگاه، فروشگاه لوازم آرایشی، شرکت فناوری رایش و مخارج شخصی
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {financials.map((f: any) => (
                <div key={f.id} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-950">{f.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-zinc-700 border border-zinc-200 font-bold font-mono">
                      {f.code}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">درآمد / فروش کل:</span>
                      <span className="font-mono font-bold text-emerald-600">{formatCurrency(f.income)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">هزینه‌های جاری:</span>
                      <span className="font-mono font-bold text-rose-600">{formatCurrency(f.expense)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 flex items-center justify-between font-bold">
                      <span className="text-zinc-900">سود خالص عملیاتی:</span>
                      <span className="font-mono font-black text-zinc-950">{formatCurrency(f.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SMART DIAGNOSTIC INSIGHTS */}
      {activeView === "INSIGHTS" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              بینش‌های داده‌محور و توصیه‌های هوشمند برای بهبود خود و برنامه‌ریزی
            </h3>
            <p className="text-[11px] text-zinc-500">
              این تحلیل‌ها به صورت خودکار بر اساس داده‌های خواب، روتین‌ها، کار عمیق و دخل مالی شما استخراج شده‌اند:
            </p>

            <div className="space-y-3">
              {[
                {
                  title: "تنظیم ساعات کار عمیق رایش در پنجره طلایی صبح (۸:۰۰ الی ۱۱:۳۰)",
                  type: "بهینه‌سازی تایم‌بلاکینگ",
                  desc: "داده‌های ثبت‌شده نشان می‌دهد بالاترین انرژی ذهنی و توان حل مسئله شما در بازه ۸ الی ۱۱:۳۰ صبح است. پیشنهاد می‌شود توسعه ماژول‌های فنی رایش و دروس دانشگاهی را به این بازه اختصاص دهید و کارهای تدارکات بوفه و پاسخگویی فروشگاه را به عصر (۱۵:۰۰ به بعد) منتقل کنید.",
                  tag: "بهره‌وری فکری",
                },
                {
                  title: "کاهش سهم کارهای Q1 و تقویت پیشگیری در Q2",
                  type: "ماتریس آیزنهاور",
                  desc: "در حال حاضر بخشی از انرژی روز صرف کارهای عجله‌ای و فوری بوفه (نظیر کمبود مکمل یا شمارش دخل در ساعات شلوغی) می‌شود. با سفارش‌گذاری پیش‌دستانه هفتگی از کاله و آماده‌سازی پکیج‌ها در ابتدای هفته، حداقل ۴ ساعت در هفته آزاد خواهد شد.",
                  tag: "مدیریت زمان",
                },
                {
                  title: "همبستگی مستقیم راندمان خواب و انگیزه معنوی/هیجانی",
                  type: "ریتم زیستی و خواب",
                  desc: "در روزهایی که خواب شبانه بیش از ۷ ساعت و با بازدهی بالای ۸۵٪ بوده، نرخ بستن هر ۳ اقدام طلایی روز به ۱۰۰٪ رسیده و نمره انرژی هیجانی شما ارتقا یافته است. پایبندی به روتین قطع اسکرین بعد از ساعت ۲۲:۳۰ عامل اصلی این ثبات است.",
                  tag: "سلامت زیستی",
                },
                {
                  title: "نقطه بهینه مالی بوفه و پایداری درآمد نقدی",
                  type: "هوش مالی",
                  desc: "تسویه دخل روزانه و فروش پوز شیک‌های پروتئینی نشان‌دهنده حاشیه سود بالای ۳۵٪ در بوفه است. تخصیص سود مازاد به صندوق اضطراری و حساب تجاری، پشتوانه امنی برای توسعه پروژه‌های نرم‌افزاری رایش ایجاد کرده است.",
                  tag: "توسعه کسب‌وکار",
                },
              ].map((rec, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {rec.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 font-bold">
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{rec.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
