"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";
import { syncEngine, SyncStatus } from "@/lib/pwa/sync-engine";
import { toPersianDigits } from "@/lib/utils";

export default function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>({
    state: "online",
    pendingCount: 0,
    lastSyncedAt: null,
  });

  useEffect(() => {
    // Initial fetch
    syncEngine.getStatusWithCount().then(setStatus);

    const handleSyncStatus = (e: any) => {
      if (e.detail) {
        setStatus(e.detail);
      }
    };

    window.addEventListener("sync-status-changed", handleSyncStatus);
    window.addEventListener("outbox-updated", () => {
      syncEngine.getStatusWithCount().then(setStatus);
    });

    return () => {
      window.removeEventListener("sync-status-changed", handleSyncStatus);
    };
  }, []);

  const handleManualSync = () => {
    syncEngine.checkServerAndSync();
  };

  if (status.state === "syncing") {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium transition-all hover:bg-blue-100"
        title="در حال ارسال تغییرات به سرور..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
        <span className="hidden sm:inline">در حال همگام‌سازی...</span>
      </button>
    );
  }

  if (status.state === "offline") {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-semibold transition-all hover:bg-amber-100"
        title={
          status.pendingCount > 0
            ? `${toPersianDigits(status.pendingCount)} تغییر در حافظه گوشی ذخیره شده و پس از اتصال ارسال می‌شود (برای بررسی کلیک کنید)`
            : "حالت آفلاین — تمام تغییرات در حافظه گوشی ذخیره می‌شوند"
        }
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        <span className="hidden sm:inline">آفلاین (حافظه گوشی)</span>
        {status.pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
            {toPersianDigits(status.pendingCount)}
          </span>
        )}
      </button>
    );
  }

  // Online & Synced
  return (
    <button
      onClick={handleManualSync}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-medium transition-all"
      title="سیستم آنلاین و پایگاه‌داده همگام است (برای همگام‌سازی دستی کلیک کنید)"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="hidden sm:inline text-zinc-800">همگام با سرور</span>
      <Cloud className="w-3 h-3 text-zinc-400" />
    </button>
  );
}
