"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  Store,
  Sparkles,
  Laptop,
  GraduationCap,
  HeartPulse,
  Compass,
  DollarSign,
  Users,
  CheckSquare,
  Activity,
  Plus,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

export default function AreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [standard, setStandard] = useState("");
  const [reviewFrequency, setReviewFrequency] = useState("هفتگی");
  const [color, setColor] = useState("#ffffff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAreas = async () => {
    try {
      const res = await fetch("/api/areas");
      const data = await res.json();
      if (data.success) setAreas(data.areas);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      if (editingArea) {
        await fetch("/api/areas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingArea.id,
            name,
            purpose,
            standard,
            reviewFrequency,
            color,
          }),
        });
      } else {
        await fetch("/api/areas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            purpose,
            standard,
            reviewFrequency,
            color,
          }),
        });
      }

      setIsModalOpen(false);
      setEditingArea(null);
      setName("");
      setPurpose("");
      setStandard("");
      fetchAreas();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (area: any) => {
    setEditingArea(area);
    setName(area.name);
    setPurpose(area.purpose || "");
    setStandard(area.standard || "");
    setReviewFrequency(area.reviewFrequency || "هفتگی");
    setColor(area.color || "#ffffff");
    setIsModalOpen(true);
  };

  const handleDeleteArea = async (id: string) => {
    if (!confirm("آیا از حذف این حوزه مطمئن هستید؟")) return;
    try {
      await fetch(`/api/areas?id=${id}`, { method: "DELETE" });
      fetchAreas();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 border border-zinc-300">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-950">حوزه‌های زندگی (Life Domains & Areas)</h2>
            <p className="text-xs text-zinc-500">
              تفکیک قلمروهای کلیدی زندگی شخصی و بیزینس، استانداردهای تعالی و پروژه‌های مربوطه
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingArea(null);
            setName("");
            setPurpose("");
            setStandard("");
            setColor("#ffffff");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>تعریف حوزه جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((a) => (
          <div
            key={a.id}
            className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center">
                  {a.name.includes("بوفه") && <Store className="w-4 h-4" />}
                  {a.name.includes("آرایشی") && <Sparkles className="w-4 h-4" />}
                  {a.name.includes("رایش") && <Laptop className="w-4 h-4" />}
                  {a.name.includes("دانشگاه") && <GraduationCap className="w-4 h-4" />}
                  {a.name.includes("سلامت") && <HeartPulse className="w-4 h-4" />}
                  {a.name.includes("توسعه") && <Compass className="w-4 h-4" />}
                  {a.name.includes("مالی") && <DollarSign className="w-4 h-4" />}
                  {a.name.includes("روابط") && <Users className="w-4 h-4" />}
                  {a.name.includes("عملیات") && <CheckSquare className="w-4 h-4" />}
                  {!["بوفه", "آرایشی", "رایش", "دانشگاه", "سلامت", "توسعه", "مالی", "روابط", "عملیات"].some((k) =>
                    a.name.includes(k)
                  ) && <Activity className="w-4 h-4" />}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                    بازبینی {a.reviewFrequency}
                  </span>
                  <button
                    onClick={() => openEditModal(a)}
                    className="p-1 text-zinc-500 hover:text-black rounded hover:bg-zinc-100"
                    title="ویرایش حوزه"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteArea(a.id)}
                    className="p-1 text-zinc-500 hover:text-black rounded hover:bg-zinc-100"
                    title="حذف حوزه"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-sm text-zinc-950 mb-1">{a.name}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">{a.purpose}</p>

              {a.standard && (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-950 block mb-0.5">استاندارد عملکردی:</span>
                  <p className="text-[11px] text-zinc-500">{a.standard}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-200">
              <span>{toPersianDigits(a.projects?.length || 0)} پروژه فعال</span>
              <span>{toPersianDigits(a.tasks?.length || 0)} تسک ثبت‌شده</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Area Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                {editingArea ? "ویرایش حوزه زندگی" : "تعریف حوزه جدید"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-medium">نام حوزه:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: برندینگ شخصی یا سرمایه‌گذاری"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">هدف متعالی (Purpose):</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="چرایی وجود این حوزه در زندگی شما..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 h-16"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">استاندارد عملکردی:</label>
                <textarea
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  placeholder="معیار حداقلی قابل قبول برای موفقیت در این حوزه..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 h-16"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-medium">تکرار بازبینی:</label>
                <select
                  value={reviewFrequency}
                  onChange={(e) => setReviewFrequency(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-800"
                >
                  <option value="روزانه">روزانه</option>
                  <option value="هفتگی">هفتگی</option>
                  <option value="ماهانه">ماهانه</option>
                </select>
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
                  {isSubmitting ? "در حال ثبت..." : "ذخیره حوزه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
