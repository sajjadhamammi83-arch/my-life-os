"use client";

import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Flame,
  Activity,
  Search,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  Edit2,
  Trash2,
  Settings2,
  Calendar,
  Clock,
  TrendingUp,
  Brain,
  Heart,
  Zap,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Smile,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Award,
  Filter,
} from "lucide-react";
import { toPersianDigits, formatPersianDate } from "@/lib/utils";

interface ReviewQuestion {
  id: string;
  question: string;
  category: string;
  placeholder?: string | null;
  order: number;
  isActive: boolean;
}

interface DailyReview {
  id: string;
  date: string;
  big3Completed: number;
  whatWentWell?: string | null;
  whatFailed?: string | null;
  bottleneck?: string | null;
  lessonsLearned?: string | null;
  tomorrowChanges?: string | null;
  gratitude?: string | null;
  keyInsight?: string | null;
  mood?: string | null;
  productivityScore: number;
  deepWorkHours: number;
  customAnswers?: string | null;
  energyPhysical: number;
  energyEmotional: number;
  energyMental: number;
  energySpiritual: number;
}

const MOODS = [
  { id: "عالی و پرانرژی", label: "🚀 عالی و پرانرژی", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { id: "متمرکز و پیوسته", label: "🎯 متمرکز و پیوسته", color: "bg-blue-50 text-blue-800 border-blue-300" },
  { id: "معمولی و آرام", label: "☕ معمولی و آرام", color: "bg-zinc-100 text-zinc-800 border-zinc-300" },
  { id: "خسته و کم‌انرژی", label: "💤 خسته و کم‌انرژی", color: "bg-amber-50 text-amber-800 border-amber-300" },
  { id: "پراکنده و تحت فشار", label: "🌪️ پراکنده و تحت فشار", color: "bg-rose-50 text-rose-800 border-rose-300" },
];

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"TODAY" | "HISTORY" | "TRENDS">("TODAY");

  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [automatedStats, setAutomatedStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Form states for Daily Review
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formBig3, setFormBig3] = useState(3);
  const [formProductivity, setFormProductivity] = useState(8);
  const [formMood, setFormMood] = useState("متمرکز و پیوسته");
  const [formDeepWork, setFormDeepWork] = useState("3.0");

  const [formPhys, setFormPhys] = useState(8);
  const [formEmot, setFormEmot] = useState(8);
  const [formMent, setFormMent] = useState(8);
  const [formSpir, setFormSpir] = useState(8);

  const [formWhatWentWell, setFormWhatWentWell] = useState("");
  const [formWhatFailed, setFormWhatFailed] = useState("");
  const [formBottleneck, setFormBottleneck] = useState("");
  const [formLessons, setFormLessons] = useState("");
  const [formTomorrowChanges, setFormTomorrowChanges] = useState("");
  const [formGratitude, setFormGratitude] = useState("");
  const [formKeyInsight, setFormKeyInsight] = useState("");

  const [customAnswersMap, setCustomAnswersMap] = useState<Record<string, string>>({});

  // Question Management Form
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("عمومی");
  const [newQuestionPlaceholder, setNewQuestionPlaceholder] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setQuestions(data.questions || []);
        setAutomatedStats(data.automatedTodayStats || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Today's review
  const todayDateStr = new Date().toISOString().substring(0, 10);
  const todayReview = reviews.find((r) => r.date.substring(0, 10) === todayDateStr) || reviews[0];

  // Open modal to Create or Edit
  const handleOpenReviewModal = (existing?: DailyReview) => {
    if (existing) {
      setIsEditMode(true);
      setEditingReviewId(existing.id);
      setFormDate(existing.date.substring(0, 10));
      setFormBig3(existing.big3Completed || 0);
      setFormProductivity(existing.productivityScore || 8);
      setFormMood(existing.mood || "متمرکز و پیوسته");
      setFormDeepWork(String(existing.deepWorkHours || "0"));
      setFormPhys(existing.energyPhysical || 7);
      setFormEmot(existing.energyEmotional || 7);
      setFormMent(existing.energyMental || 7);
      setFormSpir(existing.energySpiritual || 7);
      setFormWhatWentWell(existing.whatWentWell || "");
      setFormWhatFailed(existing.whatFailed || "");
      setFormBottleneck(existing.bottleneck || "");
      setFormLessons(existing.lessonsLearned || "");
      setFormTomorrowChanges(existing.tomorrowChanges || "");
      setFormGratitude(existing.gratitude || "");
      setFormKeyInsight(existing.keyInsight || "");

      try {
        if (existing.customAnswers) {
          setCustomAnswersMap(JSON.parse(existing.customAnswers));
        } else {
          setCustomAnswersMap({});
        }
      } catch {
        setCustomAnswersMap({});
      }
    } else {
      setIsEditMode(false);
      setEditingReviewId(null);
      setFormDate(new Date().toISOString().substring(0, 10));
      setFormBig3(automatedStats.big3Completed || 3);
      setFormProductivity(8);
      setFormMood("متمرکز و پیوسته");
      setFormDeepWork(String(automatedStats.deepWorkHours || "2.5"));
      setFormPhys(8);
      setFormEmot(8);
      setFormMent(8);
      setFormSpir(8);
      setFormWhatWentWell("");
      setFormWhatFailed("");
      setFormBottleneck("");
      setFormLessons("");
      setFormTomorrowChanges("");
      setFormGratitude("");
      setFormKeyInsight("");
      setCustomAnswersMap({});
    }

    setIsReviewModalOpen(true);
  };

  // Save Daily Review
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEditMode ? editingReviewId : undefined,
          date: formDate,
          big3Completed: Number(formBig3),
          productivityScore: Number(formProductivity),
          mood: formMood,
          deepWorkHours: Number(formDeepWork),
          energyPhysical: Number(formPhys),
          energyEmotional: Number(formEmot),
          energyMental: Number(formMent),
          energySpiritual: Number(formSpir),
          whatWentWell: formWhatWentWell,
          whatFailed: formWhatFailed,
          bottleneck: formBottleneck,
          lessonsLearned: formLessons,
          tomorrowChanges: formTomorrowChanges,
          gratitude: formGratitude,
          keyInsight: formKeyInsight,
          customAnswers: customAnswersMap,
        }),
      });

      setStatusMsg("ارزیابی روزانه با موفقیت ثبت و همگام شد ✓");
      setIsReviewModalOpen(false);
      fetchData();
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: string) => {
    if (!confirm("آیا از حذف این گزارش ارزیابی روزانه اطمینان دارید؟")) return;
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Custom Question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question",
          question: newQuestionText,
          category: newQuestionCategory,
          placeholder: newQuestionPlaceholder,
        }),
      });
      setNewQuestionText("");
      setNewQuestionPlaceholder("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle or Update Question
  const handleToggleQuestionActive = async (q: ReviewQuestion) => {
    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_question",
          id: q.id,
          isActive: !q.isActive,
        }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Reorder Questions
  const handleReorderQuestions = async (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;

    const newQList = [...questions];
    const temp = newQList[index];
    newQList[index] = newQList[target];
    newQList[target] = temp;

    setQuestions(newQList);

    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder_questions",
          reorderList: newQList.map((q) => q.id),
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("آیا از حذف این پرسش سفارشی اطمینان دارید؟")) return;
    try {
      await fetch(`/api/reviews?type=question&id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-black text-white shadow-sm">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-950">
                مرکز بازبینی، ارزیابی روزانه و خودآگاهی استراتژیک
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold">
                نسخه ۲.۰
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              ممیزی ۴ سطح انرژی، انطباق با اقدامات طلایی و دخل روزانه، ریشه‌یابی خطاها و کاستوم‌سازی کامل پرسش‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <button
            onClick={() => setIsQuestionsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold border border-zinc-200 transition-all"
          >
            <Settings2 className="w-4 h-4 text-zinc-600" />
            <span>کاستوم‌سازی پرسش‌ها</span>
          </button>

          <button
            onClick={() => handleOpenReviewModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>ثبت ارزیابی روز / شب</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-fade-in">
          {statusMsg}
        </div>
      )}

      {/* AUTOMATED REALITY METRICS BAR (امروز در آیینه واقعیت) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>اقدامات ۳ گانه طلایی امروز</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-black text-zinc-950 font-mono">
            {toPersianDigits(automatedStats.big3Completed || 0)} از {toPersianDigits(automatedStats.big3Total || 3)} اقدام
          </p>
          <span className="text-[10px] text-zinc-400 block">پایش خودکار از صفحه امروز</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>تمرکز و کار عمیق (Deep Work)</span>
            <Brain className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-blue-600 font-mono">
            {toPersianDigits(automatedStats.deepWorkHours || 0)} ساعت
          </p>
          <span className="text-[10px] text-blue-500 block">ثبت‌شده در تایم‌بلاکینگ تقویم</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>کل کارهای تکمیل‌شده امروز</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-black text-emerald-600 font-mono">
            {toPersianDigits(automatedStats.totalCompletedTasks || 0)} تسک
          </p>
          <span className="text-[10px] text-emerald-500 block">بایگانی کارهای انجام‌شده</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>وضعیت دخل و فروش امروز</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs font-black text-zinc-950 pt-1">
            {automatedStats.todayCashRegisters && automatedStats.todayCashRegisters.length > 0 ? (
              <span className="text-emerald-700">دخل بوفه تسویه و بالانس است ✓</span>
            ) : (
              <span className="text-zinc-400 font-medium">هنوز ثبت دخل انجام نشده</span>
            )}
          </p>
          <span className="text-[10px] text-zinc-400 block">متصل به ماژول حسابداری</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "TODAY", label: "🌟 نمای ارزیابی فعال و دستاوردها" },
          { id: "HISTORY", label: `📜 تاریخچه و آرشیو بازبینی‌ها (${toPersianDigits(reviews.length)})` },
          { id: "TRENDS", label: "📈 تحلیل روند بهره‌وری و انرژی" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-black text-white shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TODAY'S ACTIVE REFLECTION */}
      {activeTab === "TODAY" && (
        <div className="space-y-6">
          {todayReview ? (
            <div className="space-y-6">
              {/* Review Overview Banner */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold border border-zinc-200">
                      تاریخ: {formatPersianDate(todayReview.date)}
                    </span>
                    {todayReview.mood && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold border border-zinc-200">
                        {todayReview.mood}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-base text-zinc-950">ارزیابی ثبت‌شده برای این روز</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    امتیاز بهره‌وری: {toPersianDigits(todayReview.productivityScore)} از ۱۰ | ساعت کار عمیق: {toPersianDigits(todayReview.deepWorkHours)} ساعت
                  </p>
                </div>

                <button
                  onClick={() => handleOpenReviewModal(todayReview)}
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start md:self-center flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش کامل این ارزیابی</span>
                </button>
              </div>

              {/* 4 Energy Levels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "انرژی جسمانی (Physical)",
                    score: todayReview.energyPhysical,
                    desc: "خواب، تغذیه و تمرین بدنی در باشگاه",
                    icon: Zap,
                    color: "text-amber-500",
                  },
                  {
                    title: "انرژی هیجانی (Emotional)",
                    score: todayReview.energyEmotional,
                    desc: "روابط، تاب‌آوری روانی و آرامش",
                    icon: Heart,
                    color: "text-rose-500",
                  },
                  {
                    title: "انرژی ذهنی (Mental)",
                    score: todayReview.energyMental,
                    desc: "تمرکز، کار عمیق و عدم حواس‌پرتی",
                    icon: Brain,
                    color: "text-blue-500",
                  },
                  {
                    title: "انرژی معنوی (Spiritual)",
                    score: todayReview.energySpiritual,
                    desc: "همسویی با رسالت، ارزش‌ها و اهداف بلندمدت",
                    icon: Sparkles,
                    color: "text-purple-500",
                  },
                ].map((en, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-700">{en.title}</span>
                      <en.icon className={`w-4 h-4 ${en.color}`} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black font-mono text-zinc-950">
                        {toPersianDigits(en.score)}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">/ ۱۰</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-black h-full rounded-full"
                        style={{ width: `${(en.score / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 pt-0.5">{en.desc}</p>
                  </div>
                ))}
              </div>

              {/* Core 3 Reflection Questions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-2.5">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ۱. چه چیزی امروز عالی پیش رفت؟
                  </span>
                  <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                    {todayReview.whatWentWell || "موردی ثبت نشده است."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-2.5">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    ۲. چه چیزی طبق انتظار پیش نرفت یا متوقف شد؟
                  </span>
                  <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                    {todayReview.whatFailed || "موردی ثبت نشده است."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-2.5">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    ۳. چه تغییری برای روز بعد ضروری است؟
                  </span>
                  <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                    {todayReview.tomorrowChanges || "موردی ثبت نشده است."}
                  </p>
                </div>
              </div>

              {/* Strategic Insights & Bottlenecks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todayReview.bottleneck && (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                    <span className="font-bold text-zinc-950 block">گلوگاه اصلی و مانع تمرکز:</span>
                    <p className="text-zinc-700 leading-relaxed">{todayReview.bottleneck}</p>
                  </div>
                )}

                {todayReview.keyInsight && (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                    <span className="font-bold text-zinc-950 block">بینش کلیدی و درس روز:</span>
                    <p className="text-zinc-700 leading-relaxed">{todayReview.keyInsight}</p>
                  </div>
                )}

                {todayReview.gratitude && (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                    <span className="font-bold text-zinc-950 block">شکرگزاری و قدردانی:</span>
                    <p className="text-zinc-700 leading-relaxed">{todayReview.gratitude}</p>
                  </div>
                )}
              </div>

              {/* Custom Questions Answers Preview */}
              {todayReview.customAnswers && (
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs text-zinc-950 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-zinc-700" />
                    پاسخ به پرسش‌های سفارشی شما:
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      try {
                        const parsed = JSON.parse(todayReview.customAnswers);
                        return Object.entries(parsed).map(([qId, ans]) => {
                          const qObj = questions.find((q) => q.id === qId);
                          return (
                            <div key={qId} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                              <span className="text-[11px] font-bold text-zinc-500 block">
                                {qObj?.question || "پرسش سفارشی"}:
                              </span>
                              <p className="text-zinc-900 font-medium leading-relaxed">{String(ans) || "—"}</p>
                            </div>
                          );
                        });
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-2xl space-y-3">
              <ClipboardCheck className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-bold text-zinc-800">ارزیابی امروز هنوز ثبت نشده است.</p>
              <button
                onClick={() => handleOpenReviewModal()}
                className="px-5 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 shadow-md"
              >
                ثبت اولین ارزیابی امروز
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORY & ARCHIVE */}
      {activeTab === "HISTORY" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-700" />
                آرشیو و تاریخچه ارزیابی‌های روزانه
              </h3>
              <p className="text-[11px] text-zinc-500">
                مرور، ویرایش کامل و بررسی سیر تحول بهره‌وری و انرژی روزهای گذشته
              </p>
            </div>

            <button
              onClick={() => handleOpenReviewModal()}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800"
            >
              + ثبت برای روز گذشته یا امروز
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">تاریخ ارزیابی</th>
                  <th className="p-3">بهره‌وری</th>
                  <th className="p-3">مود روحی</th>
                  <th className="p-3">۳ اقدام طلایی</th>
                  <th className="p-3">کار عمیق</th>
                  <th className="p-3">میانگین ۴ انرژی</th>
                  <th className="p-3">دستاورد برجسته</th>
                  <th className="p-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {reviews.map((r) => {
                  const avgEnergy = (
                    (r.energyPhysical + r.energyEmotional + r.energyMental + r.energySpiritual) /
                    4
                  ).toFixed(1);

                  return (
                    <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-zinc-950">
                        {formatPersianDate(r.date)}
                      </td>
                      <td className="p-3 font-mono font-black text-zinc-950">
                        {toPersianDigits(r.productivityScore)} / ۱۰
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-bold text-[10px]">
                          {r.mood || "متمرکز"}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-700">
                        {toPersianDigits(r.big3Completed)} از ۳
                      </td>
                      <td className="p-3 font-mono text-blue-600 font-bold">
                        {toPersianDigits(r.deepWorkHours)} ساعت
                      </td>
                      <td className="p-3 font-mono text-zinc-700">
                        {toPersianDigits(avgEnergy)} / ۱۰
                      </td>
                      <td className="p-3 text-zinc-800 truncate max-w-xs">
                        {r.whatWentWell || "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenReviewModal(r)}
                            className="p-1 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded"
                            title="ویرایش این ارزیابی"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="حذف ارزیابی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRENDS */}
      {activeTab === "TRENDS" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-700" />
              تحلیل و شاخص‌های هفتگی سطوح ۴ گانه انرژی و بهره‌وری
            </h3>
            <span className="text-xs text-zinc-500">بر مبنای ارزیابی‌های ثبت‌شده</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "میانگین انرژی جسمانی",
                avg: (reviews.reduce((s, r) => s + r.energyPhysical, 0) / (reviews.length || 1)).toFixed(1),
                color: "text-amber-600",
                icon: Zap,
              },
              {
                label: "میانگین انرژی هیجانی",
                avg: (reviews.reduce((s, r) => s + r.energyEmotional, 0) / (reviews.length || 1)).toFixed(1),
                color: "text-rose-600",
                icon: Heart,
              },
              {
                label: "میانگین انرژی ذهنی",
                avg: (reviews.reduce((s, r) => s + r.energyMental, 0) / (reviews.length || 1)).toFixed(1),
                color: "text-blue-600",
                icon: Brain,
              },
              {
                label: "میانگین انرژی معنوی",
                avg: (reviews.reduce((s, r) => s + r.energySpiritual, 0) / (reviews.length || 1)).toFixed(1),
                color: "text-purple-600",
                icon: Sparkles,
              },
            ].map((trend, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>{trend.label}</span>
                  <trend.icon className={`w-4 h-4 ${trend.color}`} />
                </div>
                <p className="text-2xl font-black font-mono text-zinc-950">
                  {toPersianDigits(trend.avg)} <span className="text-xs text-zinc-400">/ ۱۰</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: RICH DAILY REVIEW (CREATE & EDIT) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-zinc-950" />
                <h3 className="font-black text-base text-zinc-950">
                  {isEditMode ? "ویرایش گزارش ارزیابی روزانه" : "ثبت ارزیابی روزانه و ممیزی انرژی"}
                </h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              {/* Row 1: Date & Mood */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">تاریخ ارزیابی:</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">حالت روحی غالب امروز:</label>
                  <select
                    value={formMood}
                    onChange={(e) => setFormMood(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-bold"
                  >
                    {MOODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Big 3 Completed & Productivity Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">۳ اقدام طلایی تکمیل‌شده:</label>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[0, 1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormBig3(num)}
                        className={`py-1.5 rounded-xl font-mono font-bold text-xs border transition-all ${
                          formBig3 === num
                            ? "bg-black text-white border-black"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {toPersianDigits(num)} اقدام
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">
                    امتیاز بهره‌وری کل روز ({toPersianDigits(formProductivity)} از ۱۰):
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formProductivity}
                    onChange={(e) => setFormProductivity(Number(e.target.value))}
                    className="w-full accent-black mt-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ساعات کار عمیق (Deep Work):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formDeepWork}
                    onChange={(e) => setFormDeepWork(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              {/* 4 Energy Levels Sliders */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                <h4 className="font-bold text-xs text-zinc-900">ممیزی ۴ سطح انرژی زیستی (از ۱ تا ۱۰):</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-700 font-medium">
                      <span>انرژی جسمانی (خواب، تغذیه، باشگاه):</span>
                      <span className="font-bold font-mono">{toPersianDigits(formPhys)} / ۱۰</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formPhys}
                      onChange={(e) => setFormPhys(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-700 font-medium">
                      <span>انرژی هیجانی (روابط، آرامش، امید):</span>
                      <span className="font-bold font-mono">{toPersianDigits(formEmot)} / ۱۰</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formEmot}
                      onChange={(e) => setFormEmot(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-700 font-medium">
                      <span>انرژی ذهنی (تمرکز عمیق، شفافیت):</span>
                      <span className="font-bold font-mono">{toPersianDigits(formMent)} / ۱۰</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formMent}
                      onChange={(e) => setFormMent(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-700 font-medium">
                      <span>انرژی معنوی (رسالت، انگیزه درونی):</span>
                      <span className="font-bold font-mono">{toPersianDigits(formSpir)} / ۱۰</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formSpir}
                      onChange={(e) => setFormSpir(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3 Core Questions */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-zinc-800 font-bold">
                    ۱. چه چیزی امروز عالی پیش رفت؟ (موفقیت‌های کاری، شخصی، مالی):
                  </label>
                  <textarea
                    rows={2}
                    value={formWhatWentWell}
                    onChange={(e) => setFormWhatWentWell(e.target.value)}
                    placeholder="فروش بوفه، پیشرفت ماژول رایش، چیدمان فروشگاه..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-800 font-bold">
                    ۲. چه چیزی طبق انتظار پیش نرفت و گلوگاه اصلی چه بود؟
                  </label>
                  <textarea
                    rows={2}
                    value={formWhatFailed}
                    onChange={(e) => setFormWhatFailed(e.target.value)}
                    placeholder="تأخیرها، حواس‌پرتی، خستگی یا مشکلات غیرمنتظره..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-800 font-bold">
                    ۳. چه تغییر مشخصی برای فردا باید اعمال شود؟
                  </label>
                  <textarea
                    rows={2}
                    value={formTomorrowChanges}
                    onChange={(e) => setFormTomorrowChanges(e.target.value)}
                    placeholder="انتقال یک کار به صبح، زمان‌بندی دقیق‌تر، استراحت سر ساعت..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 resize-none"
                  />
                </div>
              </div>

              {/* Gratitude & Key Insight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">بینش کلیدی و درس روز:</label>
                  <input
                    type="text"
                    value={formKeyInsight}
                    onChange={(e) => setFormKeyInsight(e.target.value)}
                    placeholder="قانون یا تجربه‌ای که امروز یاد گرفتم..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">شکرگزاری و قدردانی:</label>
                  <input
                    type="text"
                    value={formGratitude}
                    onChange={(e) => setFormGratitude(e.target.value)}
                    placeholder="سلامت، همراهی خانواده، دستاوردهای روز..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
              </div>

              {/* Dynamic Custom Questions */}
              {questions.filter((q) => q.isActive).length > 0 && (
                <div className="space-y-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <h4 className="font-bold text-xs text-zinc-900">
                    پرسش‌های سفارشی شما (تنظیم‌شده در کاستوم‌سازی):
                  </h4>

                  {questions
                    .filter((q) => q.isActive)
                    .map((q) => (
                      <div key={q.id} className="space-y-1">
                        <label className="block text-zinc-700 font-bold">{q.question}</label>
                        <input
                          type="text"
                          value={customAnswersMap[q.id] || ""}
                          onChange={(e) =>
                            setCustomAnswersMap({
                              ...customAnswersMap,
                              [q.id]: e.target.value,
                            })
                          }
                          placeholder={q.placeholder || "پاسخ شما..."}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : isEditMode ? "ذخیره تغییرات ارزیابی" : "ثبت رسمی ارزیابی روز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CUSTOMIZE REVIEW QUESTIONS */}
      {isQuestionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-zinc-950" />
                <h3 className="font-black text-base text-zinc-950">
                  کاستوم‌سازی و تنظیم پرسش‌های ارزیابی روزانه
                </h3>
              </div>
              <button
                onClick={() => setIsQuestionsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-zinc-800">
                پرسش‌های فعال و اولویت‌بندی شده برای فرم بازبینی روزانه:
              </h4>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <input
                        type="checkbox"
                        checked={q.isActive}
                        onChange={() => handleToggleQuestionActive(q)}
                        className="rounded border-zinc-300 accent-black w-4 h-4 cursor-pointer"
                        title="فعال / غیرفعال"
                      />
                      <div className="flex-1">
                        <p className={`font-bold ${q.isActive ? "text-zinc-950" : "text-zinc-400 line-through"}`}>
                          {q.question}
                        </p>
                        <span className="text-[10px] text-zinc-500">دسته‌بندی: {q.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorderQuestions(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-black disabled:opacity-20"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReorderQuestions(idx, "down")}
                        disabled={idx === questions.length - 1}
                        className="p-1 text-zinc-400 hover:text-black disabled:opacity-20"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600"
                        title="حذف پرسش"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Question Form */}
            <form onSubmit={handleAddQuestion} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                افزودن پرسش سفارشی جدید
              </h4>

              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="متن پرسش (مثلاً: وضعیت پیشرفت پروژه‌های رایش چطور بود؟)"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <select
                    value={newQuestionCategory}
                    onChange={(e) => setNewQuestionCategory(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-950"
                  >
                    <option value="عمومی">عمومی و سبک زندگی</option>
                    <option value="کسب‌وکار">کسب‌وکار و رایش</option>
                    <option value="مالی و دخل">مالی، بوفه و فروشگاه</option>
                    <option value="سلامت و ورزش">سلامت، تغذیه و باشگاه</option>
                    <option value="یادگیری و کتاب">یادگیری و دانشگاه</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="متن راهنما (اختیاری)"
                    value={newQuestionPlaceholder}
                    onChange={(e) => setNewQuestionPlaceholder(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-950"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all"
                >
                  + افزودن به پرسش‌ها
                </button>
              </div>
            </form>

            <div className="pt-2 flex justify-end border-t border-zinc-200">
              <button
                onClick={() => setIsQuestionsModalOpen(false)}
                className="px-5 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800"
              >
                بستن و ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
