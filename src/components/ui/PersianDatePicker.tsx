"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  toPersianDigits,
  formatPersianDate,
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthDays,
  getJalaliDayOfWeek,
  PERSIAN_MONTH_NAMES,
} from "@/lib/utils";

export interface PersianDatePickerProps {
  value: string; // ISO date string: YYYY-MM-DD
  onChange: (isoDate: string) => void;
  label?: string;
  className?: string;
  buttonClassName?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  label,
  className = "",
  buttonClassName = "",
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentJ = gregorianToJalali(value || new Date());
  const [viewYear, setViewYear] = useState(currentJ.jy);
  const [viewMonth, setViewMonth] = useState(currentJ.jm); // 1-12

  useEffect(() => {
    if (value) {
      const j = gregorianToJalali(value);
      setViewYear(j.jy);
      setViewMonth(j.jm);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedJalali = value ? gregorianToJalali(value) : null;
  const todayJalali = gregorianToJalali(new Date());

  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const startDayOfWeek = getJalaliDayOfWeek(viewYear, viewMonth, 1); // 0 = Shanbeh, 6 = Jomeh

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const g = jalaliToGregorian(viewYear, viewMonth, day);
    onChange(g.isoString);
    setIsOpen(false);
  };

  const handleQuickSelect = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  const displayPersianString = value
    ? formatPersianDate(value, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "انتخاب تاریخ شمسی";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-zinc-700 font-bold mb-1 text-xs">{label}</label>}

      {/* Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2 text-zinc-950 font-medium text-xs flex items-center justify-between transition-all focus:outline-none focus:border-black active:scale-[0.99] ${buttonClassName}`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-zinc-600" />
          <span className="font-bold text-zinc-900">{displayPersianString}</span>
        </div>
        <span className="text-[10px] text-zinc-600 bg-zinc-200/80 px-2 py-0.5 rounded font-mono font-bold">
          تقویم شمسی
        </span>
      </button>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-4 text-right animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Header: Month & Year Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 transition-colors"
              title="ماه بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950">
              <span>{PERSIAN_MONTH_NAMES[viewMonth - 1]}</span>
              <span>{toPersianDigits(viewYear)}</span>
            </div>

            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 transition-colors"
              title="ماه قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center justify-between gap-1 py-2.5 border-b border-zinc-100 text-[10px]">
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 font-bold transition-colors"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1)}
              className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 font-bold transition-colors"
            >
              فردا (D-1)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(2)}
              className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 font-bold transition-colors"
            >
              پس‌فردا
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(7)}
              className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 font-bold transition-colors"
            >
              هفته بعد
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-400 pt-2 pb-1">
            {weekdays.map((w, i) => (
              <div key={i} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Empty slots before first day */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedJalali?.jy === viewYear &&
                selectedJalali?.jm === viewMonth &&
                selectedJalali?.jd === day;

              const isToday =
                todayJalali.jy === viewYear &&
                todayJalali.jm === viewMonth &&
                todayJalali.jd === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    isSelected
                      ? "bg-black text-white shadow-sm"
                      : isToday
                      ? "bg-zinc-200/80 text-black border border-black/20 font-black hover:bg-black hover:text-white"
                      : "text-zinc-800 hover:bg-zinc-100"
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default PersianDatePicker;
