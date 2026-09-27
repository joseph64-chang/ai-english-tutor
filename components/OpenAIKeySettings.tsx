"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonPrimary, buttonSecondary, card } from "@/components/ui";
import { clearKey, looksLikeOpenAIKey, maskKey, saveKey } from "@/lib/byok";
import { useOpenAIKey } from "@/lib/use-openai-key";

export default function OpenAIKeySettings() {
  const storedKey = useOpenAIKey();
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const key = draft.trim();
    if (!looksLikeOpenAIKey(key)) {
      setError("格式看起來不對。OpenAI API Key 是 sk- 開頭的一長串文字。");
      setSaved(false);
      return;
    }
    try {
      saveKey(key);
      setDraft("");
      setShow(false);
      setError("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    }
  }

  function handleClear() {
    clearKey();
    setSaved(false);
    setError("");
  }

  return (
    <div className="animate-rise space-y-6">
      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-line px-5 py-5 sm:px-7">
          <h2 className="text-lg font-black">OpenAI API Key</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            AI 對話、文法糾正、朗讀和語音辨識都用你自己的 OpenAI 帳號執行，費用由你的帳號支付。
          </p>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-7">
          {/* 目前狀態 */}
          {storedKey === undefined ? (
            <div className="h-[62px] animate-pulse rounded-2xl bg-paper-2" />
          ) : storedKey ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3">
              <div className="min-w-0 text-sm text-success">
                <p className="font-bold">已設定</p>
                <p className="truncate font-mono text-xs opacity-80">{maskKey(storedKey)}</p>
              </div>
              <button type="button" onClick={handleClear} className={`${buttonSecondary} h-9 px-4 text-sm`}>
                移除金鑰
              </button>
            </div>
          ) : (
            <p className="rounded-2xl border border-marker bg-marker/25 px-4 py-3 text-sm text-ink">
              還沒有設定金鑰。設定之前，無法開始練習。
            </p>
          )}

          {saved && storedKey && (
            <p
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-medium text-success"
            >
              金鑰已儲存在這個瀏覽器。
              <Link href="/practice" className="font-bold underline underline-offset-4">
                去練習 →
              </Link>
            </p>
          )}

          {/* 輸入 */}
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <div>
              <label htmlFor="openai-key" className="text-sm font-semibold text-ink-2">
                {storedKey ? "更換金鑰" : "貼上你的金鑰"}
              </label>
              <div className="relative mt-2">
                <input
                  id="openai-key"
                  type={show ? "text" : "password"}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError("");
                  }}
                  placeholder="sk-..."
                  autoComplete="off"
                  spellCheck={false}
                  className="block h-12 w-full rounded-2xl border border-line-strong bg-surface pr-20 pl-4 font-mono text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "隱藏金鑰" : "顯示金鑰"}
                  className="absolute top-1/2 right-2 h-8 -translate-y-1/2 rounded-full px-3 text-xs font-semibold text-muted transition hover:bg-paper-2 hover:text-ink"
                >
                  {show ? "隱藏" : "顯示"}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!draft.trim()}
              className={`${buttonPrimary} h-11 w-full disabled:opacity-50 sm:w-auto`}
            >
              儲存金鑰
            </button>
          </form>

          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            還沒有金鑰？到 OpenAI 後台建立 ↗
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-line px-5 py-5 sm:px-7">
        <h3 className="font-bold">你的金鑰怎麼被使用</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
          <li>
            金鑰只存在<strong>這個瀏覽器</strong>裡，不會存進我們的資料庫。換一台電腦或瀏覽器需要重新輸入。
          </li>
          <li>
            每次需要 AI 時，瀏覽器會把金鑰一起送到我們的伺服器，伺服器只用它呼叫 OpenAI，用完即丟，不會儲存或寫進紀錄。
          </li>
          <li>建議在 OpenAI 後台替這把金鑰設定用量上限；在共用電腦上用完記得「移除金鑰」。</li>
        </ul>
      </section>
    </div>
  );
}
