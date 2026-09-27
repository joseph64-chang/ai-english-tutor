import type { Metadata } from "next";
import { requireUserId } from "@/lib/dal";
import SiteHeader from "@/components/SiteHeader";
import OpenAIKeySettings from "@/components/OpenAIKeySettings";
import { eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "設定｜AI 英文家教" };

export default async function SettingsPage() {
  await requireUserId();

  return (
    <>
      <SiteHeader active="/settings" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <header className="animate-rise mb-8">
            <p className={eyebrow}>Settings</p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">設定</h1>
            <p className="mt-3 max-w-lg leading-relaxed text-muted">
              這個服務使用你自己的 OpenAI API Key 來對話、糾錯、朗讀和辨識語音。
            </p>
          </header>
          <OpenAIKeySettings />
        </div>
      </main>
    </>
  );
}
