"use client";

import Link from "next/link";
import { useOpenAIKey } from "@/lib/use-openai-key";

// 還沒設定 OpenAI 金鑰時的提醒（有設定、或還在伺服器端渲染時不顯示）
export default function ApiKeyNotice({ className = "" }: { className?: string }) {
  const apiKey = useOpenAIKey();
  if (apiKey !== null) return null;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-marker bg-marker/25 px-4 py-3 text-sm ${className}`}
    >
      <p className="min-w-0 text-ink">
        <span className="font-bold">先設定你的 OpenAI API Key</span>
        <span className="text-ink-2">：對話、糾錯、朗讀和語音辨識都會用你自己的金鑰。</span>
      </p>
      <Link
        href="/settings"
        className="inline-flex h-9 shrink-0 items-center rounded-full bg-ink px-4 text-sm font-semibold text-paper transition hover:opacity-90"
      >
        前往設定 →
      </Link>
    </div>
  );
}
