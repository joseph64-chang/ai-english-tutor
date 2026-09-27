"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedbackDTO } from "@/lib/feedback";
import { openAIKeyHeaders } from "@/lib/byok";
import { PlayButton } from "@/components/Speaker";
import { highlight } from "@/components/highlight";

// 朗讀這則建議裡的句子：i=0 是主要句子，1、2 是其他講法
function speechUrl(feedback: FeedbackDTO, i = 0) {
  return `/api/corrections/${feedback.id}/speech?i=${i}`;
}

type Kind = FeedbackDTO["kind"];

const ACTIONS: { kind: Kind; label: string; path: string }[] = [
  { kind: "correction", label: "糾正文法", path: "grammar" },
  { kind: "suggestion", label: "更好的回答", path: "better-answer" },
];

type State = {
  feedback?: FeedbackDTO;
  loading: boolean;
  error: string;
  open: boolean;
};

// 使用者每句話下面的兩個按鈕，以及按下後顯示的結果
export default function MessageFeedback({
  sessionId,
  messageId,
  initial,
}: {
  sessionId: string;
  messageId: string;
  initial: FeedbackDTO[];
}) {
  const [states, setStates] = useState<Record<Kind, State>>(() => ({
    correction: {
      feedback: initial.find((f) => f.kind === "correction"),
      loading: false,
      error: "",
      open: initial.some((f) => f.kind === "correction"),
    },
    suggestion: {
      feedback: initial.find((f) => f.kind === "suggestion"),
      loading: false,
      error: "",
      open: initial.some((f) => f.kind === "suggestion"),
    },
  }));
  const panelRef = useRef<HTMLDivElement>(null);
  // 每次打開或載入完成就 +1，觸發捲動
  const [scrollTick, setScrollTick] = useState(0);

  function update(kind: Kind, patch: Partial<State>) {
    setStates((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));
  }

  // 打開結果後捲到看得見的位置（最後一句的結果常常在畫面外）
  useEffect(() => {
    if (scrollTick > 0) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [scrollTick]);

  async function toggle(kind: Kind, path: string) {
    const s = states[kind];
    if (s.loading) return;
    // 已經拿到結果：按鈕只負責展開／收合
    if (s.feedback) {
      update(kind, { open: !s.open });
      if (!s.open) setScrollTick((t) => t + 1);
      return;
    }

    update(kind, { loading: true, error: "", open: true });
    setScrollTick((t) => t + 1);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/messages/${messageId}/${path}`,
        { method: "POST", headers: openAIKeyHeaders() },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "取得建議失敗，請再試一次");
      update(kind, { feedback: data.feedback, loading: false });
      setScrollTick((t) => t + 1);
    } catch (err) {
      update(kind, {
        loading: false,
        error: err instanceof Error ? err.message : "取得建議失敗，請再試一次",
      });
    }
  }

  const visible = ACTIONS.filter(({ kind }) => states[kind].open);

  return (
    <div className="mt-2 flex w-full flex-col items-end gap-2.5">
      <div className="flex gap-2">
        {ACTIONS.map(({ kind, label, path }) => {
          const s = states[kind];
          const saved = Boolean(s.feedback);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggle(kind, path)}
              disabled={s.loading}
              aria-expanded={s.open}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:cursor-wait ${
                s.open
                  ? "border-ink bg-ink text-paper"
                  : "border-line-strong bg-surface text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              {s.loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                  分析中…
                </>
              ) : (
                <>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      kind === "correction" ? "bg-danger" : "bg-marker"
                    } ${saved ? "" : "opacity-60"}`}
                    aria-hidden
                  />
                  {label}
                </>
              )}
            </button>
          );
        })}
      </div>

      {visible.length > 0 && (
        <div ref={panelRef} className="flex w-full max-w-[92%] flex-col gap-2.5 sm:max-w-[85%]">
          {visible.map(({ kind }) => {
            const s = states[kind];
            if (s.error) {
              return (
                <p
                  key={kind}
                  role="alert"
                  className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
                >
                  {s.error}
                </p>
              );
            }
            if (!s.feedback) {
              return (
                <div
                  key={kind}
                  className="animate-pop rounded-2xl border border-line bg-surface px-4 py-4 shadow-card"
                  aria-label="AI 正在分析這句話"
                >
                  <div className="h-3 w-24 animate-pulse rounded-full bg-paper-2" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-paper-2" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-paper-2" />
                </div>
              );
            }
            return kind === "correction" ? (
              <GrammarPanel key={kind} feedback={s.feedback} />
            ) : (
              <BetterAnswerPanel key={kind} feedback={s.feedback} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function PanelTag({ tone, children }: { tone: "danger" | "accent" | "success"; children: React.ReactNode }) {
  const color = { danger: "text-danger", accent: "text-accent", success: "text-success" }[tone];
  return <p className={`text-[11px] font-bold tracking-[0.2em] ${color}`}>{children}</p>;
}

function GrammarPanel({ feedback }: { feedback: FeedbackDTO }) {
  const unchanged = feedback.correctedText === feedback.originalText;

  if (feedback.issues.length === 0 && unchanged) {
    return (
      <section className="animate-pop flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3.5 text-sm">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-white" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <PanelTag tone="success">文法正確</PanelTag>
          <p className="mt-1 leading-relaxed text-ink-2">{feedback.explanation}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-pop overflow-hidden rounded-2xl border border-line bg-surface text-sm shadow-card">
      <div className="border-l-4 border-danger px-4 py-4">
        <PanelTag tone="danger">糾正文法</PanelTag>
        <p lang="en" className="mt-2 text-base leading-relaxed">
          {highlight(feedback.correctedText, feedback.issues.map((i) => i.corrected))}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PlayButton src={speechUrl(feedback)} label="聽正確說法" />
        </div>
        <p className="mt-3 leading-relaxed text-muted">{feedback.explanation}</p>
      </div>
      {feedback.issues.length > 0 && (
        <ol className="divide-y divide-line border-t border-line bg-paper/60">
          {feedback.issues.map((issue, i) => (
            <li key={i} className="flex gap-3 px-4 py-3">
              <span className="font-display text-sm text-muted italic" aria-hidden>
                {i + 1}.
              </span>
              <div className="min-w-0">
                <p lang="en" className="leading-relaxed">
                  <span className="red-pen text-muted">{issue.original}</span>
                  <span className="mx-2 text-muted" aria-hidden>
                    →
                  </span>
                  <span className="sr-only">改成</span>
                  <span className="marker font-semibold">{issue.corrected}</span>
                </p>
                <p className="mt-1 leading-relaxed text-muted">{issue.explanation}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function BetterAnswerPanel({ feedback }: { feedback: FeedbackDTO }) {
  // 說明是「• 」開頭的條列，拆開來排版
  const points = feedback.explanation
    .split("\n")
    .map((line) => line.replace(/^\s*[•・\-]\s*/, "").trim())
    .filter(Boolean);

  return (
    <section className="animate-pop overflow-hidden rounded-2xl border border-accent/25 bg-surface text-sm shadow-card">
      <div className="bg-accent-soft/70 px-4 py-4">
        <PanelTag tone="accent">更好的回答</PanelTag>
        <p lang="en" className="mt-2 font-display text-lg leading-snug font-semibold sm:text-xl">
          &ldquo;{feedback.correctedText}&rdquo;
        </p>
        <div className="mt-3">
          <PlayButton src={speechUrl(feedback)} label="聽這樣說" />
        </div>
      </div>
      {points.length > 0 && (
        <ul className="space-y-1.5 px-4 pt-3.5 pb-1 text-ink-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {feedback.alternatives.length > 0 && (
        <div className="px-4 pt-3 pb-4">
          <p className="mb-2 text-[11px] font-bold tracking-[0.2em] text-muted">也可以這樣說</p>
          <ul className="flex flex-col gap-2">
            {feedback.alternatives.map((a, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-paper/60 px-3 py-2.5"
              >
                <span lang="en" className="leading-relaxed">
                  {a}
                </span>
                <PlayButton src={speechUrl(feedback, i + 1)} label="聽" className="shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
