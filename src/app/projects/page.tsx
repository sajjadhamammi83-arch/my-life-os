"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  Kanban,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Edit2,
  Trash2,
  Flag,
  Settings2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Sliders,
  DollarSign,
  Layers,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";
import { formatCurrency, toPersianDigits, formatPersianDate } from "@/lib/utils";

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string | null;
  status: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  areaId: string | null;
  objectiveId: string | null;
  owner: string;
  status: string;
  priority: string;
  startDate: string | null;
  deadline: string | null;
  budget: number;
  actualCost: number;
  progress: number;
  health: string;
  expectedOutput: string | null;
  notes: string | null;
  area?: { id: string; name: string; color: string; icon?: string } | null;
  objective?: { id: string; title: string } | null;
  milestones: Milestone[];
  tasks: any[];
}

interface KanbanCol {
  id: string;
  key: string;
  title: string;
  limit: number | null;
  color?: string | null;
  order: number;
}

const EISENHOWER_QUADRANTS = [
  { id: "Q1", label: "🚨 Q1: سریع و فوری", color: "border-rose-300 bg-rose-50 text-rose-700" },
  { id: "Q2", label: "🎯 Q2: مهم غیرفوری", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { id: "Q3", label: "⚡ Q3: فوری غیرمهم", color: "border-amber-300 bg-amber-50 text-amber-700" },
  { id: "Q4", label: "🌱 Q4: غیرفوری غیرمهم", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
];

const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  on_track: { label: "روی ریل و طبق برنامه", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  at_risk: { label: "در معرض ریسک", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  delayed: { label: "دارای تأخیر زمانی", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  active: { label: "فعال", badge: "bg-black text-white" },
  backlog: { label: "برنامه‌ریزی آتی", badge: "bg-zinc-100 text-zinc-700" },
  paused: { label: "متوقف موقت", badge: "bg-amber-100 text-amber-800" },
  completed: { label: "تکمیل شده", badge: "bg-emerald-100 text-emerald-800" },
  archived: { label: "بایگانی شده", badge: "bg-zinc-200 text-zinc-600" },
};

const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  urgent: { label: "حیاتی و فوری", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  high: { label: "اولویت بالا", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  medium: { label: "اولویت متوسط", badge: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  low: { label: "اولویت پایین", badge: "bg-zinc-50 text-zinc-500 border-zinc-200" },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [columns, setColumns] = useState<KanbanCol[]>([]);

  // Filtering & Search
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>("all");
  const [selectedProjectKanbanFilter, setSelectedProjectKanbanFilter] = useState<string>("all");
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState("");
  const [singleMilestoneTitle, setSingleMilestoneTitle] = useState("");
  const [singleMilestoneDueDate, setSingleMilestoneDueDate] = useState("");

  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [quickTaskTargetColumn, setQuickTaskTargetColumn] = useState("Ready");

  // Project Form States
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAreaId, setFormAreaId] = useState("");
  const [formObjectiveId, setFormObjectiveId] = useState("");
  const [formOwner, setFormOwner] = useState("کاربر");
  const [formStatus, setFormStatus] = useState("active");
  const [formPriority, setFormPriority] = useState("high");
  const [formHealth, setFormHealth] = useState("on_track");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formActualCost, setFormActualCost] = useState("");
  const [formProgress, setFormProgress] = useState(0);
  const [formExpectedOutput, setFormExpectedOutput] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formInitialMilestones, setFormInitialMilestones] = useState<string[]>([]);
  const [newMilestoneInput, setNewMilestoneInput] = useState("");

  // Column Customization States
  const [newColTitle, setNewColTitle] = useState("");
  const [newColLimit, setNewColLimit] = useState("");
  const [newColColor, setNewColColor] = useState("#6366f1");

  // Quick Task Form States
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskProjectId, setQuickTaskProjectId] = useState("");
  const [quickTaskWorkType, setQuickTaskWorkType] = useState("Deep Work");
  const [quickTaskMinutes, setQuickTaskMinutes] = useState("45");
  const [quickTaskQuadrant, setQuickTaskQuadrant] = useState("Q2");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all live data
  const fetchData = async () => {
    try {
      const [resP, resT, resC] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/kanban-columns"),
      ]);

      const dataP = await resP.json();
      if (dataP.success) {
        setProjects(dataP.projects || []);
        if (dataP.areas) setAreas(dataP.areas);
        if (dataP.objectives) setObjectives(dataP.objectives);
      }

      const dataT = await resT.json();
      if (dataT.success) setTasks(dataT.tasks || []);

      const dataC = await resC.json();
      if (dataC.success) setColumns(dataC.columns || []);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Project Modal for Create
  const handleOpenCreateProject = () => {
    setIsEditMode(false);
    setEditingProjectId(null);
    setFormTitle("");
    setFormDescription("");
    setFormAreaId(areas[0]?.id || "");
    setFormObjectiveId("");
    setFormOwner("کاربر");
    setFormStatus("active");
    setFormPriority("high");
    setFormHealth("on_track");
    setFormStartDate("");
    setFormDeadline("");
    setFormBudget("");
    setFormActualCost("");
    setFormProgress(0);
    setFormExpectedOutput("");
    setFormNotes("");
    setFormInitialMilestones([]);
    setNewMilestoneInput("");
    setIsProjectModalOpen(true);
  };

  // Open Project Modal for Edit
  const handleOpenEditProject = (proj: Project) => {
    setIsEditMode(true);
    setEditingProjectId(proj.id);
    setFormTitle(proj.title || "");
    setFormDescription(proj.description || "");
    setFormAreaId(proj.areaId || "");
    setFormObjectiveId(proj.objectiveId || "");
    setFormOwner(proj.owner || "کاربر");
    setFormStatus(proj.status || "active");
    setFormPriority(proj.priority || "high");
    setFormHealth(proj.health || "on_track");
    setFormStartDate(proj.startDate ? proj.startDate.substring(0, 10) : "");
    setFormDeadline(proj.deadline ? proj.deadline.substring(0, 10) : "");
    setFormBudget(proj.budget ? String(proj.budget) : "");
    setFormActualCost(proj.actualCost ? String(proj.actualCost) : "");
    setFormProgress(proj.progress || 0);
    setFormExpectedOutput(proj.expectedOutput || "");
    setFormNotes(proj.notes || "");
    setFormInitialMilestones([]);
    setNewMilestoneInput("");
    setIsProjectModalOpen(true);
  };

  // Save Project (Create or Update)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setIsSubmitting(true);

    try {
      if (isEditMode && editingProjectId) {
        await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProjectId,
            title: formTitle,
            description: formDescription,
            areaId: formAreaId || null,
            objectiveId: formObjectiveId || null,
            owner: formOwner,
            status: formStatus,
            priority: formPriority,
            health: formHealth,
            startDate: formStartDate || null,
            deadline: formDeadline || null,
            budget: Number(formBudget) || 0,
            actualCost: Number(formActualCost) || 0,
            progress: Number(formProgress) || 0,
            expectedOutput: formExpectedOutput,
            notes: formNotes,
          }),
        });
      } else {
        await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            areaId: formAreaId || null,
            objectiveId: formObjectiveId || null,
            owner: formOwner,
            status: formStatus,
            priority: formPriority,
            health: formHealth,
            startDate: formStartDate || null,
            deadline: formDeadline || null,
            budget: Number(formBudget) || 0,
            actualCost: Number(formActualCost) || 0,
            progress: Number(formProgress) || 0,
            expectedOutput: formExpectedOutput,
            notes: formNotes,
            initialMilestones: formInitialMilestones,
          }),
        });
      }

      setIsProjectModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("آیا از حذف کامل این پروژه و رهاسازی تسک‌های آن اطمینان دارید؟")) return;
    try {
      await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Milestone actions
  const handleToggleMilestone = async (milestone: Milestone) => {
    const nextStatus = milestone.status === "completed" ? "pending" : "completed";
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          status: nextStatus,
        }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteMilestoneId: milestoneId }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSingleMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleMilestoneTitle.trim() || !targetProjectId) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "milestone",
          projectId: targetProjectId,
          title: singleMilestoneTitle,
          dueDate: singleMilestoneDueDate || null,
        }),
      });
      setSingleMilestoneTitle("");
      setSingleMilestoneDueDate("");
      setIsMilestoneModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move task across Kanban columns
  const moveTaskColumn = async (task: any, direction: "next" | "prev") => {
    const colKeys = columns.map((c) => c.key);
    const currentIndex = colKeys.indexOf(task.kanbanColumn || "Ready");
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= colKeys.length) return;
    const targetKey = colKeys[nextIndex];
    const targetCol = columns.find((c) => c.key === targetKey);

    // WIP Limit check
    if (targetCol && targetCol.limit) {
      const currentInTarget = tasks.filter(
        (t) => (t.kanbanColumn || "Ready") === targetKey && t.id !== task.id
      ).length;
      if (currentInTarget >= targetCol.limit) {
        alert(
          `⚠️ هشدار محدودیت ظرفیت کار در جریان (WIP Limit):\nستون «${targetCol.title}» حداکثر ظرفیت ${toPersianDigits(
            targetCol.limit
          )} کار دارد. ابتدا کارهای این ستون را تکمیل یا منتقل کنید.`
        );
      }
    }

    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, kanbanColumn: targetKey } : t)));

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, kanbanColumn: targetKey }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete task from Kanban
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("آیا از حذف این تسک اطمینان دارید؟")) return;
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Column management
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    try {
      await fetch("/api/kanban-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newColTitle,
          limit: newColLimit ? Number(newColLimit) : null,
          color: newColColor,
        }),
      });
      setNewColTitle("");
      setNewColLimit("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateColumnLimit = async (colId: string, limit: number | null) => {
    try {
      await fetch("/api/kanban-columns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: colId, limit }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateColumnTitle = async (colId: string, title: string) => {
    if (!title.trim()) return;
    try {
      await fetch("/api/kanban-columns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: colId, title }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    if (!confirm("آیا از حذف این ستون مطمئن هستید؟ تمام تسک‌های آن به ستون بک‌لاگ منتقل می‌شوند.")) return;
    try {
      await fetch(`/api/kanban-columns?id=${colId}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReorderColumns = async (colIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? colIndex - 1 : colIndex + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const newCols = [...columns];
    const temp = newCols[colIndex];
    newCols[colIndex] = newCols[targetIndex];
    newCols[targetIndex] = temp;

    setColumns(newCols);

    try {
      await fetch("/api/kanban-columns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorderList: newCols.map((c) => c.id) }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Task Creation directly in a column
  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickTaskTitle,
          projectId: quickTaskProjectId || undefined,
          kanbanColumn: quickTaskTargetColumn,
          workType: quickTaskWorkType,
          estimatedMinutes: Number(quickTaskMinutes) || 30,
          eisenhowerQuadrant: quickTaskQuadrant,
          status: quickTaskTargetColumn === "Done" ? "completed" : "today",
        }),
      });

      setQuickTaskTitle("");
      setIsQuickTaskModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered lists
  const filteredProjects = projects.filter((p) => {
    if (selectedAreaFilter !== "all" && p.areaId !== selectedAreaFilter) return false;
    return true;
  });

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectKanbanFilter !== "all" && t.projectId !== selectedProjectKanbanFilter) return false;
    if (selectedQuadrantFilter !== "all" && t.eisenhowerQuadrant !== selectedQuadrantFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchProj = t.project?.title?.toLowerCase().includes(q);
      if (!matchTitle && !matchProj) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-black text-white shadow-sm">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-950">مدیریت جامع پروژه‌ها و بورد سفارشی کانبان</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold">
                نسخه پیشرفته ۲.۰
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              تعریف پروژه‌ها با متغیرهای مالی و استراتژیک، کنترل سلامت، مدیریت مایلستون‌ها و تنظیم سفارشی ستون‌ها و WIP Limits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <button
            onClick={() => setIsBoardSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all border border-zinc-200"
          >
            <Settings2 className="w-4 h-4 text-zinc-600" />
            <span>تنظیمات و کاستوم‌سازی بورد</span>
          </button>

          <button
            onClick={handleOpenCreateProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>پروژه جدید</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PROJECTS OVERVIEW & CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-900" />
            <h2 className="font-black text-base text-zinc-950">پروژه‌های فعال و چشم‌اندازها</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">
              {toPersianDigits(filteredProjects.length)} پروژه
            </span>
          </div>

          {/* Area Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedAreaFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedAreaFilter === "all"
                  ? "bg-black text-white font-bold"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              همه حوزه‌ها
            </button>
            {areas.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAreaFilter(a.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedAreaFilter === a.id
                    ? "bg-black text-white font-bold"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const health = HEALTH_CONFIG[proj.health] || HEALTH_CONFIG.on_track;
            const statusBadge = STATUS_CONFIG[proj.status] || STATUS_CONFIG.active;
            const priorityBadge = PRIORITY_CONFIG[proj.priority] || PRIORITY_CONFIG.high;

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
              >
                <div>
                  {/* Top Bar: Area + Health + Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                        {proj.area?.name || "عمومی"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${health.bg} ${health.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                        {health.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditProject(proj)}
                        className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                        title="ویرایش کامل پروژه"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setTargetProjectId(proj.id);
                          setIsMilestoneModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                        title="افزودن مایلستون"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="حذف پروژه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-black text-sm text-zinc-950 mb-1 leading-snug">{proj.title}</h3>
                  {proj.description && (
                    <p className="text-xs text-zinc-600 mb-2 line-clamp-2 leading-relaxed">{proj.description}</p>
                  )}

                  {/* Expected Output Deliverable */}
                  {proj.expectedOutput && (
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 mb-3 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 block">خروجی و دستاورد نهایی:</span>
                      <p className="font-medium text-zinc-900 leading-relaxed">{proj.expectedOutput}</p>
                    </div>
                  )}

                  {/* Milestones Checklist */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
                      <span>مایل‌استون‌ها (نقاط عطف فازبندی):</span>
                      <span className="text-[10px] text-zinc-400">
                        {toPersianDigits(proj.milestones?.filter((m) => m.status === "completed").length || 0)} از{" "}
                        {toPersianDigits(proj.milestones?.length || 0)}
                      </span>
                    </div>

                    {proj.milestones && proj.milestones.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {proj.milestones.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-50 text-xs group"
                          >
                            <button
                              onClick={() => handleToggleMilestone(m)}
                              className="flex items-center gap-2 text-right flex-1"
                            >
                              {m.status === "completed" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              )}
                              <span
                                className={`text-[11px] leading-tight ${
                                  m.status === "completed"
                                    ? "line-through text-zinc-400 font-normal"
                                    : "text-zinc-800 font-medium"
                                }`}
                              >
                                {m.title}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 rounded"
                              title="حذف مایلستون"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic">هنوز مایلستونی ثبت نشده است.</p>
                    )}
                  </div>
                </div>

                {/* Bottom Stats: Progress bar + Financials */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">پیشرفت کلی:</span>
                    <span className="font-mono font-bold text-zinc-950">{toPersianDigits(proj.progress)}٪</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <span>بودجه: {formatCurrency(proj.budget)}</span>
                    {proj.actualCost > 0 && <span>هزینه: {formatCurrency(proj.actualCost)}</span>}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityBadge.badge}`}>
                      {priorityBadge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white border border-dashed border-zinc-300 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-zinc-700">هیچ پروژه‌ای در این حوزه یافت نشد.</p>
              <button
                onClick={handleOpenCreateProject}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800"
              >
                ایجاد اولین پروژه
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: CUSTOMIZABLE KANBAN BOARD */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-zinc-950">بورد گردش کار کانبان (Kanban Board)</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                  {toPersianDigits(columns.length)} ستون فعال
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                انتقال تعاملی کارت‌ها، اعمال دقیق محدودیت کار در جریان (WIP Limits) و کاستوم‌سازی کامل ستون‌ها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Project */}
            <select
              value={selectedProjectKanbanFilter}
              onChange={(e) => setSelectedProjectKanbanFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-medium"
            >
              <option value="all">فیلتر پروژه: همه پروژه‌ها</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Filter by Quadrant */}
            <select
              value={selectedQuadrantFilter}
              onChange={(e) => setSelectedQuadrantFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-medium"
            >
              <option value="all">فیلتر آیزنهاور: همه</option>
              <option value="Q1">🚨 Q1: سریع و فوری</option>
              <option value="Q2">🎯 Q2: مهم غیرفوری</option>
              <option value="Q3">⚡ Q3: فوری غیرمهم</option>
              <option value="Q4">🌱 Q4: غیرفوری غیرمهم</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در تسک‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl pl-3 pr-8 py-1.5 text-xs text-zinc-900 w-44 focus:w-56 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Dynamic Kanban Columns Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => (t.kanbanColumn || "Ready") === col.key);
            const isOverLimit = col.limit !== null && colTasks.length > col.limit;

            return (
              <div
                key={col.id}
                className="bg-white border border-zinc-200 rounded-2xl p-3.5 flex flex-col min-h-[440px] shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color || "#6366f1" }}
                    />
                    <span className="font-bold text-xs text-zinc-950">{col.title}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        isOverLimit
                          ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      {toPersianDigits(colTasks.length)}
                      {col.limit ? ` / ${toPersianDigits(col.limit)}` : ""}
                    </span>

                    <button
                      onClick={() => {
                        setQuickTaskTargetColumn(col.key);
                        setQuickTaskTitle("");
                        setQuickTaskProjectId(projects[0]?.id || "");
                        setIsQuickTaskModalOpen(true);
                      }}
                      className="p-1 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md"
                      title={`افزودن تسک سریع به ${col.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Overlimit Warning Banner */}
                {isOverLimit && (
                  <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>تجاوز از سقف مجاز کار در جریان (WIP)!</span>
                  </div>
                )}

                {/* Cards Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colTasks.map((t) => {
                    const qConfig = EISENHOWER_QUADRANTS.find((q) => q.id === t.eisenhowerQuadrant);

                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all shadow-sm space-y-2 text-xs group"
                      >
                        {/* Title & Delete */}
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="font-bold text-zinc-950 leading-snug flex-1">{t.title}</p>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 rounded transition-all"
                            title="حذف تسک"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Project Badge */}
                        {t.project && (
                          <div className="text-[10px] text-zinc-600 font-medium px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200 inline-block">
                            📁 {t.project.title}
                          </div>
                        )}

                        {/* Badges: Work Type + Quadrant */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
                            {t.workType}
                          </span>
                          {qConfig && (
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${qConfig.color}`}>
                              {qConfig.label.split(":")[0]}
                            </span>
                          )}
                          <span className="font-mono text-zinc-500">{toPersianDigits(t.estimatedMinutes)} دقیقه</span>
                        </div>

                        {/* Move Buttons */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 text-[10px]">
                          <button
                            onClick={() => moveTaskColumn(t, "prev")}
                            disabled={columns.findIndex((c) => c.key === (t.kanbanColumn || "Ready")) === 0}
                            className="px-2 py-1 rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-30 transition-all flex items-center gap-1 font-medium"
                          >
                            <ChevronRight className="w-3 h-3" />
                            <span>قبلی</span>
                          </button>

                          <button
                            onClick={() => moveTaskColumn(t, "next")}
                            disabled={
                              columns.findIndex((c) => c.key === (t.kanbanColumn || "Ready")) === columns.length - 1
                            }
                            className="px-2.5 py-1 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-30 font-bold transition-all flex items-center gap-1"
                          >
                            <span>بعدی</span>
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-[11px] text-zinc-400 border border-dashed border-zinc-200 rounded-xl space-y-1">
                      <span>کار فعالی در این ستون نیست</span>
                      <button
                        onClick={() => {
                          setQuickTaskTargetColumn(col.key);
                          setQuickTaskTitle("");
                          setQuickTaskProjectId(projects[0]?.id || "");
                          setIsQuickTaskModalOpen(true);
                        }}
                        className="text-xs text-black font-bold hover:underline"
                      >
                        + افزودن تسک
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: RICH PROJECT CREATE & EDIT */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-zinc-950" />
                <h3 className="font-black text-base text-zinc-950">
                  {isEditMode ? "ویرایش مشخصات و اطلاعات تفصیلی پروژه" : "ایجاد پروژه استراتژیک جدید"}
                </h3>
              </div>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              {/* Row 1: Title & Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">
                    عنوان پروژه: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثلاً: توسعه فاز پرداخت پلتفرم رایش"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">حوزه کاری / کسب‌وکار:</label>
                  <select
                    value={formAreaId}
                    onChange={(e) => setFormAreaId(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                  >
                    <option value="">-- بدون حوزه خاص --</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Objective & Owner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">همسویی با هدف کلان ۹۰ روزه:</label>
                  <select
                    value={formObjectiveId}
                    onChange={(e) => setFormObjectiveId(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                  >
                    <option value="">-- بدون اتصال مستقیم به هدف کلان --</option>
                    {objectives.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">مالک / مسئول پروژه:</label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    placeholder="کاربر"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
              </div>

              {/* Row 3: Priority, Status, Health */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">اولویت پروژه:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="urgent">🚨 حیاتی و فوری (Urgent)</option>
                    <option value="high">🎯 بالا (High)</option>
                    <option value="medium">⚡ متوسط (Medium)</option>
                    <option value="low">🌱 پایین (Low)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">وضعیت چرخه عمر:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="active">فعال (Active)</option>
                    <option value="backlog">برنامه‌ریزی آتی (Backlog)</option>
                    <option value="paused">متوقف موقت (Paused)</option>
                    <option value="completed">تکمیل شده (Completed)</option>
                    <option value="archived">بایگانی (Archived)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">وضعیت سلامت زمانی:</label>
                  <select
                    value={formHealth}
                    onChange={(e) => setFormHealth(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="on_track">🟢 روی ریل (On Track)</option>
                    <option value="at_risk">🟡 در معرض ریسک (At Risk)</option>
                    <option value="delayed">🔴 دارای تأخیر (Delayed)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Dates & Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">تاریخ شروع:</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ضرب‌الاجل (Deadline):</label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">
                    درصد پیشرفت فعلی: ({toPersianDigits(formProgress)}٪)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-black mt-2"
                  />
                </div>
              </div>

              {/* Row 5: Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">بودجه برآوردی / مصوب (تومان):</label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="۱۵۰۰۰۰۰۰"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">هزینه واقعی صرف‌شده تا الان (تومان):</label>
                  <input
                    type="number"
                    value={formActualCost}
                    onChange={(e) => setFormActualCost(e.target.value)}
                    placeholder="۵۰۰۰۰۰۰"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Expected Output */}
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">خروجی ملموس و قابل سنجش (Expected Output):</label>
                <input
                  type="text"
                  value={formExpectedOutput}
                  onChange={(e) => setFormExpectedOutput(e.target.value)}
                  placeholder="مثلاً: تسویه فاکتور ۲۸ میلیون تومانی پس از تحویل درگاه به مشتری"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              {/* Row 7: Description & Scope */}
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">توضیحات و دامنه تفصیلی پروژه:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="شرح اهداف، ذینفعان و فازبندی‌های پروژه..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 resize-none"
                />
              </div>

              {/* Initial Milestones creation (on new project) */}
              {!isEditMode && (
                <div className="space-y-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <label className="block text-zinc-800 font-bold">
                    مایل‌استون‌های اولیه (نقاط عطف فازبندی پروژه):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMilestoneInput}
                      onChange={(e) => setNewMilestoneInput(e.target.value)}
                      placeholder="عنوان فاز یا مایلستون (مثلاً: تست کامل وب‌سرویس بانک)"
                      className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-zinc-950"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newMilestoneInput.trim()) {
                            setFormInitialMilestones([...formInitialMilestones, newMilestoneInput.trim()]);
                            setNewMilestoneInput("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newMilestoneInput.trim()) {
                          setFormInitialMilestones([...formInitialMilestones, newMilestoneInput.trim()]);
                          setNewMilestoneInput("");
                        }
                      }}
                      className="px-3 py-1.5 bg-black text-white rounded-xl font-bold hover:bg-zinc-800"
                    >
                      افزودن
                    </button>
                  </div>

                  {formInitialMilestones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formInitialMilestones.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 flex items-center gap-1.5 text-[11px]"
                        >
                          <span>🚩 {m}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormInitialMilestones(formInitialMilestones.filter((_, i) => i !== idx))
                            }
                            className="text-zinc-400 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : isEditMode ? "ذخیره تغییرات پروژه" : "ایجاد رسمی پروژه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BOARD CUSTOMIZATION (COLUMNS & WIP LIMITS) */}
      {isBoardSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-zinc-950" />
                <h3 className="font-black text-base text-zinc-950">تنظیمات و کاستوم‌سازی بورد کانبان</h3>
              </div>
              <button
                onClick={() => setIsBoardSettingsOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Columns Management */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-zinc-800">ستون‌های فعال بورد و محدودیت‌های ظرفیت (WIP Limits):</h4>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {columns.map((col, idx) => (
                  <div
                    key={col.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: col.color || "#6366f1" }}
                      />
                      <input
                        type="text"
                        defaultValue={col.title}
                        onBlur={(e) => handleUpdateColumnTitle(col.id, e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-900 font-bold flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500">WIP:</span>
                        <input
                          type="number"
                          placeholder="نامحدود"
                          defaultValue={col.limit !== null ? col.limit : ""}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            handleUpdateColumnLimit(col.id, val ? Number(val) : null);
                          }}
                          className="w-16 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-center font-mono text-zinc-900"
                          title="سقف مجاز کار همزمان (WIP Limit)"
                        />
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center">
                        <button
                          onClick={() => handleReorderColumns(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-zinc-400 hover:text-black disabled:opacity-20"
                          title="انتقال به بالا"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorderColumns(idx, "down")}
                          disabled={idx === columns.length - 1}
                          className="p-1 text-zinc-400 hover:text-black disabled:opacity-20"
                          title="انتقال به پایین"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Delete Custom Column */}
                      <button
                        onClick={() => handleDeleteColumn(col.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                        title="حذف ستون"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Custom Column Form */}
            <form onSubmit={handleAddColumn} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                افزودن ستون جدید به بورد کانبان
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="عنوان ستون (مثلاً: در انتظار تست مشتری)"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-950"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="سقف WIP (اختیاری)"
                    value={newColLimit}
                    onChange={(e) => setNewColLimit(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-600 font-medium">رنگ شاخص:</span>
                  <input
                    type="color"
                    value={newColColor}
                    onChange={(e) => setNewColColor(e.target.value)}
                    className="w-7 h-7 rounded border border-zinc-200 cursor-pointer bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all"
                >
                  + ایجاد ستون
                </button>
              </div>
            </form>

            <div className="pt-2 flex justify-end border-t border-zinc-200">
              <button
                onClick={() => setIsBoardSettingsOpen(false)}
                className="px-5 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800"
              >
                بستن و اعمال تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK TASK CREATE IN SPECIFIC COLUMN */}
      {isQuickTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                افزودن سریع کار به ستون «{columns.find((c) => c.key === quickTaskTargetColumn)?.title || quickTaskTargetColumn}»
              </h3>
              <button onClick={() => setIsQuickTaskModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickTask} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان کار:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="مثلاً: تست نهایی درگاه سپهر در رایش"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">انتساب به پروژه:</label>
                <select
                  value={quickTaskProjectId}
                  onChange={(e) => setQuickTaskProjectId(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                >
                  <option value="">-- تسک مستقل (بدون پروژه) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نوع کار:</label>
                  <select
                    value={quickTaskWorkType}
                    onChange={(e) => setQuickTaskWorkType(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="Deep Work">کار عمیق (Deep Work)</option>
                    <option value="Shallow Work">کار سطحی (Shallow Work)</option>
                    <option value="Admin">مدیریتی / مالی (Admin)</option>
                    <option value="Learning">یادگیری و دانشگاه</option>
                    <option value="Health">سلامت و ورزش</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">زمان تخمینی (دقیقه):</label>
                  <input
                    type="number"
                    value={quickTaskMinutes}
                    onChange={(e) => setQuickTaskMinutes(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">ماتریس آیزنهاور:</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {EISENHOWER_QUADRANTS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuickTaskQuadrant(q.id)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                        quickTaskQuadrant === q.id
                          ? "bg-black text-white border-black"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsQuickTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "افزودن تسک"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SINGLE MILESTONE ADD */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">افزودن مایل‌استون به پروژه</h3>
              <button onClick={() => setIsMilestoneModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleMilestone} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان نقطه عطف / فاز:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={singleMilestoneTitle}
                  onChange={(e) => setSingleMilestoneTitle(e.target.value)}
                  placeholder="مثلاً: تست نهایی درگاه پرداخت با کارفرما"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">تاریخ هدف (اختیاری):</label>
                <input
                  type="date"
                  value={singleMilestoneDueDate}
                  onChange={(e) => setSingleMilestoneDueDate(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت مایلستون"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
