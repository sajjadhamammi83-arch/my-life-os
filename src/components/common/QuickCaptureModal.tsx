"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckSquare,
  FileText,
  DollarSign,
  TrendingUp,
  PackageCheck,
  Droplet,
  Moon,
  Scale,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureType = "task" | "note" | "expense" | "income" | "sale" | "water" | "sleep" | "weight";

export default function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
  const [activeType, setActiveType] = useState<CaptureType>("task");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("بوفه باشگاه");
  const [extra, setExtra] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && activeType !== "water") return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeType,
          title: title || (activeType === "water" ? "مصرف آب" : ""),
          amount: amount ? Number(amount) : undefined,
          category,
          extra,
        }),
      });

      if (res.ok) {
        setSuccessMsg("✓ با موفقیت در سیستم ثبت شد");
        setTimeout(() => {
          setSuccessMsg("");
          setTitle("");
          setAmount("");
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const types = [
    { id: "task", label: "تسک فوری", icon: CheckSquare },
    { id: "sale", label: "ثبت فروش", icon: PackageCheck },
    { id: "expense", label: "ثبت هزینه", icon: DollarSign },
    { id: "income", label: "ثبت درآمد", icon: TrendingUp },
    { id: "note", label: "یادداشت / ایده", icon: FileText },
    { id: "water", label: "مصرف آب", icon: Droplet },
    { id: "sleep", label: "ثبت خواب", icon: Moon },
    { id: "weight", label: "ثبت وزن", icon: Scale },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950">ثبت سریع و شکار افکار (Quick Capture)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="p-3 border-b border-zinc-200 grid grid-cols-4 gap-1.5 bg-zinc-50">
          {types.map((t) => {
            const Icon = t.icon;
            const isSelected = activeType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveType(t.id as CaptureType)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-all",
                  isSelected
                    ? "bg-black text-white font-bold shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-zinc-500")} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {activeType === "task" && "عنوان وظیفه یا کار مورد نظر:"}
              {activeType === "expense" && "بابت چه چیزی هزینه شد؟"}
              {activeType === "income" && "منبع و عنوان درآمد:"}
              {activeType === "sale" && "نام کالا یا شماره فاکتور فروش:"}
              {activeType === "note" && "متن ایده، نکته یا فکر گذرا:"}
              {activeType === "water" && "حجم آب مصرفی (لیوان یا میلی‌لیتر):"}
              {activeType === "sleep" && "مدت یا ساعت خواب (مثلاً: ۷ ساعت خواب عمیق):"}
              {activeType === "weight" && "وزن امروز صبح (کیلوگرم):"}
            </label>
            <input
              type="text"
              required={activeType !== "water"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeType === "task"
                  ? "مثال: هماهنگی سفارش پروتئین وی با شرکت کاله"
                  : activeType === "expense"
                  ? "مثال: خرید میوه برای شیک بوفه"
                  : activeType === "sale"
                  ? "مثال: فروش شیک پروتئینی یا ضدآفتاب لافارر"
                  : "اینجا بنویسید..."
              }
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
              autoFocus
            />
          </div>

          {(activeType === "expense" || activeType === "income" || activeType === "sale" || activeType === "water" || activeType === "weight") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  {activeType === "water"
                    ? "تعداد لیوان یا میلی‌لیتر:"
                    : activeType === "weight"
                    ? "وزن دقیق (کیلوگرم):"
                    : "مبلغ (تومان):"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={activeType === "water" ? "۲۵۰" : activeType === "weight" ? "۷۸.۸" : "۱۵۰,۰۰۰"}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">مرکز هزینه / حوزه:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-black"
                >
                  <option value="بوفه باشگاه">بوفه باشگاه</option>
                  <option value="لوازم آرایشی">لوازم آرایشی</option>
                  <option value="شرکت رایش">شرکت رایش</option>
                  <option value="شخصی">شخصی</option>
                  <option value="سلامت">سلامت</option>
                  <option value="دانشگاه">دانشگاه</option>
                </select>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs text-center font-bold">
              {successMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-950"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all"
            >
              <span>{isSubmitting ? "در حال ثبت..." : "ثبت در Life OS"}</span>
              <ArrowRight className="w-4 h-4 rotate-180 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
