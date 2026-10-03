"use client";

import { useState, useEffect } from "react";
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
  X,
  LogOut,
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

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onCloseMobile, isMobile }: SidebarProps = {}) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <aside
      className={cn(
        "bg-white border-l border-zinc-200 flex flex-col select-none shadow-sm",
        isMobile ? "w-full h-full" : "w-64 h-screen sticky top-0 shrink-0 z-30"
      )}
    >
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

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-all"
            title="بستن منو"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold">
            v2.5
          </span>
        )}
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
                  onClick={onCloseMobile}
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
                  onClick={onCloseMobile}
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
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name?.[0] || currentUser?.username?.[0]?.toUpperCase() || "L"}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">
                {currentUser?.name || "مدیر سیستم‌عامل"}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                @{currentUser?.username || "sajjad"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/settings"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors"
              title="تنظیمات سیستم"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
