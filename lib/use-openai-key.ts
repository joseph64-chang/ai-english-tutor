"use client";

import { useSyncExternalStore } from "react";
import { getStoredKey, subscribeKey } from "@/lib/byok";

// 讀取使用者存在瀏覽器的 OpenAI API Key。
// 回傳 undefined 代表還在伺服器端渲染、尚未讀到瀏覽器（避免閃出「未設定」），
// null 代表確定沒有設定。
export function useOpenAIKey(): string | null | undefined {
  return useSyncExternalStore(
    subscribeKey,
    () => getStoredKey(),
    () => undefined,
  );
}
