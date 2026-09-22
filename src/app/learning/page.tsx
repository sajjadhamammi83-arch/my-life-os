"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  X,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  FileText,
  Presentation,
  Award,
  AlertCircle,
  BellRing,
  BookCheck,
  ChevronDown,
  Filter,
  Layers,
  Search,
  Edit2,
  TrendingUp,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  FolderOpen,
} from "lucide-react";
import { toPersianDigits, formatPersianDate } from "@/lib/utils";

interface UniversityEventItem {
  id: string;
  courseId: string;
  course?: {
    id: string;
    title: string;
    code: string;
    instructor?: string;
    location?: string;
  };
  courseTitle?: string;
  courseCode?: string;
  courseInstructor?: string;
  courseLocation?: string;
  title: string;
  type: string;
  dueDate: string | null;
  time?: string | null;
  location?: string | null;
  weight: number;
  priority: string;
  status: string;
  notes?: string | null;
  createdAt: string;
}

interface UniversityCourseItem {
  id: string;
  code: string;
  title: string;
  instructor?: string;
  credits: number;
  semester: string;
  targetGrade: number;
  actualGrade?: number | null;
  deepWorkHours: number;
  daysOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  notes?: string | null;
  assignments: any[];
  exams: any[];
  events: UniversityEventItem[];
}

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  pages: number;
  currentPage: number;
  status: string;
  rating: number;
  notes?: string | null;
}

interface SkillItem {
  id: string;
  title: string;
  area: string;
  currentLevel: string;
  targetLevel: string;
  curriculum?: string | null;
  practiceProject?: string | null;
  hoursInvested: number;
  targetHours: number;
}

