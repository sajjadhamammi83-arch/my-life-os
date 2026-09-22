"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Compass,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit2,
  Plus,
  Trash2,
  X,
  Clock,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Flame,
  Star,
  Layers,
  Settings,
  AlertCircle,
} from "lucide-react";
import { toPersianDigits, formatPersianDate } from "@/lib/utils";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import DailyGoalRecoveryWidget from "@/components/goals/DailyGoalRecoveryWidget";

// Quadrant Helper for Goals
function getGoalQuadrantMeta(quadrant?: string, priority?: string) {
  const q =
    quadrant ||
    (priority === "urgent" ? "Q1" : priority === "high" ? "Q2" : priority === "medium" ? "Q3" : "Q4");
  switch (q) {
    case "Q1":
      return {
        id: "Q1",
        label: "سریع و فوری (Q1)",
        sublabel: "فوری و مهم — بحرانی",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 border",
        activeButtonClass: "bg-rose-600 text-white font-black shadow-sm ring-2 ring-rose-300 border-rose-600",
        idleButtonClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
        dotClass: "bg-rose-500",
        icon: AlertCircle,
      };
    case "Q2":
      return {
        id: "Q2",
        label: "مهم اما غیرفوری (Q2)",
        sublabel: "کار عمیق و استراتژیک",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 border",
        activeButtonClass: "bg-blue-600 text-white font-black shadow-sm ring-2 ring-blue-300 border-blue-600",
        idleButtonClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        dotClass: "bg-blue-500",
        icon: Target,
      };
    case "Q3":
      return {
        id: "Q3",
        label: "فوری اما غیرمهم (Q3)",
        sublabel: "امور روتین و واگذاری",
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
        label: "غیرفوری و غیرمهم (Q4)",
        sublabel: "تفریحی یا کم‌اهمیت",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 border",
        activeButtonClass: "bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-300 border-emerald-600",
        idleButtonClass: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
        dotClass: "bg-emerald-500",
        icon: Sparkles,
      };
  }
}

