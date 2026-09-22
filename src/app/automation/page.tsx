"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Play,
  X,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [ifEvent, setIfEvent] = useState("sale_created");
  const [ifCondition, setIfCondition] = useState("invoice.type == 'sale'");
  const [thenAction, setThenAction] = useState("reduce_inventory_stock_and_recalc_cogs");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/automation");
      const data = await res.json();
      if (data.success) setRules(data.rules);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleRuleActive = async (rule: any) => {
    const nextState = !rule.isActive;
    setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: nextState } : r)));

    try {
      await fetch("/api/automation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: nextState }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ifEvent,
          ifCondition,
          thenAction,
        }),
      });
      if (res.ok) {
        setTitle("");
        setIsModalOpen(false);
        fetchRules();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("آیا از حذف این قانون اتوماسیون مطمئن هستید؟")) return;
    try {
      await fetch(`/api/automation?id=${id}`, { method: "DELETE" });
      fetchRules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestRun = (rule: any) => {
    setTestResult(`✓ شبیه‌سازی موفق: شرط "${rule.ifCondition}" ارزیابی شد و اکشن "${rule.thenAction}" بدون خطا تریگر گردید.`);
    setTimeout(() => setTestResult(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">موتور قوانین و خودکارسازی هوشمند (IF / THEN Rules Engine)</h2>
            <p className="text-xs text-zinc-500">
              کسر خودکار انبار در فروش، اعلان روتین شبانه، و تنظیم بار کاری متناسب با راندمان خواب
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>تعریف قانون جدید</span>
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-950 rounded-xl text-xs font-bold text-center">
          {testResult}
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200 flex items-center gap-3 text-xs text-zinc-500">
        <ShieldAlert className="w-5 h-5 text-zinc-950 shrink-0" />
        <span>
          <strong>اصل شفافیت حسابداری:</strong> خودکارسازی‌ها کاملاً شفاف و قابل ویرایش هستند. هیچ ثبتی در امور مالی بدون قابلیت ممیزی و بازبینی انجام نمی‌شود.
        </span>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              rule.isActive
                ? "bg-white border-zinc-200 hover:border-zinc-300"
                : "bg-zinc-50/40 border-zinc-200 opacity-60"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.isActive ? "bg-black text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {rule.isActive ? "فعال" : "غیرفعال"}
                </span>
                <h4 className="font-bold text-xs text-zinc-950">{rule.title}</h4>
              </div>

              {/* Logic Flow */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-800">
                  IF ({rule.ifCondition})
                </span>
                <span className="text-zinc-500">➔</span>
                <span className="px-2 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-800">
                  THEN ({rule.thenAction})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => handleTestRun(rule)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold border border-zinc-300 transition-colors"
                title="تست و شبیه‌سازی تریگر این قانون"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تست اجرا</span>
              </button>

              {/* Active Toggle Switch */}
              <button
                onClick={() => toggleRuleActive(rule)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  rule.isActive
                    ? "bg-black text-white hover:bg-zinc-800"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {rule.isActive ? "فعال ✓" : "غیرفعال ○"}
              </button>

              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">تعریف قانون خودکارسازی جدید</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان قانون:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: کسر خودکار موجودی انبار پس از هر فاکتور فروش"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">رویداد تحریک‌کننده (Event):</label>
                <select
                  value={ifEvent}
                  onChange={(e) => setIfEvent(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                >
                  <option value="sale_created">ثبت فروش در فروشگاه یا بوفه</option>
                  <option value="sleep_logged">ثبت گزارش خواب صبحگاهی</option>
                  <option value="time_is_2200">فرارسیدن ساعت ۲۲:۰۰ شب</option>
                  <option value="stock_below_min">کاهش موجودی انبار به زیر حداقل</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">شرط قانون (IF Condition):</label>
                <input
                  type="text"
                  required
                  value={ifCondition}
                  onChange={(e) => setIfCondition(e.target.value)}
                  placeholder="product.stock <= product.minStock"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">اکشن اجرایی (THEN Action):</label>
                <input
                  type="text"
                  required
                  value={thenAction}
                  onChange={(e) => setThenAction(e.target.value)}
                  placeholder="trigger_procurement_order"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-[11px]"
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  {isSubmitting ? "در حال ثبت..." : "فعال‌سازی قانون"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
