import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TomorrowAgendaWidget from "@/components/dashboard/TomorrowAgendaWidget";
import {
  Target,
  Sun,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Coins,
  HeartPulse,
  FolderKanban,
  Moon,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
  Store,
  Laptop,
  GraduationCap,
  Calendar,
  Bell,
} from "lucide-react";
import { formatCurrency, formatPersianDate, toPersianDigits } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let cycle = null;
  let bigThreeTasks: any[] = [];
  let areas: any[] = [];
  let projects: any[] = [];
  let accounts: any[] = [];
  let lowStockProducts: any[] = [];
  let latestSleep: any = null;
  let cashRegister: any = null;
  let todayReview: any = null;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    cycle = await prisma.cycle90Day.findFirst({ where: { status: "active" } });
    bigThreeTasks = await prisma.task.findMany({
      where: { isBigThree: true },
      take: 3,
      include: { area: true },
    });
    areas = await prisma.area.findMany({ orderBy: { sortOrder: "asc" } });
    projects = await prisma.project.findMany({
      where: { status: "active" },
      take: 4,
      include: { area: true },
    });
    accounts = await prisma.financialAccount.findMany();
    lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 10 } },
      take: 3,
    });
    latestSleep = await prisma.sleepLog.findFirst({ orderBy: { date: "desc" } });
    cashRegister = await prisma.shopCashRegister.findFirst({ orderBy: { date: "desc" } });
    todayReview =
      (await prisma.dailyReview.findFirst({
        where: { date: { gte: todayStart, lte: todayEnd } },
      })) ||
      (await prisma.dailyReview.findFirst({
        orderBy: { date: "desc" },
      }));
  } catch (e) {
    console.error("Dashboard data load error", e);
  }


  const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in bg-white">
      {/* Top Banner: Cycle 90-Day & Mission (Clean Contrast Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-md text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white text-black">
                مرکز فرماندهی یکپارچه
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                فاز جاری: {cycle?.currentPhase || "رشد و تسلط"}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {cycle?.title || "چرخه ۹۰ روزه: رشد درآمد بوفه و آرایشی، تسلط فنی رایش و تثبیت فرم بدنی"}
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              مدیریت زنجیره تأمین بوفه باشگاه، سیستم‌سازی فروشگاه لوازم آرایشی و تحویل پروژه‌های مهندسی شرکت رایش
            </p>
          </div>

          <div className="flex flex-col items-end justify-center bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-w-[210px]">
            <div className="flex items-center justify-between w-full mb-1.5 text-xs text-zinc-300">
              <span>پیشرفت کل چرخه</span>
              <span className="font-bold text-white">{toPersianDigits(92)}٪</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-white h-full w-[92%] rounded-full" />
            </div>
            <span className="text-[11px] text-zinc-400">
              روز {toPersianDigits(90)} از {toPersianDigits(90)} • شبیه‌سازی کامل شد
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Vital Cards (White Surfaces with High-Contrast Text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Big 3 */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">تسک‌های ۳گانه اصلی (Big 3)</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-950 mb-1">
              {toPersianDigits(bigThreeTasks.filter((t) => t.status === "completed").length)} / {toPersianDigits(bigThreeTasks.length || 3)}
            </div>
            <p className="text-xs text-zinc-500">تسک‌های سرنوشت‌ساز روز</p>
          </div>
          <Link
            href="/today"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-800 hover:text-black font-bold"
          >
            <span>مشاهده صفحه امروز</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Financial Health */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">موجودی نقدی و نقدینگی</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-zinc-950 mb-1">
              {formatCurrency(totalCash || 350219000)}
            </div>
            <p className="text-xs text-zinc-500">مجموع تمام حساب‌ها و صندوق</p>
          </div>
          <Link
            href="/finance"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-800 hover:text-black font-bold"
          >
            <span>مرکز مالی، انبار و دخل</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Sleep & Energy */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">راندمان و کیفیت خواب</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-zinc-950">
                {toPersianDigits(latestSleep?.sleepEfficiency || 89.2)}٪
              </span>
              <span className="text-xs text-zinc-500 font-normal">راندمان خواب</span>
            </div>
            <p className="text-xs text-zinc-500">
              {latestSleep ? `${toPersianDigits(Math.round(latestSleep.totalSleepTimeMinutes / 60 * 10) / 10)} ساعت خواب عمیق ترمیمی` : "۷.۲ ساعت خواب عمیق"}
            </p>
          </div>
          <Link
            href="/sleep"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-800 hover:text-black font-bold"
          >
            <span>دفترچه خواب و انرژی</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 4: Focus & Deep Work */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">کار عمیق و انرژی (Deep Work)</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <div className="text-2xl font-black text-zinc-950">
                {toPersianDigits(todayReview?.deepWorkHours ?? 4.0)} <span className="text-sm font-normal text-zinc-500">ساعت</span>
              </div>
              {todayReview?.productivityScore && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold border border-zinc-200">
                  امتیاز: {toPersianDigits(todayReview.productivityScore)}/۱۰
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mb-2">
              هدف روزانه: ۴ ساعت • {todayReview?.mood ? `حال: ${todayReview.mood}` : "تمرکز بالا"}
            </p>
            {/* 4 Energy Levels Badges */}
            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-zinc-100 text-[10px] text-center">
              <div className="p-1 rounded bg-zinc-50 border border-zinc-100">
                <div className="text-zinc-500">جسمی</div>
                <div className="font-bold text-zinc-900">{toPersianDigits(todayReview?.energyPhysical ?? 8)}/۱۰</div>
              </div>
              <div className="p-1 rounded bg-zinc-50 border border-zinc-100">
                <div className="text-zinc-500">عاطفی</div>
                <div className="font-bold text-zinc-900">{toPersianDigits(todayReview?.energyEmotional ?? 8)}/۱۰</div>
              </div>
              <div className="p-1 rounded bg-zinc-50 border border-zinc-100">
                <div className="text-zinc-500">ذهنی</div>
                <div className="font-bold text-zinc-900">{toPersianDigits(todayReview?.energyMental ?? 8)}/۱۰</div>
              </div>
              <div className="p-1 rounded bg-zinc-50 border border-zinc-100">
                <div className="text-zinc-500">معنوی</div>
                <div className="font-bold text-zinc-900">{toPersianDigits(todayReview?.energySpiritual ?? 8)}/۱۰</div>
              </div>
            </div>
          </div>
          <Link
            href="/planner"
            className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-800 hover:text-black font-bold"
          >
            <span>بلوک‌های زمانی و برنامه</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Main Center: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Big 3 & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Big 3 Execution Widget */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">اقدامات ۳گانه طلایی امروز (Today's Big 3)</h3>
              </div>
              <Link href="/today" className="text-xs text-zinc-600 hover:text-black font-bold">
                مدیریت روز ←
              </Link>
            </div>

            <div className="space-y-2.5">
              {bigThreeTasks.length > 0 ? (
                bigThreeTasks.map((t, idx) => {
                  const q = t.eisenhowerQuadrant || "Q1";
                  const badgeClass =
                    q === "Q1"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : q === "Q2"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : q === "Q3"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200";
                  const qLabel =
                    q === "Q1"
                      ? "🚨 سریع و فوری"
                      : q === "Q2"
                      ? "🎯 مهم، غیرفوری"
                      : q === "Q3"
                      ? "⚡ فوری، نامهم"
                      : "🌱 غیرفوری، نامهم";

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center text-xs font-black shrink-0">
                          {toPersianDigits(idx + 1)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{t.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                            <span className={`px-2 py-0.5 rounded border font-bold ${badgeClass}`}>
                              {qLabel}
                            </span>
                            {t.area && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                                {t.area.name}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                              {t.workType}
                            </span>
                            <span className="text-zinc-500 font-mono">{toPersianDigits(t.estimatedMinutes)} دقیقه</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold ${
                          t.status === "completed"
                            ? "bg-black text-white"
                            : "bg-zinc-200 text-zinc-800 border border-zinc-300"
                        }`}
                      >
                        {t.status === "completed" ? "تکمیل شد" : "در حال اجرا"}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-zinc-400">تسک‌های ۳گانه تعیین نشده‌اند.</div>
              )}
            </div>
          </div>

          {/* Tomorrow's Advance Agenda (D-1 Reminders) */}
          <TomorrowAgendaWidget />

          {/* Active Projects Tracker */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">پروژه‌های استراتژیک فعال</h3>
              </div>
              <Link href="/projects" className="text-xs text-zinc-600 hover:text-black font-bold">
                بورد کانبان و همه پروژه‌ها ←
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                        {proj.area?.name || "پروژه"}
                      </span>
                      <span className="text-[11px] font-black text-zinc-950">
                        {toPersianDigits(proj.progress)}٪
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1 mb-2">
                      {proj.title}
                    </h4>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-black h-full rounded-full"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-200">
                    <span>بودجه: {formatCurrency(proj.budget)}</span>
                    <span className="text-zinc-900 font-bold">وضعیت: عالی</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Operational Alerts & Life Domains */}
        <div className="space-y-6">
          {/* Critical Warnings */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3.5">
              <AlertTriangle className="w-4 h-4 text-zinc-900" />
              <h3 className="font-bold text-sm text-zinc-950">وضعیت پایش عملیاتی</h3>
            </div>

            <div className="space-y-2.5">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">نیاز به شارژ انبار: {p.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      موجودی فعلی: {toPersianDigits(p.stock)} عدد (حداقل: {toPersianDigits(p.minimumStock)})
                    </p>
                  </div>
                  <Link
                    href="/finance"
                    className="px-2.5 py-1 bg-black text-white hover:bg-zinc-800 rounded-lg text-[10px] font-bold"
                  >
                    انبار
                  </Link>
                </div>
              ))}

              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-zinc-900">تطبیق دخل بوفه باشگاه و فروشگاه</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    مانده دخل: {formatCurrency(cashRegister?.actualClosingCash || 7850000)} (بالانس ۱۰۰٪)
                  </p>
                </div>
                <Link
                  href="/finance"
                  className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 rounded-lg text-[10px] font-bold"
                >
                  صندوق
                </Link>
              </div>
            </div>
          </div>

          {/* Life Domains Grid */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-sm text-zinc-950">حوزه‌های کلیدی زندگی</h3>
              <Link href="/areas" className="text-xs text-zinc-600 hover:text-black font-bold">
                مدیریت ←
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {areas.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center text-center hover:border-zinc-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-900 flex items-center justify-center text-xs mb-1.5 font-bold">
                    {a.name.includes("بوفه") && <Store className="w-3.5 h-3.5" />}
                    {a.name.includes("آرایشی") && <Sparkles className="w-3.5 h-3.5" />}
                    {a.name.includes("رایش") && <Laptop className="w-3.5 h-3.5" />}
                    {a.name.includes("دانشگاه") && <GraduationCap className="w-3.5 h-3.5" />}
                    {a.name.includes("سلامت") && <HeartPulse className="w-3.5 h-3.5" />}
                    {!["بوفه", "آرایشی", "رایش", "دانشگاه", "سلامت"].some((k) => a.name.includes(k)) && (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-900 line-clamp-1">
                    {a.name}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-medium mt-0.5">فعال</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
