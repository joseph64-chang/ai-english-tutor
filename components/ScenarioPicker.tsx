"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScenarioIcon from "@/components/ScenarioIcon";

type ScenarioCard = {
  id: string;
  label: string;
  description: string;
  aiRole: string;
  sample: string;
};

export default function ScenarioPicker({
  scenarios,
}: {
  scenarios: ScenarioCard[];
}) {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function start(scenarioId: string) {
    setStartingId(scenarioId);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "開始練習失敗，請再試一次");
      }
      router.push(`/practice/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始練習失敗，請再試一次");
      setStartingId(null);
    }
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((s, i) => {
          const isStarting = startingId === s.id;
          return (
            <li
              key={s.id}
              className="animate-rise"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <button
                type="button"
                onClick={() => start(s.id)}
                disabled={startingId !== null}
                aria-busy={isStarting}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border p-5 text-left transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait ${
                  isStarting
                    ? "border-accent bg-accent text-on-accent shadow-card"
                    : "border-line bg-surface hover:-translate-y-1 hover:border-ink hover:shadow-card disabled:opacity-50 disabled:hover:translate-y-0"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl transition ${
                      isStarting
                        ? "bg-on-accent/15 text-on-accent"
                        : "bg-accent-soft text-accent group-hover:bg-marker group-hover:text-marker-ink"
                    }`}
                  >
                    <ScenarioIcon id={s.id} className="h-6 w-6" />
                  </span>
                  <span
                    className={`font-display text-2xl font-light italic ${isStarting ? "text-on-accent/70" : "text-line-strong"}`}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <span className="mt-5 text-xl font-black">{s.label}</span>
                <span
                  className={`mt-1 text-[11px] font-bold tracking-[0.18em] uppercase ${isStarting ? "text-on-accent/80" : "text-accent"}`}
                >
                  {s.aiRole}
                </span>
                <span className={`mt-3 text-sm leading-relaxed ${isStarting ? "text-on-accent/90" : "text-muted"}`}>
                  {s.description}
                </span>

                <span
                  lang="en"
                  className={`mt-5 border-t border-dashed pt-4 font-display text-[15px] leading-snug italic ${
                    isStarting ? "border-on-accent/30 text-on-accent" : "border-line text-ink-2"
                  }`}
                >
                  {isStarting ? (
                    <span className="not-italic font-sans text-sm font-semibold" lang="zh-Hant">
                      AI 正在準備開場…
                    </span>
                  ) : (
                    <>&ldquo;{s.sample}&rdquo;</>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