const EVENT_TYPES = [
  { label: "تکلیف (تمرین تحویلی)", val: "تکلیف", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "امتحان (میان‌ترم / پایان‌ترم)", val: "امتحان", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  { label: "ارائه کلاسی (سمینار)", val: "ارائه", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { label: "پروژه درسی", val: "پروژه", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "کوئیز کلاسی", val: "کوئیز", badge: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  { label: "کلاس جبرانی", val: "کلاس جبرانی", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  { label: "آزمایشگاه", val: "آزمایشگاه", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { label: "سایر رویدادها", val: "سایر", badge: "bg-zinc-100 text-zinc-600 border-zinc-200" },
];

const DAYS_LIST = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه"];

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "events" | "books" | "skills">("schedule");
  const [courses, setCourses] = useState<UniversityCourseItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [allEvents, setAllEvents] = useState<UniversityEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Events Tab
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [eventCourseFilter, setEventCourseFilter] = useState<string>("all");
  const [eventStatusFilter, setEventStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Edit Modes
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [isEditingBook, setIsEditingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  // Course Form States
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseInstructor, setCourseInstructor] = useState("");
  const [courseCredits, setCourseCredits] = useState("3");
  const [courseSemester, setCourseSemester] = useState("نیم‌سال جاری");
  const [courseTargetGrade, setCourseTargetGrade] = useState("19");
  const [courseActualGrade, setCourseActualGrade] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [courseStartTime, setCourseStartTime] = useState("08:00");
  const [courseEndTime, setCourseEndTime] = useState("10:00");
  const [courseLocation, setCourseLocation] = useState("");
  const [courseNotes, setCourseNotes] = useState("");

  // Event Form States
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("تکلیف");
  const [eventDueDate, setEventDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [eventTime, setEventTime] = useState("10:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventWeight, setEventWeight] = useState("15");
  const [eventPriority, setEventPriority] = useState("medium");
  const [eventNotes, setEventNotes] = useState("");

  // Book Form States
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookCategory, setBookCategory] = useState("توسعه فردی");
  const [bookPages, setBookPages] = useState("250");
  const [bookCurrentPage, setBookCurrentPage] = useState("0");
  const [bookStatus, setBookStatus] = useState("Learning");
  const [bookRating, setBookRating] = useState(5);
  const [bookNotes, setBookNotes] = useState("");

  // Skill Form States
  const [skillTitle, setSkillTitle] = useState("");
  const [skillArea, setSkillArea] = useState("مهندسی نرم‌افزار");
  const [skillCurrentLevel, setSkillCurrentLevel] = useState("مقدماتی");
  const [skillTargetLevel, setSkillTargetLevel] = useState("پیشرفته");
  const [skillCurriculum, setSkillCurriculum] = useState("");
  const [skillPracticeProject, setSkillPracticeProject] = useState("");
  const [skillHoursInvested, setSkillHoursInvested] = useState("0");
  const [skillTargetHours, setSkillTargetHours] = useState("50");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Fetch all learning data
  const fetchLearning = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/learning");
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
        setBooks(data.books || []);
        setSkills(data.skills || []);
        setAllEvents(data.allEvents || []);
        if (data.courses?.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch learning data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearning();
  }, []);

  const toggleDaySelection = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Open Course Modal (Create or Edit)
  const handleOpenCourseModal = (course?: UniversityCourseItem) => {
    if (course) {
      setIsEditingCourse(true);
      setEditingCourseId(course.id);
      setCourseTitle(course.title);
      setCourseCode(course.code);
      setCourseInstructor(course.instructor || "");
      setCourseCredits(String(course.credits));
      setCourseSemester(course.semester || "نیم‌سال جاری");
      setCourseTargetGrade(String(course.targetGrade));
      setCourseActualGrade(course.actualGrade ? String(course.actualGrade) : "");
      setSelectedDays(course.daysOfWeek ? course.daysOfWeek.split("، ") : []);
      setCourseStartTime(course.startTime || "08:00");
      setCourseEndTime(course.endTime || "10:00");
      setCourseLocation(course.location || "");
      setCourseNotes(course.notes || "");
    } else {
      setIsEditingCourse(false);
      setEditingCourseId(null);
      setCourseTitle("");
      setCourseCode(`CS-${Math.floor(100 + Math.random() * 900)}`);
      setCourseInstructor("");
      setCourseCredits("3");
      setCourseSemester("نیم‌سال جاری");
      setCourseTargetGrade("19");
      setCourseActualGrade("");
      setSelectedDays(["شنبه", "دوشنبه"]);
      setCourseStartTime("08:00");
      setCourseEndTime("10:00");
      setCourseLocation("");
      setCourseNotes("");
    }
    setIsCourseModalOpen(true);
  };

  // Save Course
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    setIsSubmitting(true);

    try {
      if (isEditingCourse && editingCourseId) {
        await fetch("/api/learning", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: editingCourseId,
            updates: {
              title: courseTitle.trim(),
              code: courseCode.trim(),
              instructor: courseInstructor.trim() || "نامشخص",
              credits: Number(courseCredits) || 3,
              semester: courseSemester,
              targetGrade: Number(courseTargetGrade) || 18,
              actualGrade: courseActualGrade ? Number(courseActualGrade) : null,
              daysOfWeek: selectedDays.length > 0 ? selectedDays.join("، ") : null,
              startTime: courseStartTime,
              endTime: courseEndTime,
              location: courseLocation.trim() || null,
              notes: courseNotes.trim() || null,
            },
          }),
        });
      } else {
        await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "course",
            title: courseTitle.trim(),
            code: courseCode.trim() || `CS-${Math.floor(100 + Math.random() * 900)}`,
            instructor: courseInstructor.trim() || "نامشخص",
            credits: Number(courseCredits) || 3,
            semester: courseSemester,
            targetGrade: Number(courseTargetGrade) || 18,
            actualGrade: courseActualGrade ? Number(courseActualGrade) : null,
            daysOfWeek: selectedDays.length > 0 ? selectedDays.join("، ") : null,
            startTime: courseStartTime,
            endTime: courseEndTime,
            location: courseLocation.trim() || null,
            notes: courseNotes.trim() || null,
          }),
        });
      }

      setIsCourseModalOpen(false);
      fetchLearning();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id: string) => {
    if (!confirm("آیا از حذف این درس و تمام رویدادها، تکالیف و امتحانات مرتبط با آن اطمینان دارید؟")) return;
    try {
      await fetch(`/api/learning?type=course&id=${id}`, { method: "DELETE" });
      fetchLearning();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Event Modal (Create or Edit)
  const handleOpenEventModal = (event?: UniversityEventItem) => {
    if (event) {
      setIsEditingEvent(true);
      setEditingEventId(event.id);
      setSelectedCourseId(event.courseId);
      setEventTitle(event.title);
      setEventType(event.type);
      setEventDueDate(event.dueDate ? event.dueDate.substring(0, 10) : "");
      setEventTime(event.time || "10:00");
      setEventLocation(event.location || "");
      setEventWeight(String(event.weight || "0"));
      setEventPriority(event.priority || "medium");
      setEventNotes(event.notes || "");
    } else {
      setIsEditingEvent(false);
      setEditingEventId(null);
      setSelectedCourseId(courses[0]?.id || "");
      setEventTitle("");
      setEventType("تکلیف");
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setEventDueDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      setEventTime("10:00");
      setEventLocation("");
      setEventWeight("15");
      setEventPriority("medium");
      setEventNotes("");
    }
    setIsEventModalOpen(true);
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setIsSubmitting(true);

    try {
      if (isEditingEvent && editingEventId) {
        await fetch("/api/learning", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: editingEventId,
            updates: {
              courseId: selectedCourseId,
              title: eventTitle.trim(),
              type: eventType,
              dueDate: eventDueDate,
              time: eventTime,
              location: eventLocation.trim() || null,
              weight: Number(eventWeight) || 0,
              priority: eventPriority,
              notes: eventNotes.trim() || null,
            },
          }),
        });
      } else {
        await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "event",
            courseId: selectedCourseId || courses[0]?.id,
            title: eventTitle.trim(),
            eventType,
            dueDate: eventDueDate,
            time: eventTime,
            location: eventLocation.trim() || null,
            weight: Number(eventWeight) || 0,
            priority: eventPriority,
            notes: eventNotes.trim() || null,
            status: "pending",
          }),
        });
      }

      setIsEventModalOpen(false);
      fetchLearning();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Event Status
  const handleToggleEventStatus = async (event: UniversityEventItem) => {
    const nextStatus = event.status === "completed" ? "pending" : "completed";
    try {
      await fetch("/api/learning", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          status: nextStatus,
        }),
      });
      fetchLearning();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm("آیا از حذف این رویداد دانشگاهی اطمینان دارید؟")) return;
    try {
      await fetch(`/api/learning?type=event&id=${id}`, { method: "DELETE" });
      fetchLearning();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Book Modal (Create or Edit)
  const handleOpenBookModal = (book?: BookItem) => {
    if (book) {
      setIsEditingBook(true);
      setEditingBookId(book.id);
      setBookTitle(book.title);
      setBookAuthor(book.author);
      setBookCategory(book.category || "توسعه فردی");
      setBookPages(String(book.pages));
      setBookCurrentPage(String(book.currentPage));
      setBookStatus(book.status);
      setBookRating(book.rating || 5);
      setBookNotes(book.notes || "");
    } else {
      setIsEditingBook(false);
      setEditingBookId(null);
      setBookTitle("");
      setBookAuthor("");
      setBookCategory("توسعه فردی");
      setBookPages("250");
      setBookCurrentPage("0");
      setBookStatus("Learning");
      setBookRating(5);
      setBookNotes("");
    }
    setIsBookModalOpen(true);
  };

  // Save Book
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;
    setIsSubmitting(true);

    try {
      if (isEditingBook && editingBookId) {
        await fetch("/api/learning", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: editingBookId,
            updates: {
              title: bookTitle.trim(),
              author: bookAuthor.trim(),
              category: bookCategory,
              pages: Number(bookPages) || 200,
              currentPage: Number(bookCurrentPage) || 0,
              status: bookStatus,
              rating: Number(bookRating) || 5,
              notes: bookNotes.trim() || null,
            },
          }),
        });
      } else {
        await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "book",
            title: bookTitle.trim(),
            author: bookAuthor.trim() || "نامشخص",
            category: bookCategory,
            pages: Number(bookPages) || 200,
            currentPage: Number(bookCurrentPage) || 0,
            status: bookStatus,
            rating: Number(bookRating) || 5,
            notes: bookNotes.trim() || null,
          }),
        });
      }

      setIsBookModalOpen(false);
      fetchLearning();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Book Reading Page Quick
  const handleQuickPageProgress = async (book: BookItem, delta: number) => {
    const nextPage = Math.min(book.pages, Math.max(0, book.currentPage + delta));
    try {
      await fetch("/api/learning", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          currentPage: nextPage,
        }),
      });
      fetchLearning();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Book
  const handleDeleteBook = async (id: string) => {
    if (!confirm("آیا از حذف این کتاب اطمینان دارید؟")) return;
    try {
      await fetch(`/api/learning?type=book&id=${id}`, { method: "DELETE" });
      fetchLearning();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Skill Modal (Create or Edit)
  const handleOpenSkillModal = (skill?: SkillItem) => {
    if (skill) {
      setIsEditingSkill(true);
      setEditingSkillId(skill.id);
      setSkillTitle(skill.title);
      setSkillArea(skill.area);
      setSkillCurrentLevel(skill.currentLevel);
      setSkillTargetLevel(skill.targetLevel);
      setSkillCurriculum(skill.curriculum || "");
      setSkillPracticeProject(skill.practiceProject || "");
      setSkillHoursInvested(String(skill.hoursInvested));
      setSkillTargetHours(String(skill.targetHours));
    } else {
      setIsEditingSkill(false);
      setEditingSkillId(null);
      setSkillTitle("");
      setSkillArea("مهندسی نرم‌افزار");
      setSkillCurrentLevel("مقدماتی");
      setSkillTargetLevel("پیشرفته");
      setSkillCurriculum("");
      setSkillPracticeProject("");
      setSkillHoursInvested("0");
      setSkillTargetHours("50");
    }
    setIsSkillModalOpen(true);
  };

  // Save Skill
  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillTitle.trim()) return;
    setIsSubmitting(true);

    try {
      if (isEditingSkill && editingSkillId) {
        await fetch("/api/learning", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillId: editingSkillId,
            updates: {
              title: skillTitle.trim(),
              area: skillArea,
              currentLevel: skillCurrentLevel,
              targetLevel: skillTargetLevel,
              curriculum: skillCurriculum.trim() || null,
              practiceProject: skillPracticeProject.trim() || null,
              hoursInvested: Number(skillHoursInvested) || 0,
              targetHours: Number(skillTargetHours) || 50,
            },
          }),
        });
      } else {
        await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "skill",
            title: skillTitle.trim(),
            category: skillArea,
            currentLevel: skillCurrentLevel,
            targetLevel: skillTargetLevel,
            curriculum: skillCurriculum.trim() || null,
            practiceProject: skillPracticeProject.trim() || null,
            hoursInvested: Number(skillHoursInvested) || 0,
            targetHours: Number(skillTargetHours) || 50,
          }),
        });
      }

      setIsSkillModalOpen(false);
      fetchLearning();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Skill
  const handleDeleteSkill = async (id: string) => {
    if (!confirm("آیا از حذف این مهارت اطمینان دارید؟")) return;
    try {
      await fetch(`/api/learning?type=skill&id=${id}`, { method: "DELETE" });
      fetchLearning();
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const totalCredits = courses.reduce((s, c) => s + (c.credits || 0), 0);
  const pendingEventsCount = allEvents.filter((e) => e.status !== "completed").length;
  const totalBookPagesRead = books.reduce((s, b) => s + (b.currentPage || 0), 0);
  const totalSkillHours = skills.reduce((s, sk) => s + (sk.hoursInvested || 0), 0);

  // Filtered Events
  const filteredEvents = allEvents.filter((ev) => {
    if (eventTypeFilter !== "all" && ev.type !== eventTypeFilter) return false;
    if (eventCourseFilter !== "all" && ev.courseId !== eventCourseFilter) return false;
    if (eventStatusFilter !== "all" && ev.status !== eventStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchCourse = ev.courseTitle?.toLowerCase().includes(q);
      const matchLoc = ev.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchCourse && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-black text-white shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-950">سامانه جامع یادگیری، دانشگاه و کتاب‌خوانی</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold">
                نسخه ۲.۰
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              برنامه هفتگی دانشگاه، پایش تکالیف و امتحانات، پیشرفت صفحات کتاب‌ها و یادگیری مهارت‌های تخصصی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <button
            onClick={() => handleOpenCourseModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold border border-zinc-200 transition-all"
          >
            <Plus className="w-4 h-4 text-zinc-700" />
            <span>درس دانشگاهی جدید</span>
          </button>

          <button
            onClick={() => handleOpenEventModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold border border-zinc-200 transition-all"
          >
            <BellRing className="w-4 h-4 text-zinc-700" />
            <span>رویداد درسی (تکلیف/امتحان)</span>
          </button>

          <button
            onClick={() => handleOpenBookModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all"
          >
            <BookOpen className="w-4 h-4 text-white" />
            <span>ثبت کتاب جدید</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>واحدهای ترم جاری دانشگاه</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-zinc-950 font-mono">
            {toPersianDigits(totalCredits)} واحد درسی
          </p>
          <span className="text-[10px] text-zinc-400 block">در {toPersianDigits(courses.length)} عنوان درس تخصصی</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>تکالیف و امتحانات در نوبت</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-black text-amber-700 font-mono">
            {toPersianDigits(pendingEventsCount)} رویداد معوق
          </p>
          <span className="text-[10px] text-amber-600 block">تکالیف، ارائه و پروژه‌های آتی</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>مطالعه کتاب‌های جاری</span>
            <BookCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-black text-emerald-600 font-mono">
            {toPersianDigits(totalBookPagesRead)} صفحه خوانده‌شده
          </p>
          <span className="text-[10px] text-emerald-600 block">در {toPersianDigits(books.length)} عنوان کتاب فعال</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>ساعات سرمایه‌گذاری مهارت‌ها</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-base font-black text-zinc-950 font-mono">
            {toPersianDigits(totalSkillHours)} ساعت تمرین
          </p>
          <span className="text-[10px] text-purple-600 block">در {toPersianDigits(skills.length)} شایستگی شغلی</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "schedule", label: `📅 برنامه هفتگی کلاس‌های دانشگاه (${toPersianDigits(courses.length)})` },
          { id: "events", label: `📝 تکالیف، امتحانات و ارائه‌ها (${toPersianDigits(allEvents.length)})` },
          { id: "books", label: `📚 کتابخانه و پایش مطالعه (${toPersianDigits(books.length)})` },
          { id: "skills", label: `💡 توسعه مهارت‌ها و پروژه‌ها (${toPersianDigits(skills.length)})` },
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

      {/* TAB 1: UNIVERSITY SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-700" />
                برنامه هفتگی کلاس‌های دانشگاه و مشخصات دروس
              </h3>
              <p className="text-[11px] text-zinc-500">
                روزهای تشکیل، ساعت برگزاری، اساتید، آدرس و شماره کلاس‌ها با امکان ویرایش کامل
              </p>
            </div>
            <button
              onClick={() => handleOpenCourseModal()}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start sm:self-center"
            >
              + درس جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-mono font-bold">
                      {c.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-zinc-600">
                        {toPersianDigits(c.credits)} واحد
                      </span>
                      <button
                        onClick={() => handleOpenCourseModal(c)}
                        className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded"
                        title="ویرایش درس"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="حذف درس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-black text-xs text-zinc-950 mb-1 leading-snug">{c.title}</h4>
                  <p className="text-xs text-zinc-600 mb-2.5">استاد: {c.instructor || "نامشخص"}</p>

                  <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{c.daysOfWeek || "روزهای تشکیل مشخص نشده"}</span>
                    </div>

                    {(c.startTime || c.endTime) && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>ساعت {c.startTime || "—"} الی {c.endTime || "—"}</span>
                      </div>
                    )}

                    {c.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-zinc-500 italic mt-2.5 leading-relaxed">{c.notes}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>هدف نمره: {toPersianDigits(c.targetGrade)}</span>
                  <button
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      handleOpenEventModal();
                    }}
                    className="text-xs text-black font-bold hover:underline"
                  >
                    + تکلیف یا رویداد
                  </button>
                </div>
              </div>
            ))}

            {courses.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white border border-dashed border-zinc-300 rounded-2xl space-y-3">
                <p className="text-sm font-bold text-zinc-700">هنوز درسی برای این ترم دانشگاه ثبت نشده است.</p>
                <button
                  onClick={() => handleOpenCourseModal()}
                  className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800"
                >
                  تعریف اولین درس دانشگاه
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UNIVERSITY EVENTS (Assignments, Exams, Presentations) */}
      {activeTab === "events" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-700" />
                تکالیف تحویلی، امتحانات، ارائه‌های کلاسی و پروژه‌ها
              </h3>
              <p className="text-[11px] text-zinc-500">
                پایش سررسیدها با همگام‌سازی خودکار در تقویم و بورد کانبان
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs text-zinc-800 font-medium"
              >
                <option value="all">همه انواع رویدادها</option>
                {EVENT_TYPES.map((et) => (
                  <option key={et.val} value={et.val}>
                    {et.label}
                  </option>
                ))}
              </select>

              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value as any)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs text-zinc-800 font-medium"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار انجام</option>
                <option value="completed">تکمیل‌شده</option>
              </select>

              <button
                onClick={() => handleOpenEventModal()}
                className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800"
              >
                + رویداد جدید
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">عنوان رویداد</th>
                  <th className="p-3">درس مرتبط</th>
                  <th className="p-3">نوع</th>
                  <th className="p-3">موعد / تاریخ</th>
                  <th className="p-3">ساعت و مکان</th>
                  <th className="p-3">وزن نمره</th>
                  <th className="p-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredEvents.map((ev) => {
                  const typeObj = EVENT_TYPES.find((t) => t.val === ev.type);

                  return (
                    <tr key={ev.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleEventStatus(ev)}
                          className="flex items-center gap-1.5"
                          title="تغییر وضعیت انجام"
                        >
                          {ev.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-300 hover:text-black" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            ev.status === "completed" ? "line-through text-zinc-400" : "text-zinc-950"
                          }`}
                        >
                          {ev.title}
                        </span>
                        {ev.notes && <p className="text-[10px] text-zinc-400 mt-0.5">{ev.notes}</p>}
                      </td>
                      <td className="p-3 font-medium text-zinc-800">{ev.courseTitle || "—"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeObj?.badge || "bg-zinc-100"}`}>
                          {ev.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-600">
                        {ev.dueDate ? formatPersianDate(ev.dueDate) : "نامشخص"}
                      </td>
                      <td className="p-3 text-zinc-600">
                        {ev.time ? `ساعت ${ev.time}` : ""}
                        {ev.location ? ` - ${ev.location}` : ""}
                      </td>
                      <td className="p-3 font-mono font-bold text-zinc-900">
                        {ev.weight > 0 ? `${toPersianDigits(ev.weight)}٪` : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEventModal(ev)}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded"
                            title="ویرایش رویداد"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="حذف رویداد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400">
                      هیچ رویدادی مطابق با فیلترهای انتخابی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKS & READING TRACKER */}
      {activeTab === "books" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-700" />
                کتابخانه، ردیابی صفحات خوانده‌شده و پیشرفت کتاب‌ها
              </h3>
              <p className="text-[11px] text-zinc-500">
                پایش درصد مطالعه کتاب‌ها با قابلیت افزایش سریع صفحات خوانده‌شده و امتیازدهی
              </p>
            </div>
            <button
              onClick={() => handleOpenBookModal()}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start sm:self-center"
            >
              + کتاب جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((b) => {
              const progressPct = Math.min(100, Math.round(((b.currentPage || 0) / (b.pages || 1)) * 100));

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold">
                        {b.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span className="text-[10px] font-bold font-mono mr-1">{toPersianDigits(b.rating)}</span>
                        </div>
                        <button
                          onClick={() => handleOpenBookModal(b)}
                          className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded"
                          title="ویرایش کتاب"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="حذف کتاب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-black text-xs text-zinc-950 mb-1 leading-snug">{b.title}</h4>
                    <p className="text-xs text-zinc-600 mb-3">نویسنده: {b.author}</p>

                    {/* Progress Bar & Page Stats */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">
                          صفحه {toPersianDigits(b.currentPage)} از {toPersianDigits(b.pages)}
                        </span>
                        <span className="font-bold text-zinc-950">{toPersianDigits(progressPct)}٪</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {b.notes && <p className="text-[11px] text-zinc-500 italic mt-3 leading-relaxed">{b.notes}</p>}
                  </div>

                  {/* Quick Page Update Buttons */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-zinc-400">ثبت پیشرفت:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickPageProgress(b, 10)}
                        className="px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-bold"
                        title="۱۰ صفحه خواندم"
                      >
                        +۱۰ ص
                      </button>
                      <button
                        onClick={() => handleQuickPageProgress(b, 25)}
                        className="px-2 py-0.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-[10px] font-bold"
                        title="۲۵ صفحه خواندم"
                      >
                        +۲۵ ص
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SKILLS & PRACTICE PROJECTS */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <Brain className="w-4 h-4 text-zinc-700" />
                شایستگی‌ها و مهارت‌های تخصصی متصل به پروژه‌های واقعی
              </h3>
              <p className="text-[11px] text-zinc-500">
                پایش ساعات تمرین، ارتقای سطح تخصص (مقدماتی تا متخصص) و اتصال به پروژه‌های رایش، بوفه و دانشگاه
              </p>
            </div>
            <button
              onClick={() => handleOpenSkillModal()}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start sm:self-center"
            >
              + مهارت جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((sk) => {
              const skillPct = Math.min(100, Math.round(((sk.hoursInvested || 0) / (sk.targetHours || 1)) * 100));

              return (
                <div
                  key={sk.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold">
                        {sk.area}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenSkillModal(sk)}
                          className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded"
                          title="ویرایش مهارت"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(sk.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="حذف مهارت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-black text-xs text-zinc-950 mb-1 leading-snug">{sk.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-3">
                      <span>سطح کنونی: <strong className="text-zinc-900">{sk.currentLevel}</strong></span>
                      <span>←</span>
                      <span>هدف: <strong className="text-zinc-900">{sk.targetLevel}</strong></span>
                    </div>

                    {/* Progress Bar & Hours */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">
                          {toPersianDigits(sk.hoursInvested)} از {toPersianDigits(sk.targetHours)} ساعت
                        </span>
                        <span className="font-bold text-zinc-950">{toPersianDigits(skillPct)}٪</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-300"
                          style={{ width: `${skillPct}%` }}
                        />
                      </div>
                    </div>

                    {sk.practiceProject && (
                      <div className="mt-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-800 space-y-0.5">
                        <span className="text-[10px] text-zinc-500 font-bold block">پروژه عملی مرتبط:</span>
                        <p className="font-medium text-zinc-900">{sk.practiceProject}</p>
                      </div>
                    )}
                  </div>

                  {sk.curriculum && (
                    <div className="pt-2 border-t border-zinc-100 text-[10px] text-zinc-500 truncate">
                      سرفصل‌ها: {sk.curriculum}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: COURSE MODAL (Create & Edit) */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                {isEditingCourse ? "ویرایش مشخصات درس دانشگاهی" : "تعریف درس جدید در ترم جاری"}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="block text-zinc-700 font-bold">عنوان درس:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: مهندسی نرم‌افزار پیشرفته"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">کد درس:</label>
                  <input
                    type="text"
                    placeholder="CS-302"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نام استاد:</label>
                  <input
                    type="text"
                    placeholder="دکتر محمدی"
                    value={courseInstructor}
                    onChange={(e) => setCourseInstructor(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">تعداد واحد:</label>
                  <input
                    type="number"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              {/* Days Selection */}
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">روزهای تشکیل کلاس در هفته:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {DAYS_LIST.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDaySelection(day)}
                      className={`py-1.5 rounded-xl font-bold text-xs border transition-all text-center ${
                        selectedDays.includes(day)
                          ? "bg-black text-white border-black"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ساعت شروع:</label>
                  <input
                    type="time"
                    value={courseStartTime}
                    onChange={(e) => setCourseStartTime(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ساعت پایان:</label>
                  <input
                    type="time"
                    value={courseEndTime}
                    onChange={(e) => setCourseEndTime(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">آدرس کلاس و دانشکده:</label>
                <input
                  type="text"
                  placeholder="دانشکده مهندسی - طبقه ۳ - کلاس ۳۰۴"
                  value={courseLocation}
                  onChange={(e) => setCourseLocation(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">هدف نمره (از ۲۰):</label>
                  <input
                    type="number"
                    step="0.25"
                    value={courseTargetGrade}
                    onChange={(e) => setCourseTargetGrade(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نمره واقعی اخذشده (در صورت ثبت):</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="هنوز ثبت نشده"
                    value={courseActualGrade}
                    onChange={(e) => setCourseActualGrade(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">یادداشت‌ها و نکات استاد:</label>
                <textarea
                  rows={2}
                  value={courseNotes}
                  onChange={(e) => setCourseNotes(e.target.value)}
                  placeholder="حضور و غیاب، منابع امتحان و جزوات..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : isEditingCourse ? "ذخیره تغییرات درس" : "ثبت درس"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EVENT MODAL (Create & Edit Assignment/Exam) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                {isEditingEvent ? "ویرایش رویداد دانشگاهی" : "ثبت رویداد جدید (تکلیف، امتحان، ارائه)"}
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">درس دانشگاهی مرتبط:</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان رویداد:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً: تحویل تمرین سری دوم یا ارائه سمینار"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نوع رویداد:</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et.val} value={et.val}>
                        {et.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">وزن نمره (درصد):</label>
                  <input
                    type="number"
                    value={eventWeight}
                    onChange={(e) => setEventWeight(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">موعد تحویل یا تاریخ:</label>
                  <input
                    type="date"
                    required
                    value={eventDueDate}
                    onChange={(e) => setEventDueDate(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ساعت:</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">محل برگزاری / لینک سامانه:</label>
                <input
                  type="text"
                  placeholder="آمفی‌تئاتر خوارزمی یا سامانه یادگیری"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">اولویت:</label>
                <select
                  value={eventPriority}
                  onChange={(e) => setEventPriority(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                >
                  <option value="high">🚨 فوری و حیاتی (High)</option>
                  <option value="medium">⚡ مهم متوسط (Medium)</option>
                  <option value="low">🌱 عادی (Low)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">توضیحات و فایل‌های تحویلی:</label>
                <input
                  type="text"
                  placeholder="فرمت PDF، زمان ارائه و جزئیات..."
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : isEditingEvent ? "ذخیره تغییرات رویداد" : "ثبت رویداد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BOOK MODAL (Create & Edit) */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                {isEditingBook ? "ویرایش اطلاعات کتاب" : "ثبت کتاب جدید در کتابخانه"}
              </h3>
              <button onClick={() => setIsBookModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان کتاب:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً: کار عمیق (Deep Work)"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نویسنده / مترجم:</label>
                  <input
                    type="text"
                    placeholder="کال نیوپورت"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">دسته‌بندی:</label>
                  <input
                    type="text"
                    placeholder="توسعه فردی، مدیریت..."
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">تعداد کل صفحات:</label>
                  <input
                    type="number"
                    required
                    value={bookPages}
                    onChange={(e) => setBookPages(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">صفحه فعلی خوانده‌شده:</label>
                  <input
                    type="number"
                    value={bookCurrentPage}
                    onChange={(e) => setBookCurrentPage(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">وضعیت مطالعه:</label>
                  <select
                    value={bookStatus}
                    onChange={(e) => setBookStatus(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="Learning">در حال مطالعه</option>
                    <option value="ToLearn">در نوبت مطالعه (قفسه)</option>
                    <option value="Completed">پایان‌یافته و تکمیل</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">امتیاز کیفی (از ۵):</label>
                  <select
                    value={bookRating}
                    onChange={(e) => setBookRating(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (۵ ستاره)</option>
                    <option value={4}>⭐⭐⭐⭐ (۴ ستاره)</option>
                    <option value={3}>⭐⭐⭐ (۳ ستاره)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">یادداشت‌ها و خلاصه نکات:</label>
                <textarea
                  rows={2}
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="بینش‌های کلیدی که از کتاب گرفتم..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : isEditingBook ? "ذخیره تغییرات کتاب" : "ثبت کتاب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SKILL MODAL (Create & Edit) */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">
                {isEditingSkill ? "ویرایش مهارت تخصصی" : "تعریف مهارت تخصصی جدید"}
              </h3>
              <button onClick={() => setIsSkillModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان مهارت:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً: توسعه وب‌سرویس و درگاه پرداخت"
                  value={skillTitle}
                  onChange={(e) => setSkillTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">حوزه تخصصی:</label>
                <input
                  type="text"
                  placeholder="مهندسی نرم‌افزار، هوش مصنوعی، مالی..."
                  value={skillArea}
                  onChange={(e) => setSkillArea(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">سطح کنونی:</label>
                  <select
                    value={skillCurrentLevel}
                    onChange={(e) => setSkillCurrentLevel(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="مقدماتی">مقدماتی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                    <option value="متخصص">متخصص</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">سطح هدف:</label>
                  <select
                    value={skillTargetLevel}
                    onChange={(e) => setSkillTargetLevel(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                    <option value="متخصص">متخصص</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ساعات تمرین انجام‌شده:</label>
                  <input
                    type="number"
                    value={skillHoursInvested}
                    onChange={(e) => setSkillHoursInvested(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">ساعات تارگت تسلط:</label>
                  <input
                    type="number"
                    value={skillTargetHours}
                    onChange={(e) => setSkillTargetHours(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">پروژه عملی متصل به این مهارت:</label>
                <input
                  type="text"
                  placeholder="پروژه پلتفرم رایش، منوی بوفه، مقاله دانشگاه..."
                  value={skillPracticeProject}
                  onChange={(e) => setSkillPracticeProject(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">سرفصل‌ها و مباحث کلیدی:</label>
                <input
                  type="text"
                  placeholder="مباحث، ابزارها و فریمورک‌ها..."
                  value={skillCurriculum}
                  onChange={(e) => setSkillCurriculum(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : isEditingSkill ? "ذخیره تغییرات مهارت" : "ثبت مهارت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