export default function GoalsPage() {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [editingKr, setEditingKr] = useState<any>(null);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);

  // Goal Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q2");
  const [isBigThreeGoal, setIsBigThreeGoal] = useState(true);
  const [confidence, setConfidence] = useState(85);

  // Timeline (Shamsi)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Daily Action Blueprint
  const [dailyAction, setDailyAction] = useState("");
  const [dailyDuration, setDailyDuration] = useState("60");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("کار عمیق صبح (۰۸:۳۰ - ۱۰:۳۰)");
  const [weeklyDays, setWeeklyDays] = useState("همه روزها");
  const [autoSchedule, setAutoSchedule] = useState(true);

  // Target Metric & Quantitative KPI
  const [targetMetric, setTargetMetric] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("");

  // Strategy & Obstacle Recovery
  const [strategyNotes, setStrategyNotes] = useState("");
  const [potentialObstacles, setPotentialObstacles] = useState("");

  // New KR form
  const [targetObjId, setTargetObjId] = useState("");
  const [krMetric, setKrMetric] = useState("");
  const [krBaseline, setKrBaseline] = useState("0");
  const [krTarget, setKrTarget] = useState("100");
  const [krUnit, setKrUnit] = useState("");

  // Update KR value form
  const [newKrValue, setNewKrValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quadrantsList: Array<"Q1" | "Q2" | "Q3" | "Q4"> = ["Q1", "Q2", "Q3", "Q4"];

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (data.success) setObjectives(data.objectives || []);

      const resAreas = await fetch("/api/areas");
      const dataAreas = await resAreas.json();
      if (dataAreas.success) {
        setAreas(dataAreas.areas || []);
        if (dataAreas.areas?.length > 0 && !areaId) {
          setAreaId(dataAreas.areas[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Open Edit / Configure Goal Modal
  const openEditGoalModal = (obj: any) => {
    setEditingObjective(obj);
    setTitle(obj.title || "");
    setDescription(obj.description || "");
    setAreaId(obj.areaId || (areas[0]?.id || ""));
    const q =
      obj.priority === "urgent" ? "Q1" : obj.priority === "high" ? "Q2" : obj.priority === "medium" ? "Q3" : "Q4";
    setSelectedQuadrant(q as any);
    setIsBigThreeGoal(true);
    setConfidence(obj.confidence || 85);
    setDailyAction(obj.dailyAction || "");
    setDailyDuration(String(obj.dailyDuration || 60));
    setPreferredTimeSlot(obj.preferredTimeSlot || "کار عمیق صبح (۰۸:۳۰ - ۱۰:۳۰)");
    setWeeklyDays(obj.weeklyDays || "همه روزها");
    setAutoSchedule(obj.autoSchedule !== false);
    setTargetMetric(obj.targetMetric || "");
    setTargetValue(obj.targetValue ? String(obj.targetValue) : "");
    setCurrentValue(obj.currentValue ? String(obj.currentValue) : "");
    setMetricUnit(obj.metricUnit || "");
    setStrategyNotes(obj.strategyNotes || "");
    setPotentialObstacles(obj.potentialObstacles || "");

    if (obj.startDate) {
      const d = new Date(obj.startDate);
      setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    if (obj.deadline) {
      const d = new Date(obj.deadline);
      setDeadline(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
  };

  // Reset Form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedQuadrant("Q2");
    setIsBigThreeGoal(true);
    setConfidence(85);
    setDailyAction("");
    setDailyDuration("60");
    setPreferredTimeSlot("کار عمیق صبح (۰۸:۳۰ - ۱۰:۳۰)");
    setWeeklyDays("همه روزها");
    setAutoSchedule(true);
    setTargetMetric("");
    setTargetValue("");
    setCurrentValue("");
    setMetricUnit("");
    setStrategyNotes("");
    setPotentialObstacles("");
    setEditingObjective(null);
  };

  // Create or Update Objective
  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const mappedPriority =
      selectedQuadrant === "Q1" ? "urgent" : selectedQuadrant === "Q2" ? "high" : selectedQuadrant === "Q3" ? "medium" : "low";

    try {
      if (editingObjective) {
        // UPDATE (PATCH)
        const res = await fetch("/api/goals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectiveId: editingObjective.id,
            title,
            description,
            areaId: areaId || undefined,
            priority: mappedPriority,
            confidence: Number(confidence),
            startDate,
            deadline,
            dailyAction,
            dailyDuration: Number(dailyDuration) || 60,
            preferredTimeSlot,
            weeklyDays,
            targetMetric,
            targetValue: targetValue ? Number(targetValue) : undefined,
            currentValue: currentValue ? Number(currentValue) : undefined,
            metricUnit,
            strategyNotes,
            potentialObstacles,
            autoSchedule,
          }),
        });

        if (res.ok) {
          resetForm();
          fetchGoals();
          window.dispatchEvent(new Event("reminders-updated"));
        }
      } else {
        // CREATE (POST)
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            areaId: areaId || undefined,
            priority: mappedPriority,
            confidence: Number(confidence),
            startDate,
            deadline,
            dailyAction,
            dailyDuration: Number(dailyDuration) || 60,
            preferredTimeSlot,
            weeklyDays,
            targetMetric,
            targetValue: targetValue ? Number(targetValue) : undefined,
            currentValue: currentValue ? Number(currentValue) : undefined,
            metricUnit,
            strategyNotes,
            potentialObstacles,
            autoSchedule,
          }),
        });

        if (res.ok) {
          resetForm();
          setIsObjModalOpen(false);
          fetchGoals();
          window.dispatchEvent(new Event("reminders-updated"));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateKr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!krMetric.trim() || !targetObjId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "key_result",
          objectiveId: targetObjId,
          metric: krMetric,
          baseline: Number(krBaseline) || 0,
          target: Number(krTarget) || 100,
          unit: krUnit,
        }),
      });
      if (res.ok) {
        setKrMetric("");
        setKrBaseline("0");
        setKrTarget("100");
        setKrUnit("");
        setIsKrModalOpen(false);
        fetchGoals();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateKr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKr || !newKrValue) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyResultId: editingKr.id,
          newValue: Number(newKrValue),
        }),
      });

      if (res.ok) {
        setEditingKr(null);
        setNewKrValue("");
        fetchGoals();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteObjective = async (id: string) => {
    if (!confirm("آیا از حذف این هدف و تمام شاخص‌های کلیدی آن مطمئن هستید؟")) return;
    try {
      await fetch(`/api/goals?objectiveId=${id}`, { method: "DELETE" });
      fetchGoals();
      window.dispatchEvent(new Event("reminders-updated"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKr = async (krId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("آیا از حذف این نتیجه کلیدی مطمئن هستید؟")) return;
    try {
      await fetch(`/api/goals?keyResultId=${krId}`, { method: "DELETE" });
      fetchGoals();
    } catch (e) {
      console.error(e);
    }
  };

  // Dispatch Today's session manually
  const handleManualDispatch = async (obj: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `🎯 [هدف: ${obj.title}] ${obj.dailyAction || "پیشبرد اهداف راهبردی"}`,
          objectiveId: obj.id,
          areaId: obj.areaId,
          workType: "Deep Work",
          eisenhowerQuadrant: obj.priority === "urgent" ? "Q1" : "Q2",
          priority: obj.priority === "urgent" ? "urgent" : "high",
          isBigThree: true,
          status: "today",
          estimatedMinutes: obj.dailyDuration || 60,
        }),
      });
      if (res.ok) {
        alert("وظیفه امروز این هدف با موفقیت در صفحه امروز و اقدامات طلایی ثبت شد!");
        window.dispatchEvent(new Event("reminders-updated"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeObjectives = objectives.filter((o) => o.status === "in_progress");

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-black text-white shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-zinc-950">اهداف، استراتژی و ریتم روزانه (Strategy & OKRs)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                پایش خودکار و بازتنظیم در اوقات خالی
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              تنظیم استراتژیک اهداف، اولویت‌بندی رنگی آیزنهاور، تزریق خودکار به اقدامات ۳گانه طلایی، و جبران عقب‌افتادگی در زمان‌های خالی
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsObjModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 self-start lg:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>ایجاد هدف جدید و ریتم روزانه</span>
        </button>
      </div>

      {/* Slip Recovery & Autonomous Goal Tasks Widget */}
      <DailyGoalRecoveryWidget />

      {/* 3 Pillars Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
              چشم‌انداز مالی و سیستم‌سازی
            </span>
            <span className="text-xs font-mono font-bold text-zinc-900">۱۵۰+ م/ماه</span>
          </div>
          <h4 className="text-sm font-black text-zinc-950">استقلال مالی و کسب درآمد پایدار</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            جریان درآمدی پایدار از بوفه باشگاه، فروشگاه لوازم آرایشی و قراردادهای شرکت رایش با سیستم‌سازی کامل.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
              چشم‌انداز مقیاس‌پذیری ۳ ساله
            </span>
            <span className="text-xs font-mono font-bold text-zinc-900">MVP رایش</span>
          </div>
          <h4 className="text-sm font-black text-zinc-950">توسعه برند بوفه، فروشگاه و محصول رایش</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            زنجیره تأمین مکمل‌های ورزشی، افزایش سهم بازار فروشگاه آرایشی و لانچ نرم‌افزار تجاری رایش.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
              لایف‌استایل و انرژی زیستی
            </span>
            <span className="text-xs font-mono font-bold text-zinc-900">۷.۵ ساعت خواب</span>
          </div>
          <h4 className="text-sm font-black text-zinc-950">سلامت پولادین و آزادی زمانی</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            خواب باکیفیت، فرم بدنی ورزیده زیر ۱۵٪ چربی، و روابط پایدار و ارزشمند خانوادگی.
          </p>
        </div>
      </div>

      {/* Objectives Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-zinc-950" />
            <h3 className="font-black text-sm text-zinc-950">
              اهداف و نتایج کلیدی فعال ({toPersianDigits(activeObjectives.length)})
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            برای ویرایش یا تنظیم مجدد هر هدف، روی دکمه «تنظیم هدف» کلیک کنید
          </span>
        </div>

        {activeObjectives.length === 0 ? (
          <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl space-y-3">
            <Target className="w-12 h-12 mx-auto text-zinc-300" />
            <h4 className="text-base font-bold text-zinc-900">هنوز هدفی برای این چرخه ثبت نشده است</h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              با کلیک بر روی دکمه زیر، هدف استراتژیک جدید خود را همراه با سنجه‌های عددی، اقدام مشخص روزانه و زمان ترجیحی ثبت نمایید.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsObjModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد اولین هدف</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {activeObjectives.map((obj) => {
              const isStrategyOpen = expandedStrategyId === obj.id;
              const hasDaily = Boolean(obj.dailyAction);
              const qMeta = getGoalQuadrantMeta(undefined, obj.priority);

              return (
                <div
                  key={obj.id}
                  className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4 hover:border-zinc-300 transition-all"
                >
                  {/* Objective Top Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Area Badge */}
                        {obj.area && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                            {obj.area.name}
                          </span>
                        )}

                        {/* Distinct Colored Quadrant Badge */}
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1 ${qMeta.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${qMeta.dotClass}`} />
                          {qMeta.label}
                        </span>

                        {/* Big 3 Indicator */}
                        <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          متصل به اقدامات ۳گانه طلایی
                        </span>

                        {obj.deadline && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono border border-zinc-200">
                            سررسید: {formatPersianDate(obj.deadline, { day: "numeric", month: "long" })}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-zinc-950">{obj.title}</h4>
                      {obj.description && (
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{obj.description}</p>
                      )}
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <div className="text-right min-w-[70px]">
                        <span className="text-[11px] text-zinc-400 block font-medium">پیشرفت کلی</span>
                        <p className="text-lg font-black text-zinc-950">{toPersianDigits(obj.progress)}٪</p>
                      </div>

                      <div className="w-28 bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, obj.progress)}%` }}
                        />
                      </div>

                      {/* Add KR Button */}
                      <button
                        onClick={() => {
                          setTargetObjId(obj.id);
                          setIsKrModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1 border border-zinc-200 transition-colors"
                        title="افزودن نتیجه کلیدی (KR)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن KR</span>
                      </button>

                      {/* Configure / Edit Goal Button */}
                      <button
                        onClick={() => openEditGoalModal(obj)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1 border border-zinc-200 transition-colors"
                        title="تنظیمات و ویرایش هدف"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>تنظیم هدف</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteObjective(obj.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                        title="حذف هدف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Daily Action Blueprint Box */}
                  {hasDaily && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-black text-white">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-zinc-950">اقدام روزانه مشخص:</span>
                            <span className="font-bold text-zinc-800">{obj.dailyAction}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                            <span>مدت: {toPersianDigits(obj.dailyDuration || 60)} دقیقه</span>
                            <span>• بازه: {obj.preferredTimeSlot || "کار عمیق"}</span>
                            <span>• تعهد: {obj.weeklyDays || "همه روزها"}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleManualDispatch(obj)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-xs transition-all shadow-xs shrink-0 self-end md:self-center"
                        title="ارسال این وظیفه به برنامه امروز"
                      >
                        + ارسال جلسه امروز
                      </button>
                    </div>
                  )}

                  {/* Key Results (KRs) */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-zinc-500">سنجه‌های کلیدی قابل ارزیابی (Key Results):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {obj.keyResults?.map((kr: any) => (
                        <div
                          key={kr.id}
                          onClick={() => {
                            setEditingKr(kr);
                            setNewKrValue(String(kr.currentValue));
                          }}
                          className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 cursor-pointer transition-colors flex flex-col justify-between shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-900 line-clamp-1">
                              {kr.metric}
                            </span>
                            <div className="flex items-center gap-1">
                              <Edit2 className="w-3 h-3 text-zinc-400 hover:text-black" />
                              <button
                                onClick={(e) => handleDeleteKr(kr.id, e)}
                                className="text-zinc-400 hover:text-black p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-zinc-500">
                              <span>
                                فعلی: <strong className="text-zinc-950">{toPersianDigits(kr.currentValue)} {kr.unit}</strong>
                              </span>
                              <span className="font-bold text-zinc-950">{toPersianDigits(kr.progress)}٪</span>
                            </div>
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-black h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, kr.progress)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!obj.keyResults || obj.keyResults.length === 0) && (
                        <div className="text-center p-3 text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-xl sm:col-span-3">
                          هیچ شاخص کلیدی (KR) تعریف نشده است. با دکمه بالا یک شاخص بسازید.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strategy Notes & Potential Obstacles Accordion */}
                  {(obj.strategyNotes || obj.potentialObstacles) && (
                    <div className="pt-2 border-t border-zinc-100 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStrategyId(isStrategyOpen ? null : obj.id)
                        }
                        className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-black"
                      >
                        {isStrategyOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>مشاهده استراتژی کلیدی و راهکار مقابله با موانع</span>
                      </button>

                      {isStrategyOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 animate-in fade-in duration-100">
                          {obj.strategyNotes && (
                            <div>
                              <span className="font-bold text-zinc-900 block mb-1">
                                💡 استراتژی اصلی و چرایی:
                              </span>
                              <p className="text-[11px] leading-relaxed text-zinc-600">
                                {obj.strategyNotes}
                              </p>
                            </div>
                          )}
                          {obj.potentialObstacles && (
                            <div>
                              <span className="font-bold text-zinc-900 block mb-1">
                                🛡️ موانع احتمالی و برنامه عبور:
                              </span>
                              <p className="text-[11px] leading-relaxed text-zinc-600">
                                {obj.potentialObstacles}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RICH GOAL CREATION / CONFIGURATION MODAL (Supports both New and Edit) */}
      {(isObjModalOpen || editingObjective) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-black text-white">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-950">
                    {editingObjective ? "تنظیم و ویرایش هدف استراتژیک" : "ایجاد هدف استراتژیک جدید و تنظیم ریتم روزانه"}
                  </h3>
                  <p className="text-[10px] text-zinc-500">
                    انتخاب رنگی اولویت آیزنهاور، سنجه‌های عددی، اتصال به اقدامات طلایی، و نقشه عبور از موانع
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsObjModalOpen(false);
                  setEditingObjective(null);
                }}
                className="text-zinc-400 hover:text-zinc-950 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveObjective} className="space-y-4 text-xs">
              {/* Basic Goal Info */}
              <div>
                <label className="block text-zinc-700 mb-1 font-bold">عنوان هدف استراتژیک:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: لانچ نسخه تجاری MVP پلتفرم رایش و جذب ۱۰ مشتری اول"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-950 font-bold focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">حوزه و دپارتمان:</label>
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-bold focus:outline-none focus:border-black"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">درصد اطمینان دستیابی (Confidence):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-center focus:outline-none focus:border-black font-bold"
                  />
                </div>
              </div>

              {/* 4 Colored Selectable Quadrant Buttons */}
              <div className="space-y-1.5">
                <label className="block text-zinc-700 font-bold">
                  سطح اولویت و فوریت این هدف (ماتریس آیزنهاور):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quadrantsList.map((qId) => {
                    const meta = getGoalQuadrantMeta(qId);
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

              {/* Start & Deadline Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <PersianDatePicker
                    label="تاریخ شروع (تقویم شمسی):"
                    value={startDate}
                    onChange={(iso) => setStartDate(iso)}
                  />
                </div>
                <div>
                  <PersianDatePicker
                    label="ضرب‌الاجل و سررسید نهایی (تقویم شمسی):"
                    value={deadline}
                    onChange={(iso) => setDeadline(iso)}
                  />
                </div>
              </div>

              {/* Quantitative Metric */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <span className="block font-bold text-zinc-900 text-xs">
                  شاخص عددی و متریک کلیدی هدف (Measurable KPI):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] text-zinc-500 mb-1">عنوان سنجه:</label>
                    <input
                      type="text"
                      value={targetMetric}
                      onChange={(e) => setTargetMetric(e.target.value)}
                      placeholder="مثلاً: درآمد ماهانه یا کاربر"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">مقدار فعلی:</label>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder="۰"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">مقدار هدف:</label>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="۱۰۰"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">واحد سنجش:</label>
                    <input
                      type="text"
                      value={metricUnit}
                      onChange={(e) => setMetricUnit(e.target.value)}
                      placeholder="تومان، نفر، ساعت"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Action Blueprint */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <span className="block font-bold text-zinc-900 text-xs">
                  موتور اقدام روزانه خودکار (Daily Action Blueprint):
                </span>
                <div>
                  <label className="block text-[11px] text-zinc-600 mb-1 font-medium">
                    کاری که هر روز باید برای رسیدن به این هدف انجام دهید:
                  </label>
                  <input
                    type="text"
                    value={dailyAction}
                    onChange={(e) => setDailyAction(e.target.value)}
                    placeholder="مثال: ۹۰ دقیقه کدنویسی ماژول سفارشات رایش"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-950 font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">مدت زمان روزانه (دقیقه):</label>
                    <input
                      type="number"
                      value={dailyDuration}
                      onChange={(e) => setDailyDuration(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">بازه زمانی ترجیحی:</label>
                    <select
                      value={preferredTimeSlot}
                      onChange={(e) => setPreferredTimeSlot(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="صبح زود (۰۶:۰۰ - ۰۷:۳۰)">صبح زود (۰۶:۰۰ - ۰۷:۳۰)</option>
                      <option value="کار عمیق صبح (۰۸:۳۰ - ۱۰:۳۰)">کار عمیق صبح (۰۸:۳۰ - ۱۰:۳۰)</option>
                      <option value="بعدازظهر (۱۴:۰۰ - ۱۵:۳۰)">بعدازظهر (۱۴:۰۰ - ۱۵:۳۰)</option>
                      <option value="عصرگاه (۱۶:۳۰ - ۱۸:۰۰)">عصرگاه (۱۶:۳۰ - ۱۸:۰۰)</option>
                      <option value="شب (۲۱:۰۰ - ۲۲:۳۰)">شب (۲۱:۰۰ - ۲۲:۳۰)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">تعهد در هفته:</label>
                    <select
                      value={weeklyDays}
                      onChange={(e) => setWeeklyDays(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="همه روزها">همه روزها (۷ روز)</option>
                      <option value="شنبه تا چهارشنبه">شنبه تا چهارشنبه (روزهای کاری)</option>
                      <option value="شنبه، دوشنبه، چهارشنبه">شنبه، دوشنبه، چهارشنبه</option>
                      <option value="یکشنبه، سه‌شنبه">یکشنبه، سه‌شنبه</option>
                    </select>
                  </div>
                </div>

                {/* Big 3 Checkbox & Auto-schedule */}
                <div className="space-y-2 pt-2 border-t border-zinc-200/60 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBigThreeGoal}
                      onChange={(e) => setIsBigThreeGoal(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0 cursor-pointer"
                    />
                    <span className="font-bold text-zinc-900 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      وظایف روزانه این هدف به عنوان «اقدام طلایی» (Today's Big 3) در نظر گرفته شوند
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSchedule}
                      onChange={(e) => setAutoSchedule(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-0"
                    />
                    <span className="text-zinc-700">
                      تزریق کاملاً خودکار به برنامه و تقویم + بازتنظیم هوشمند در صورت عقب‌افتادگی
                    </span>
                  </label>
                </div>
              </div>

              {/* Strategy & Obstacle Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">استراتژی اصلی دستیابی و چرایی:</label>
                  <textarea
                    rows={2}
                    value={strategyNotes}
                    onChange={(e) => setStrategyNotes(e.target.value)}
                    placeholder="استراتژی بر مبنای تمرکز روی مشتریان سازمانی و ارائه نمونه‌کار است..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">بزرگ‌ترین مانع احتمالی و راهکار مقابله:</label>
                  <textarea
                    rows={2}
                    value={potentialObstacles}
                    onChange={(e) => setPotentialObstacles(e.target.value)}
                    placeholder="کمبود زمان به دلیل شیفت بوفه باشگاه؛ راهکار: شروع کار عمیق قبل از بوفه..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsObjModalOpen(false);
                    setEditingObjective(null);
                  }}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-black transition-all shadow-sm"
                >
                  {isSubmitting
                    ? "در حال ذخیره..."
                    : editingObjective
                    ? "ذخیره تغییرات و تنظیمات هدف"
                    : "ثبت هدف و شروع ریتم روزانه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW KR MODAL */}
      {isKrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-950">افزودن نتیجه کلیدی (Key Result)</h3>
              <button onClick={() => setIsKrModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKr} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 mb-1 font-bold">شاخص یا سنجه (Metric):</label>
                <input
                  type="text"
                  required
                  value={krMetric}
                  onChange={(e) => setKrMetric(e.target.value)}
                  placeholder="تعداد قراردادهای منعقد شده..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">مقدار مبدا (Baseline):</label>
                  <input
                    type="number"
                    value={krBaseline}
                    onChange={(e) => setKrBaseline(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 mb-1 font-bold">مقدار هدف (Target):</label>
                  <input
                    type="number"
                    value={krTarget}
                    onChange={(e) => setKrTarget(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 mb-1 font-bold">واحد سنجش (Unit):</label>
                <input
                  type="text"
                  value={krUnit}
                  onChange={(e) => setKrUnit(e.target.value)}
                  placeholder="قرارداد، تومان، مشتری، درصد..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsKrModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-all shadow-sm"
                >
                  افزودن نتیجه کلیدی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE KR VALUE MODAL */}
      {editingKr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-950">ثبت مقدار جدید شاخص</h3>
              <button onClick={() => setEditingKr(null)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKr} className="space-y-3 text-xs">
              <div>
                <p className="text-zinc-600 mb-1">
                  شاخص: <strong className="text-zinc-950">{editingKr.metric}</strong>
                </p>
                <p className="text-[11px] text-zinc-400">
                  مبدا: {toPersianDigits(editingKr.baseline)} | هدف: {toPersianDigits(editingKr.target)} {editingKr.unit}
                </p>
              </div>

              <div>
                <label className="block text-zinc-700 mb-1 font-bold">مقدار واقعی فعلی:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newKrValue}
                  onChange={(e) => setNewKrValue(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono font-bold focus:outline-none focus:border-black text-center text-sm"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingKr(null)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-all shadow-sm"
                >
                  ثبت مقدار جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
