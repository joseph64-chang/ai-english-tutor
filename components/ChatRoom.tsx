"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MessageDTO, SessionDTO } from "@/lib/session-dto";
import type { FeedbackDTO } from "@/lib/feedback";
import { usePref } from "@/lib/use-pref";
import { openAIKeyHeaders } from "@/lib/byok";
import ApiKeyNotice from "@/components/ApiKeyNotice";
import MessageFeedback from "@/components/MessageFeedback";
import ScenarioIcon from "@/components/ScenarioIcon";
import { Wave } from "@/components/HeroDemo";
import { PlayButton, SpeakerProvider, useSpeaker } from "@/components/Speaker";
import {
  MAX_RECORDING_SECONDS,
  useVoiceRecorder,
} from "@/components/useVoiceRecorder";

type Props = {
  session: SessionDTO;
  initialFeedback: FeedbackDTO[];
  scenarioLabel: string;
  aiRole: string;
  maxLength: number;
};

export default function ChatRoom(props: Props) {
  return (
    <SpeakerProvider>
      <ChatRoomInner {...props} />
    </SpeakerProvider>
  );
}

function speechUrl(sessionId: string, messageId: string) {
  return `/api/sessions/${sessionId}/messages/${messageId}/speech`;
}

function formatSeconds(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function ChatRoomInner({
  session,
  initialFeedback,
  scenarioLabel,
  aiRole,
  maxLength,
}: Props) {
  const [messages, setMessages] = useState<MessageDTO[]>(session.messages);
  const [draft, setDraft] = useState("");
  // 輸入框裡的內容是不是用說的（語音辨識來的）
  const [fromVoice, setFromVoice] = useState(false);
  // 送出中的那句話：先顯示在畫面上，AI 回覆成功後換成資料庫存好的版本
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  // 聽力模式下，使用者點開看過文字的 AI 訊息
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [autoRead, setAutoRead] = usePref("tutor.autoRead", true);
  const [listeningMode, setListeningMode] = usePref("tutor.listeningMode", false);
  const speaker = useSpeaker();

  const isActive = session.status === "active";

  const recorder = useVoiceRecorder({
    onText: (text) => {
      setDraft((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      setFromVoice(true);
      setError("");
      inputRef.current?.focus();
    },
    onError: setError,
    getContext: () => messages.findLast((m) => m.role === "assistant")?.content,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  // 剛開始的練習：自動朗讀 AI 的開場白（從選場景頁點進來，瀏覽器才允許自動播放）
  const { play: playSpeech } = speaker;
  const openingPlayed = useRef(false);
  useEffect(() => {
    const first = session.messages[0];
    if (openingPlayed.current || !autoRead || !isActive) return;
    if (session.messages.length !== 1 || first?.role !== "assistant") return;
    openingPlayed.current = true;
    playSpeech(speechUrl(session.id, first.id));
    // 開發模式 React 會模擬「卸載再掛載」並停止播放；重設旗標，重新掛載時才會再播一次
    return () => {
      openingPlayed.current = false;
    };
  }, [autoRead, isActive, session, playSpeech]);

  async function send() {
    const content = draft.trim();
    if (!content || pending !== null) return;

    setPending(content);
    setDraft("");
    setError("");
    speaker.stop();
    try {
      const res = await fetch(`/api/sessions/${session.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...openAIKeyHeaders() },
        body: JSON.stringify({
          content,
          inputType: fromVoice ? "voice" : "text",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "送出失敗，請再試一次");
      }
      setMessages((prev) => [
        ...prev,
        data.userMessage,
        data.assistantMessage,
      ]);
      setFromVoice(false);
      if (autoRead) speaker.play(speechUrl(session.id, data.assistantMessage.id));
    } catch (err) {
      // 失敗時把句子放回輸入框，使用者可以直接重送
      setDraft(content);
      setError(err instanceof Error ? err.message : "送出失敗，請再試一次");
    } finally {
      setPending(null);
      inputRef.current?.focus();
    }
  }

  function startRecording() {
    speaker.stop(); // 避免把 AI 的朗讀一起錄進去
    setError("");
    recorder.start();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 注音/中文輸入法選字時按的 Enter 不算送出
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  function reveal(id: string) {
    setRevealed((prev) => new Set(prev).add(id));
  }

  const busy = pending !== null || recorder.status === "transcribing";
  const turns = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* ---------- 頂部：場景資訊與開關 ---------- */}
      <header className="z-20 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/practice"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3 text-sm font-semibold text-ink-2 transition hover:border-ink hover:text-ink"
          >
            <span aria-hidden>←</span> 換場景
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right leading-tight">
              <p className="truncate font-display text-lg font-black">{scenarioLabel}</p>
              <p className="truncate text-xs text-muted">
                AI 扮演 <span className="font-semibold text-ink-2">{aiRole}</span>
                {turns > 0 && <> · 你說了 {turns} 句</>}
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
              <ScenarioIcon id={session.scenarioId} className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 pb-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Toggle checked={autoRead} onChange={setAutoRead}>
              自動朗讀
            </Toggle>
            <Toggle checked={listeningMode} onChange={setListeningMode}>
              聽力模式
            </Toggle>
          </div>
          <Link href="/history" className="shrink-0 text-xs font-semibold text-muted underline-offset-4 transition hover:text-ink hover:underline">
            練習紀錄
          </Link>
        </div>
      </header>

      {/* ---------- 對話 ---------- */}
      <div className="dot-grid flex-1 overflow-y-auto">
        <ul className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <Bubble
                  key={m.id}
                  role="user"
                  label={m.inputType === "voice" ? "你・口說" : "你"}
                  voice={m.inputType === "voice"}
                  footer={
                    <MessageFeedback
                      sessionId={session.id}
                      messageId={m.id}
                      initial={initialFeedback.filter((f) => f.messageId === m.id)}
                    />
                  }
                >
                  {m.content}
                </Bubble>
              );
            }

            const hidden = listeningMode && !revealed.has(m.id);
            return (
              <Bubble
                key={m.id}
                role="assistant"
                label={aiRole}
                scenarioId={session.scenarioId}
                footer={
                  <div className="mt-2 flex flex-wrap gap-2 pl-11">
                    <PlayButton src={speechUrl(session.id, m.id)} label="聽這句" />
                    {hidden && (
                      <button
                        type="button"
                        onClick={() => reveal(m.id)}
                        className="rounded-full border border-line-strong bg-surface px-3 py-1 text-xs font-semibold text-ink-2 transition hover:border-ink hover:text-ink"
                      >
                        顯示文字
                      </button>
                    )}
                  </div>
                }
              >
                {hidden ? (
                  <span aria-label="文字已隱藏，先聽聽看" className="select-none blur-[5px]">
                    {m.content}
                  </span>
                ) : (
                  m.content
                )}
              </Bubble>
            );
          })}
          {pending !== null && (
            <>
              <Bubble role="user" label={fromVoice ? "你・口說" : "你"} voice={fromVoice}>
                {pending}
              </Bubble>
              <Bubble role="assistant" label={aiRole} scenarioId={session.scenarioId}>
                <span className="flex h-6 items-center gap-1.5" aria-label="AI 正在回覆">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-muted"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
              </Bubble>
            </>
          )}
        </ul>
        <div ref={bottomRef} />
      </div>

      {/* ---------- 輸入區 ---------- */}
      <footer className="border-t border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 sm:pb-5">
          {isActive && <ApiKeyNotice className="mb-3" />}
          {error && (
            <p
              role="alert"
              className="mb-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
          {!isActive ? (
            <p className="py-2 text-center text-sm text-muted">這場練習已經結束了。</p>
          ) : recorder.status === "recording" ? (
            <div className="flex items-center gap-2 rounded-[28px] border-2 border-danger bg-surface p-2 shadow-card">
              <span className="relative ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-danger text-white">
                <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" aria-hidden />
                <MicIcon className="relative h-5 w-5" />
              </span>
              <div role="status" className="flex min-w-0 flex-1 items-center gap-3">
                <Wave className="h-6 min-w-0 flex-1 overflow-hidden [&>span]:bg-danger" bars={28} />
                <span className="shrink-0 font-mono text-sm font-semibold text-danger">
                  {formatSeconds(recorder.seconds)}
                  <span className="hidden text-muted min-[420px]:inline"> / {formatSeconds(MAX_RECORDING_SECONDS)}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={recorder.cancel}
                className="h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-muted transition hover:text-ink"
              >
                取消
              </button>
              <button
                type="button"
                onClick={recorder.stop}
                className="h-11 shrink-0 rounded-full bg-ink px-5 text-sm font-bold text-paper transition hover:opacity-90"
              >
                說完了
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2 rounded-[28px] border border-line-strong bg-surface p-2 shadow-card transition focus-within:border-accent"
            >
              <button
                type="button"
                onClick={startRecording}
                disabled={busy}
                aria-label="用說的回答"
                title="用說的回答"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-marker text-marker-ink transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <MicIcon className="h-5 w-5" />
              </button>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (!e.target.value.trim()) setFromVoice(false);
                }}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                rows={1}
                lang="en"
                autoFocus
                disabled={recorder.status === "transcribing"}
                placeholder={
                  recorder.status === "transcribing"
                    ? "正在辨識你說的話…"
                    : "打字，或按麥克風用說的"
                }
                aria-label="你的回答"
                className="field-sizing-content max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || busy}
                aria-label="送出"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition hover:bg-accent-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          )}
          <p className="mt-2 hidden text-center text-[11px] text-muted sm:block">
            Enter 送出 · Shift + Enter 換行 · 說完的內容會先放進輸入框，確認後再送出
          </p>
        </div>
      </footer>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
        checked
          ? "border-ink bg-ink text-paper"
          : "border-line-strong bg-surface text-ink-2 hover:border-ink"
      }`}
    >
      <span
        className={`relative h-4 w-7 rounded-full transition ${checked ? "bg-marker" : "bg-line"}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
            checked ? "left-3.5 bg-marker-ink" : "left-0.5 bg-surface"
          }`}
        />
      </span>
      {children}
    </button>
  );
}

function MicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    </svg>
  );
}

function Bubble({
  role,
  label,
  voice = false,
  scenarioId,
  footer,
  children,
}: {
  role: MessageDTO["role"];
  label: string;
  voice?: boolean;
  scenarioId?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <li className="animate-rise flex flex-col items-end">
        <span className="mb-1.5 flex items-center gap-1 pr-1 text-[11px] font-bold tracking-wide text-muted">
          {voice && <MicIcon className="h-3 w-3" />}
          {label}
        </span>
        <p
          lang="en"
          className="max-w-[85%] rounded-[22px] rounded-br-md bg-accent px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-on-accent shadow-[0_8px_20px_-12px_var(--accent)] sm:text-base"
        >
          {children}
        </p>
        {footer}
      </li>
    );
  }

  return (
    <li className="animate-rise flex flex-col items-start">
      <div className="flex max-w-[92%] items-end gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-accent">
          <ScenarioIcon id={scenarioId ?? ""} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <span className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wide text-muted">{label}</span>
          <p
            lang="en"
            className="rounded-[22px] rounded-bl-md border border-line bg-surface px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-card sm:text-base"
          >
            {children}
          </p>
        </div>
      </div>
      {footer}
    </li>
  );
}
