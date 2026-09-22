"use client";

import { useState, useEffect } from "react";
import {
  Inbox,
  CheckCircle2,
  Trash2,
  Plus,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function InboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchInbox = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.success) {
        setItems(data.tasks.filter((t: any) => t.status === "inbox"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          status: "inbox",
          workType: "Shallow Work",
          priority: "medium",
        }),
      });
      if (res.ok) {
        setNewTitle("");
        fetchInbox();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const moveToToday = async (task: any) => {
    setItems(items.filter((i) => i.id !== task.id));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: "today" }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const convertToProject = async (task: any) => {
    setItems(items.filter((i) => i.id !== task.id));
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          budget: 0,
          expectedOutput: "پروژه ایجاد شده از اینباکس",
        }),
      });
      await fetch(`/api/tasks?id=${task.id}`, { method: "DELETE" });
      alert(`تسک "${task.title}" با موفقیت به پروژه تبدیل شد.`);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteItem = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">صندوق ورودی همه‌منظوره (Universal GTD Inbox)</h2>
            <p className="text-xs text-zinc-500">
              ثبت سریع افکار و تصمیم‌گیری آنی: تبدیل به تسک امروز، پروژه، یا حذف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-200 font-medium">
            در انتظار پردازش: <span className="text-zinc-950 font-bold">{toPersianDigits(items.length)}</span>
          </span>
        </div>
      </div>

      {/* GTD Decision Matrix Flow Banner */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <HelpCircle className="w-4 h-4 text-zinc-950" />
          <span className="font-semibold">جریان پردازش GTD:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-zinc-500">
          <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded">آیا قابل اقدام است؟</span>
          <span>←</span>
          <span className="text-zinc-500 font-medium">خیر: حذف / بایگانی مرجع</span>
          <span>|</span>
          <span className="text-zinc-950 font-medium">بله: زیر ۲ دقیقه انجام بده / تسک امروز / پروژه</span>
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="شکار سریع فکر، ایده یا کار جدید در اینباکس..."
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-950 placeholder-zinc-500 focus:outline-none focus:border-white"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>شکار ورودی</span>
        </button>
      </form>

      {/* Items List */}
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-50/50 border border-zinc-200">
            <CheckCircle2 className="w-10 h-10 text-zinc-950 mx-auto mb-3" />
            <h4 className="font-bold text-zinc-950 mb-1">اینباکس صفر! (Inbox Zero)</h4>
            <p className="text-xs text-zinc-500">تمام ورودی‌ها پردازش شده‌اند و هیچ کار معلقی وجود ندارد.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium mb-1 inline-block">
                  ورودی شکارشده
                </span>
                <h4 className="text-xs font-semibold text-zinc-950">{item.title}</h4>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => moveToToday(item)}
                  className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-colors shadow-sm"
                >
                  انتقال به امروز
                </button>
                <button
                  onClick={() => convertToProject(item)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-zinc-300 transition-colors"
                >
                  تبدیل به پروژه
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
