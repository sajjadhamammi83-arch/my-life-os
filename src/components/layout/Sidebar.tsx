"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sun,
  Inbox,
  Target,
  Calendar,
  FolderKanban,
  HeartPulse,
  Coins,
  ClipboardCheck,
  GraduationCap,
  RotateCcw,
  Moon,
  Brain,
  BarChart3,
  Zap,
  Settings,
  Layers,
  CheckSquare,
  Clock,
  FolderTree,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { name: "فرماندهی", href: "/dashboard", icon: LayoutDashboard },
  { name: "امروز", href: "/today", icon: Sun, badge: "Big 3" },
  { name: "ماتریس وظایف", href: "/tasks", icon: CheckSquare },
  { name: "اینباکس", href: "/inbox", icon: Inbox },
  { name: "اهداف و استراتژی", href: "/goals", icon: Target },
  { name: "برنامه و تقویم", href: "/planner", icon: Calendar },
  { name: "پروژه‌ها و کانبان", href: "/projects", icon: FolderKanban },
  { name: "سلامت و تغذیه", href: "/health", icon: HeartPulse },
  { name: "مالی و حسابداری", href: "/finance", icon: Coins },
  { name: "بازبینی و ارزیابی", href: "/review", icon: ClipboardCheck },
];

const secondaryNav = [
  { name: "حوزه‌های زندگی", href: "/areas", icon: FolderTree },
  { name: "روتین‌های روز و شب", href: "/routines", icon: Clock },
  { name: "عادت‌ها و استریک", href: "/habits", icon: RotateCcw },
  { name: "دفترچه خواب", href: "/sleep", icon: Moon },
  { name: "یادگیری و دانشگاه", href: "/learning", icon: GraduationCap },
  { name: "پایگاه دانش و SOP", href: "/knowledge", icon: Brain },
  { name: "گزارش‌ها و تحلیل", href: "/analytics", icon: BarChart3 },
  { name: "موتور خودکارسازی", href: "/automation", icon: Zap },
  { name: "تنظیمات", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-l border-zinc-200 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-950">Life OS</h1>
            <p className="text-[10px] text-zinc-500 font-medium">سیستم‌عامل یکپارچه</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold">
          v2.5
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Primary Group */}
        <div>
          <div className="text-[10px] font-bold text-zinc-400 px-3 mb-1.5 uppercase tracking-wider">
            محورهای فرماندهی
          </div>
          <nav className="space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all font-medium",
                    isActive
                      ? "bg-black text-white font-bold shadow-sm"
                      : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-500")} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold",
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Group */}
        <div>
          <div className="text-[10px] font-bold text-zinc-400 px-3 mb-1.5 uppercase tracking-wider">
            سیستم‌ها و ابزارها
          </div>
          <nav className="space-y-0.5">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all font-medium",
                    isActive
                      ? "bg-black text-white font-bold shadow-sm"
                      : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-500")} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
              L
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-zinc-900 truncate">مدیر سیستم‌عامل</p>
              <p className="text-[10px] text-zinc-500 truncate">بوفه • آرایشی • رایش</p>
            </div>
          </div>

          <Link
            href="/settings"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
