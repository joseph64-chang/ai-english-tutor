"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// 全頁共用一個播放器：同時間只播一句，按別句會切換，按同一句會停止。

type SpeakerState = "loading" | "playing" | "error";

type SpeakerContextValue = {
  current: { src: string; state: SpeakerState } | null;
  play: (src: string) => Promise<void>;
  stop: () => void;
};

const SpeakerContext = createContext<SpeakerContextValue | null>(null);

export function SpeakerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<SpeakerContextValue["current"]>(null);
  // 每次播放／停止都換一個編號；舊的播放晚到的事件（被中斷、出錯）一律忽略，不會蓋掉新的狀態
  const tokenRef = useRef(0);

  const stop = useCallback(() => {
    tokenRef.current++;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrent(null);
  }, []);

  const play = useCallback(async (src: string) => {
    const token = ++tokenRef.current;
    const isCurrent = () => token === tokenRef.current;
    const audio = (audioRef.current ??= new Audio());
    audio.onplaying = () => isCurrent() && setCurrent({ src, state: "playing" });
    audio.onended = () => isCurrent() && setCurrent(null);
    audio.onerror = () => isCurrent() && setCurrent({ src, state: "error" });

    setCurrent({ src, state: "loading" });
    audio.src = src;
    try {
      await audio.play();
    } catch (err) {
      if (!isCurrent()) return;
      // 被暫停中斷，或瀏覽器擋自動播放（使用者還沒跟頁面互動）：不算錯誤，按鈕回到可播放狀態
      const name = err instanceof DOMException ? err.name : "";
      setCurrent(
        name === "AbortError" || name === "NotAllowedError"
          ? null
          : { src, state: "error" },
      );
    }
  }, []);

  // 離開頁面時停止播放
  useEffect(() => () => stop(), [stop]);

  return (
    <SpeakerContext.Provider value={{ current, play, stop }}>
      {children}
    </SpeakerContext.Provider>
  );
}

export function useSpeaker() {
  const ctx = useContext(SpeakerContext);
  if (!ctx) throw new Error("useSpeaker 必須放在 SpeakerProvider 裡面");
  return ctx;
}

export function PlayButton({
  src,
  label = "播放",
  className = "",
}: {
  src: string;
  label?: string;
  className?: string;
}) {
  const { current, play, stop } = useSpeaker();
  const state = current?.src === src ? current.state : null;

  const text =
    state === "loading"
      ? "載入中…"
      : state === "playing"
        ? "停止"
        : state === "error"
          ? "播放失敗，再試一次"
          : label;

  return (
    <button
      type="button"
      onClick={() => (state === "playing" || state === "loading" ? stop() : play(src))}
      aria-label={state === "playing" ? "停止播放" : label}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
        state === "error"
          ? "border-danger bg-danger-soft text-danger"
          : state
            ? "border-accent bg-accent text-on-accent"
            : "border-line-strong bg-surface text-ink-2 hover:border-accent hover:text-accent"
      } ${className}`}
    >
      {state === "playing" ? <StopIcon /> : <SpeakerIcon />}
      {text}
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
