"use client";

import { useCallback, useSyncExternalStore } from "react";

// 記在這台瀏覽器的開關設定（例如自動朗讀、聽力模式）。
// localStorage 可能被封鎖（無痕、隱私設定），所以讀寫都包 try/catch，失敗就用預設值。

const EVENT = "pref-change";

function read(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function usePref(key: string, fallback: boolean) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback, // 伺服器端渲染一律用預設值，避免 hydration 不一致
  );

  const setValue = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // 存不了就只影響這次
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
