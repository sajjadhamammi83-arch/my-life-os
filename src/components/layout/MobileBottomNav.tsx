"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, CheckSquare, Plus, Coins, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenQuickCapture: () => void;
  onOpenMobileMenu: () => void;
}

export default function MobileBottomNav({
  onOpenQuickCapture,
  onOpenMobileMenu,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  // If on login, do not show bottom nav
  if (pathname === "/login") return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none"
      dir="rtl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. امروز (Today) */}
        <Link
          href="/today"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
            pathname === "/today"
              ? "text-zinc-950 font-bold"
              : "text-zinc-400 hover:text-zinc-700"
          )}
        >
          <Sun
            className={cn(
              "w-5 h-5 transition-transform",
              pathname === "/today" ? "text-zinc-950 stroke-[2.5] scale-110" : "text-zinc-400"
            )}
          />
          <span className="text-[10px] tracking-tight">امروز</span>
        </Link>

        {/* 2. وظایف (Tasks) */}
        <Link
          href="/tasks"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
            pathname === "/tasks"
              ? "text-zinc-950 font-bold"
              : "text-zinc-400 hover:text-zinc-700"
          )}
        >
          <CheckSquare
            className={cn(
              "w-5 h-5 transition-transform",
              pathname === "/tasks" ? "text-zinc-950 stroke-[2.5] scale-110" : "text-zinc-400"
            )}
          />
          <span className="text-[10px] tracking-tight">وظایف</span>
        </Link>

        {/* 3. ثبت سریع (Center FAB) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onOpenQuickCapture}
            className="-mt-5 w-12 h-12 rounded-full bg-zinc-950 hover:bg-zinc-800 active:scale-90 text-white shadow-lg shadow-zinc-950/30 flex items-center justify-center transition-all border-2 border-white ring-2 ring-zinc-200"
            title="ثبت سریع (Quick Capture)"
            aria-label="ثبت سریع"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] text-zinc-500 font-bold mt-0.5">ثبت سریع</span>
        </div>

        {/* 4. مالی و دخل (Finance) */}
        <Link
          href="/finance"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
            pathname === "/finance"
              ? "text-zinc-950 font-bold"
              : "text-zinc-400 hover:text-zinc-700"
          )}
        >
          <Coins
            className={cn(
              "w-5 h-5 transition-transform",
              pathname === "/finance" ? "text-zinc-950 stroke-[2.5] scale-110" : "text-zinc-400"
            )}
          />
          <span className="text-[10px] tracking-tight">مالی</span>
        </Link>

        {/* 5. منو (Drawer Menu) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all"
          title="مشاهده همه بخش‌ها"
          aria-label="منوی بخش‌ها"
        >
          <Menu className="w-5 h-5 text-zinc-500" />
          <span className="text-[10px] tracking-tight">منو</span>
        </button>
      </div>
    </nav>
  );
}
