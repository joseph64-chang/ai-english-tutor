import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { requireUserId } from "@/lib/dal";
import { getScenario } from "@/lib/scenarios";
import { formatDateTime } from "@/lib/format";
import { CorrectionModel } from "@/models/Correction";
import { PracticeSessionModel } from "@/models/PracticeSession";
import SiteHeader from "@/components/SiteHeader";
import ApiKeyNotice from "@/components/ApiKeyNotice";
import { PlayButton, SpeakerProvider } from "@/components/Speaker";
import ScenarioIcon from "@/components/ScenarioIcon";
import { highlight } from "@/components/highlight";
import { buttonPrimary, eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "糾錯紀錄｜AI 英文家教" };

const LIMIT = 100;

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "correction", label: "文法錯誤" },
  { key: "suggestion", label: "更好的回答" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function CorrectionsPage(props: PageProps<"/corrections">) {
  const userId = await requireUserId();
  const { kind } = await props.searchParams;
  const filter: FilterKey =
    FILTERS.find((f) => f.key === kind)?.key ?? "all";

  await connectDB();

  // 只查自己的紀錄。文法檢查結果是「沒有錯」的不算糾錯，不列出來
  const hasErrors = {
    kind: "correction" as const,
    $or: [{ "issues.0": { $exists: true } }, { $expr: { $ne: ["$correctedText", "$originalText"] } }],
  };
  const query =
    filter === "correction"
      ? { userId, ...hasErrors }
      : filter === "suggestion"
        ? { userId, kind: "suggestion" as const }
        : { userId, $or: [hasErrors, { kind: "suggestion" as const }] };

  const items = await CorrectionModel.find(query)
    .sort({ createdAt: -1 })
    .limit(LIMIT)
    .lean();

  // 每則紀錄標示是在哪個場景練的
  const sessionIds = [...new Set(items.map((c) => c.sessionId.toString()))];
  const sessions = await PracticeSessionModel.find(
    { _id: { $in: sessionIds }, userId },
    { topic: 1 },
  ).lean();
  const topicBySession = new Map(sessions.map((s) => [s._id.toString(), s.topic]));

  // 「全部」時顯示兩種各幾則（用上面已經查到的資料算）
  const counts = {
    correction: items.filter((c) => c.kind === "correction").length,
    suggestion: items.filter((c) => c.kind === "suggestion").length,
  };

  return (
    <>
      <SiteHeader active="/corrections" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <header className="animate-rise">
            <p className={eyebrow}>Your notebook</p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">
              糾錯<span className="marker">筆記本</span>
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">
              練習時按過「糾正文法」「更好的回答」的結果都收在這裡。紅筆是說錯的地方，螢光筆是該記住的說法，每句都能按下去聽。
            </p>
          </header>
          <ApiKeyNotice className="mt-6" />

          <nav
            className="mt-8 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1"
            aria-label="篩選"
          >
            {FILTERS.map((f) => {
              const isActive = f.key === filter;
              return (
                <Link
                  key={f.key}
                  href={f.key === "all" ? "/corrections" : `/corrections?kind=${f.key}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition ${
                    isActive ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"
                  }`}
                >
                  {f.key !== "all" && (
                    <span
                      className={`h-2 w-2 rounded-full ${f.key === "correction" ? "bg-danger" : "bg-marker"}`}
                      aria-hidden
                    />
                  )}
                  {f.label}
                </Link>
              );
            })}
          </nav>

          {items.length === 0 ? (
            <div className="dot-grid mt-10 flex flex-col items-center rounded-3xl border-2 border-dashed border-line-strong px-6 py-16 text-center">
              <p className="font-display text-2xl font-black">筆記本還是空的</p>
              <p className="mt-2 max-w-sm text-muted">
                練習時在你說的句子下面按「糾正文法」或「更好的回答」，結果就會收進這裡。
              </p>
              <Link href="/practice" className={`${buttonPrimary} mt-8 h-12`}>
                去練習 →
              </Link>
            </div>
          ) : (
            <SpeakerProvider>
              {filter === "all" && (
                <p className="mt-6 text-sm text-muted">
                  共 {items.length} 則：文法錯誤 {counts.correction} 則、更好的回答 {counts.suggestion} 則
                </p>
              )}
              <ul className="mt-4 flex flex-col gap-4">
                {items.map((c, i) => {
                  const scenarioId = topicBySession.get(c.sessionId.toString()) ?? "";
                  const scenario = getScenario(scenarioId);
                  const id = c._id.toString();
                  const isCorrection = c.kind === "correction";
                  const points = c.explanation
                    .split("\n")
                    .map((line) => line.replace(/^\s*[•・-]\s*/, "").trim())
                    .filter(Boolean);
                  return (
                    <li
                      key={id}
                      className="animate-rise overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
                        <div className="flex min-w-0 items-center gap-2.5 text-xs">
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 font-bold ${
                              isCorrection ? "bg-danger-soft text-danger" : "bg-marker text-marker-ink"
                            }`}
                          >
                            {isCorrection ? "文法錯誤" : "更好的回答"}
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5 font-semibold text-ink-2">
                            <ScenarioIcon id={scenarioId} className="h-3.5 w-3.5 shrink-0 text-accent" />
                            <span className="truncate">{scenario?.label}</span>
                          </span>
                          <span className="hidden text-muted sm:inline">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <Link
                          href={`/practice/${c.sessionId.toString()}`}
                          className="text-xs font-bold text-accent underline-offset-4 hover:underline"
                        >
                          看當時的對話 →
                        </Link>
                      </div>

                      <div className="grid md:grid-cols-2">
                        <div className="border-b border-dashed border-line px-5 py-4 md:border-r md:border-b-0">
                          <p className="text-[11px] font-bold tracking-[0.2em] text-muted">你說的</p>
                          <p lang="en" className="mt-2 leading-relaxed text-ink-2">
                            {isCorrection && c.issues.length > 0 ? (
                              <StrikeIssues text={c.originalText} phrases={c.issues.map((x) => x.original)} />
                            ) : (
                              c.originalText
                            )}
                          </p>
                        </div>
                        <div className={`px-5 py-4 ${isCorrection ? "" : "bg-accent-soft/50"}`}>
                          <p
                            className={`text-[11px] font-bold tracking-[0.2em] ${isCorrection ? "text-danger" : "text-accent"}`}
                          >
                            {isCorrection ? "正確說法" : "更好的說法"}
                          </p>
                          <p
                            lang="en"
                            className={`mt-2 leading-relaxed ${isCorrection ? "text-base" : "font-display text-lg font-semibold"}`}
                          >
                            {isCorrection
                              ? highlight(c.correctedText, c.issues.map((x) => x.corrected))
                              : c.correctedText}
                          </p>
                          <PlayButton src={`/api/corrections/${id}/speech?i=0`} label="聽" className="mt-3" />
                        </div>
                      </div>

                      {isCorrection && c.issues.length > 0 && (
                        <ol className="divide-y divide-line border-t border-line bg-paper/50 text-sm">
                          {c.issues.map((issue, n) => (
                            <li key={n} className="flex gap-3 px-5 py-3">
                              <span className="font-display text-muted italic" aria-hidden>
                                {n + 1}.
                              </span>
                              <div className="min-w-0">
                                <p lang="en">
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
                      {!isCorrection && points.length > 0 && (
                        <ul className="space-y-1.5 border-t border-line bg-paper/50 px-5 py-4 text-sm text-ink-2">
                          {points.map((p, n) => (
                            <li key={n} className="flex gap-2 leading-relaxed">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SpeakerProvider>
          )}
        </div>
      </main>
    </>
  );
}

// 原句裡錯的片段用紅筆劃掉
function StrikeIssues({ text, phrases }: { text: string; phrases: string[] }) {
  const targets = phrases.map((p) => p.trim()).filter(Boolean);
  if (targets.length === 0) return <>{text}</>;
  const escaped = [...targets]
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(?<![A-Za-z])(${escaped.join("|")})(?![A-Za-z])`, "g"));
  return (
    <>
      {parts.map((part, i) =>
        targets.includes(part) ? (
          <span key={i} className="red-pen">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
