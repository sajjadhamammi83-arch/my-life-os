"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  FileText,
  Bookmark,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { formatPersianDate, toPersianDigits } from "@/lib/utils";

export default function KnowledgePage() {
  const [sops, setSops] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Modals
  const [isSopModalOpen, setIsSopModalOpen] = useState(false);
  const [isDecModalOpen, setIsDecModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // SOP Form
  const [sopTitle, setSopTitle] = useState("");
  const [sopDomain, setSopDomain] = useState("بوفه باشگاه");
  const [sopTrigger, setSopTrigger] = useState("");
  const [sopSteps, setSopSteps] = useState("");
  const [sopOwner, setSopOwner] = useState("مسئول بوفه");

  // Decision Form
  const [decContext, setDecContext] = useState("");
  const [decDecision, setDecDecision] = useState("");
  const [decWhy, setDecWhy] = useState("");
  const [decExpected, setDecExpected] = useState("");

  // Note Form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("ایده");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      if (data.success) {
        setSops(data.sops);
        setDecisions(data.decisions);
        setNotes(data.notes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleCreateSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sopTitle.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sop",
          title: sopTitle,
          domain: sopDomain,
          trigger: sopTrigger,
          steps: sopSteps,
          owner: sopOwner,
        }),
      });
      if (res.ok) {
        setSopTitle("");
        setSopTrigger("");
        setSopSteps("");
        setIsSopModalOpen(false);
        fetchKnowledge();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decDecision.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "decision",
          context: decContext,
          decision: decDecision,
          whyChosen: decWhy,
          expectedOutcome: decExpected,
        }),
      });
      if (res.ok) {
        setDecContext("");
        setDecDecision("");
        setDecWhy("");
        setDecExpected("");
        setIsDecModalOpen(false);
        fetchKnowledge();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
        }),
      });
      if (res.ok) {
        setNoteTitle("");
        setNoteContent("");
        setIsNoteModalOpen(false);
        fetchKnowledge();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("آیا از حذف مطمئن هستید؟")) return;
    try {
      await fetch(`/api/knowledge?type=${type}&id=${id}`, { method: "DELETE" });
      fetchKnowledge();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">پایگاه دانش، اسناد و تصمیمات (Second Brain & SOPs)</h2>
            <p className="text-xs text-zinc-500">
              ثبت لاگ تصمیمات مهم، روش‌های اجرایی استاندارد (SOP)، یادداشت‌های سیستماتیک و تجربیات زیسته
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSopModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>SOP جدید</span>
          </button>
          <button
            onClick={() => setIsDecModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all border border-zinc-300"
          >
            <Plus className="w-4 h-4 text-zinc-600" />
            <span>ثبت تصمیم</span>
          </button>
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium border border-zinc-300 transition-all"
          >
            <Plus className="w-4 h-4 text-zinc-500" />
            <span>یادداشت</span>
          </button>
        </div>
      </div>

      {/* Grid: SOPs & Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOPs Column */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              روش‌های اجرایی استاندارد (Standard Operating Procedures)
            </h3>
            <span className="text-xs text-zinc-500">{toPersianDigits(sops.length)} سند فعال</span>
          </div>

          <div className="space-y-3">
            {sops.map((sop) => (
              <div
                key={sop.id}
                className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold text-[10px]">
                    {sop.domain}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">مسئول: {sop.owner}</span>
                    <button
                      onClick={() => handleDelete("sop", sop.id)}
                      className="text-zinc-600 hover:text-black p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-xs text-zinc-950">{sop.title}</h4>
                {sop.trigger && (
                  <p className="text-[11px] text-zinc-500">
                    شرط فعال‌سازی: <span className="text-zinc-800">{sop.trigger}</span>
                  </p>
                )}
                {sop.steps && (
                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-600 whitespace-pre-line leading-relaxed">
                    {sop.steps}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Decision Logs Column */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
              <Scale className="w-4 h-4 text-zinc-500" />
              لاگ تصمیمات استراتژیک (Decision Logs)
            </h3>
            <span className="text-xs text-zinc-500">{toPersianDigits(decisions.length)} تصمیم ثبت‌شده</span>
          </div>

          <div className="space-y-3">
            {decisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {formatPersianDate(dec.date)}
                  </span>
                  <button
                    onClick={() => handleDelete("decision", dec.id)}
                    className="text-zinc-600 hover:text-black p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="font-bold text-xs text-zinc-950">{dec.decision}</h4>
                {dec.context && (
                  <p className="text-[11px] text-zinc-500 leading-relaxed">بستر: {dec.context}</p>
                )}
                {dec.why && (
                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-600">
                    <span className="font-semibold text-zinc-950 block mb-0.5">علت انتخاب:</span>
                    <p className="text-zinc-500">{dec.why}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOP Modal */}
      {isSopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت روش اجرایی استاندارد (SOP جدید)</h3>
              <button onClick={() => setIsSopModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSop} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان فرآیند (SOP):</label>
                <input
                  type="text"
                  required
                  value={sopTitle}
                  onChange={(e) => setSopTitle(e.target.value)}
                  placeholder="مثلاً: پروتکل آماده‌سازی شیک پروتئینی و نظافت شیکرها"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">حوزه مربوطه:</label>
                  <select
                    value={sopDomain}
                    onChange={(e) => setSopDomain(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                  >
                    <option value="بوفه باشگاه">بوفه باشگاه</option>
                    <option value="لوازم آرایشی">لوازم آرایشی</option>
                    <option value="شرکت رایش">شرکت رایش</option>
                    <option value="شخصی">شخصی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-medium">مسئول اجرا (Owner):</label>
                  <input
                    type="text"
                    value={sopOwner}
                    onChange={(e) => setSopOwner(e.target.value)}
                    placeholder="مسئول بوفه یا ادمین"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">شرط تحریک یا آغاز (Trigger):</label>
                <input
                  type="text"
                  value={sopTrigger}
                  onChange={(e) => setSopTrigger(e.target.value)}
                  placeholder="مثلاً: هنگام شروع شیفت عصر بوفه یا تحویل سفارش جدید"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">مراحل گام‌به‌گام:</label>
                <textarea
                  value={sopSteps}
                  onChange={(e) => setSopSteps(e.target.value)}
                  placeholder="۱. شستن مخزن بلندر&#10;۲. ریختن ۳۰۰ میلی‌لیتر شیر کم‌چرب&#10;۳. اضافه کردن ۱ اسکوپ وی..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 h-24 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsSopModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  {isSubmitting ? "در حال ثبت..." : "ذخیره SOP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {isDecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت تصمیم استراتژیک در لاگ</h3>
              <button onClick={() => setIsDecModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان تصمیم اتخاذ شده:</label>
                <input
                  type="text"
                  required
                  value={decDecision}
                  onChange={(e) => setDecDecision(e.target.value)}
                  placeholder="مثلاً: خرید مستقیم پودر وی از شرکت کاله بدون واسطه"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">زمینه و بستر مسئله (Context):</label>
                <textarea
                  value={decContext}
                  onChange={(e) => setDecContext(e.target.value)}
                  placeholder="چرا این تصمیم مطرح شد و چه شرایطی وجود داشت؟"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 h-16"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">علت انتخاب این راهکار (Why):</label>
                <textarea
                  value={decWhy}
                  onChange={(e) => setDecWhy(e.target.value)}
                  placeholder="دلیل اصلی ترجیح این گزینه نسبت به سایر گزینه‌ها..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 h-16"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">نتیجه مورد انتظار:</label>
                <input
                  type="text"
                  value={decExpected}
                  onChange={(e) => setDecExpected(e.target.value)}
                  placeholder="کاهش ۲۰ درصدی بهای تمام‌شده و تضمین اصالت محصول"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsDecModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت تصمیم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت یادداشت جدید در مغز دوم</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">عنوان یادداشت:</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="عنوان ایده یا نکته..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">دسته‌بندی:</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                >
                  <option value="ایده">ایده نوآورانه</option>
                  <option value="تجربه">تجربه و درس‌آموخته</option>
                  <option value="مدیریت">مدیریت بوفه و فروشگاه</option>
                  <option value="فنی">مهندسی نرم‌افزار رایش</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">متن یادداشت:</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="محتوا و جزئیات..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 h-24"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-950"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold transition-colors shadow-sm"
                >
                  {isSubmitting ? "در حال ثبت..." : "ذخیره یادداشت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
