"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH, validateAuthInput } from "@/lib/auth-input";
import Logo from "@/components/Logo";
import { buttonPrimary } from "@/components/ui";

const inputBase =
  "block h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15";
const inputClass = `mt-2 ${inputBase}`;

const PERKS = [
  { en: "Speak", zh: "8 個生活情境，AI 角色先開口" },
  { en: "Fix", zh: "紅筆糾正文法，中文解釋為什麼" },
  { en: "Listen", zh: "更好的說法念給你聽，跟著唸" },
];

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next: string; // 登入後要回去的頁面（已在伺服器端檢查過是站內路徑）
}) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      name: isRegister ? String(form.get("name") ?? "") : undefined,
    };

    const invalid = validateAuthInput(input, mode);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "發生錯誤，請再試一次");
      // refresh 讓伺服器端元件（頁首）重新讀取登入狀態
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤，請再試一次");
      setSubmitting(false);
    }
  }

  const otherHref = `${isRegister ? "/login" : "/register"}${
    next !== "/practice" ? `?next=${encodeURIComponent(next)}` : ""
  }`;

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[1fr_1.05fr]">
      {/* 左側品牌區（手機隱藏） */}
      <aside className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <Logo inverted />
        <div>
          <p className="font-display text-5xl leading-[1.15] font-black xl:text-6xl">
            開口說，
            <br />
            就會<span className="rounded-xl bg-marker px-2 text-marker-ink">進步</span>
          </p>
          <ul className="mt-12 space-y-5">
            {PERKS.map((p) => (
              <li key={p.en} className="flex items-baseline gap-4">
                <span className="w-20 shrink-0 font-display text-2xl text-marker italic" lang="en">
                  {p.en}
                </span>
                <span className="text-paper/80">{p.zh}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-display text-sm text-paper/50 italic" lang="en">
          &ldquo;The best way to learn a language is to speak it.&rdquo;
        </p>
      </aside>

      {/* 表單 */}
      <div className="dot-grid flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="animate-rise w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <p className="text-[11px] font-bold tracking-[0.24em] text-accent uppercase">
            {isRegister ? "Create account" : "Welcome back"}
          </p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
            {isRegister ? "建立帳號" : "登入"}
          </h1>
          <p className="mt-3 leading-relaxed text-muted">
            {isRegister
              ? "只要 Email 和密碼。練過的對話和糾錯都會幫你存起來。"
              : "繼續上次的練習，或回顧之前的糾錯紀錄。"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {isRegister && (
              <label className="block text-sm font-semibold">
                怎麼稱呼你
                <span className="ml-1 font-normal text-muted">（選填）</span>
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={50}
                  placeholder="例如：小明"
                  className={inputClass}
                />
              </label>
            )}
            <label className="block text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold">
                密碼
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
                  className={`${inputBase} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-paper-2 hover:text-ink"
                >
                  {showPassword ? "隱藏" : "顯示"}
                </button>
              </div>
              {isRegister && (
                <p className="mt-2 text-xs text-muted">至少 {MIN_PASSWORD_LENGTH} 個字元</p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className={`${buttonPrimary} h-12 w-full text-base`}>
              {submitting ? "處理中…" : isRegister ? "建立帳號，開始練習 →" : "登入 →"}
            </button>
          </form>

          <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
            {isRegister ? "已經有帳號了？" : "還沒有帳號？"}
            <Link
              href={otherHref}
              className="ml-1 font-bold text-accent underline-offset-4 hover:underline"
            >
              {isRegister ? "登入" : "免費註冊"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
