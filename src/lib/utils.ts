import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPersianDigits(n: number | string): string {
  if (n === null || n === undefined) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
}

export function formatCurrency(
  amount: number,
  currency: "تومان" | "ریال" = "تومان",
  usePersianDigits = true
): string {
  const formatted = Math.round(amount).toLocaleString("en-US");
  const result = `${formatted} ${currency}`;
  return usePersianDigits ? toPersianDigits(result) : result;
}

export function formatPersianDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    calendar: "persian",
    numberingSystem: "persian",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("fa-IR", defaultOptions).format(d);
  } catch (e) {
    return d.toLocaleDateString("fa-IR");
  }
}

export function formatPersianDateTime(date: Date | string | number): string {
  return formatPersianDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTodayPersianString(): string {
  return formatPersianDate(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function calculateSleepEfficiency(totalSleepMinutes: number, timeInBedMinutes: number): number {
  if (!timeInBedMinutes || timeInBedMinutes <= 0) return 0;
  const eff = (totalSleepMinutes / timeInBedMinutes) * 100;
  return Math.min(100, Math.round(eff * 10) / 10);
}

export function calculateProgress(baseline: number, target: number, current: number): number {
  if (target === baseline) return current >= target ? 100 : 0;
  const p = ((current - baseline) / (target - baseline)) * 100;
  return Math.min(100, Math.max(0, Math.round(p)));
}

export const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
    2262, 2324, 2394, 2456, 3178,
  ];
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) return false;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) n = n - jump + (Math.floor((jump + 4) / 33) * 33);
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;
  return leap === 0;
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29;
  return 30;
}

export function gregorianToJalali(dateInput: Date | string | number): {
  jy: number;
  jm: number;
  jd: number;
  monthName: string;
} {
  const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  let gy = d.getFullYear();
  let gm = d.getMonth() + 1;
  let gd = d.getDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return {
    jy,
    jm,
    jd,
    monthName: PERSIAN_MONTH_NAMES[jm - 1] || "",
  };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): {
  gy: number;
  gm: number;
  gd: number;
  isoString: string;
} {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm: number;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }

  const mmStr = String(gm).padStart(2, "0");
  const ddStr = String(gd).padStart(2, "0");
  const isoString = `${gy}-${mmStr}-${ddStr}`;

  return {
    gy,
    gm,
    gd,
    isoString,
  };
}

export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorian(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  return (day + 1) % 7; // 0 = Shanbeh, 1 = Yekshanbeh, ..., 6 = Jomeh
}

