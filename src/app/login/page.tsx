"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password) {
      setError("لطفاً نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("رمز عبور و تکرار آن یکسان نیستند.");
        return;
      }
      if (password.length < 4) {
        setError("رمز عبور باید حداقل ۴ کاراکتر باشد.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { username: username.trim(), password }
          : { username: username.trim(), password, name: name.trim() || username.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "خطا در عملیات ورود/ثبت‌نام");
        setLoading(false);
        return;
      }

      setSuccess(
        mode === "login"
          ? `خوش آمدید، ${data.user.name} عزیز! در حال ورود به پنل اختصاصی...`
          : `حساب اختصاصی شما ساخته شد! در حال آماده‌سازی فضای روز اول...`
      );

      // Force full reload/navigation to dashboard so session cookie is active
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err: any) {
      setError("خطای ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
      setLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setUsername("sajjad");
    setPassword("123456");
    setMode("login");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white" dir="rtl">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl shadow-zinc-200/50 relative overflow-hidden">
        {/* Top Minimal Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black" />

        {/* Brand Header */}
        <div className="text-center mb-8 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-black text-white flex items-center justify-center shadow-lg mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            سیستم‌عامل زندگی | Life OS
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            ورود به فضای شخصی، امن و تفکیک‌شده مدیریتی
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 bg-zinc-100 rounded-xl mb-6 border border-zinc-200/80">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/60"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ورود به حساب</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/60"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>حساب جدید (روز اول)</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سجاد حمامی"
                  className="w-full h-11 pr-10 pl-3 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                />
                <User className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              نام کاربری (لاتین یا شناسه کاربری)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: sajjad"
                required
                className="w-full h-11 pr-10 pl-3 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-left dir-ltr"
              />
              <User className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 pr-10 pl-3 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-left dir-ltr"
              />
              <KeyRound className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                تکرار رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 pr-10 pl-3 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-left dir-ltr"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* Privacy & Isolation Notice */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-600 leading-relaxed">
            <span className="font-bold text-zinc-900">🛡 تفکیک قطعی اطلاعات:</span> هر نام کاربری دارای پایگاه‌داده و پنل مستقل است و اطلاعات شما به هیچ عنوان با سایر کاربران به اشتراک گذاشته نمی‌شود.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>در حال برقراری ارتباط...</span>
            ) : mode === "login" ? (
              <>
                <span>ورود به پنل شخصی</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>ایجاد حساب و ورود به فضای روز اول</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Helper for User sajjad */}
        <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <span>حساب پیش‌فرض سیستم:</span>
          <button
            type="button"
            onClick={fillDefaultAdmin}
            className="text-zinc-900 font-bold hover:underline bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200"
          >
            ورود با sajjad (رمز: ۱۲۳۴۵۶)
          </button>
        </div>
      </div>
    </div>
  );
}
