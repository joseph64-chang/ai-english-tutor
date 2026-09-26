import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { requireUserId } from "@/lib/dal";
import { getScenario } from "@/lib/scenarios";
import { formatDateTime } from "@/lib/format";
import { PracticeSessionModel } from "@/models/PracticeSession";
import SiteHeader from "@/components/SiteHeader";
import ScenarioIcon from "@/components/ScenarioIcon";
import { buttonPrimary, eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "練習紀錄｜AI 英文家教" };

// 一次最多列出的練習數量
const LIMIT = 100;

type Row = {
  _id: { toString(): string };
  topic: string;
  title: string;
  startedAt: Date;
  correctionCount: number;
  turns: number;
  last?: { role: string; content: string };
};

export default async function HistoryPage() {
  const userId = await requireUserId();
  await connectDB();

  // 只查自己的練習；不把整場對話讀出來，只算回合數、取最後一句當預覽
  const rows = await PracticeSessionModel.aggregate<Row>([
    { $match: { userId } },
    { $sort: { startedAt: -1 } },
    { $limit: LIMIT },
    {
      $project: {
        topic: 1,
        title: 1,
        startedAt: 1,
        correctionCount: 1,
        turns: {
          $size: {
            $filter: { input: "$messages", cond: { $eq: ["$$this.role", "user"] } },
          },
        },
        last: { $arrayElemAt: ["$messages", -1] },
      },
    },
  ]);

  // 頁首的小統計（用上面已經查到的資料算，不另外查詢）
  const totalTurns = rows.reduce((sum, r) => sum + r.turns, 0);
  const totalFeedback = rows.reduce((sum, r) => sum + r.correctionCount, 0);

  return (
    <>
      <SiteHeader active="/history" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <header className="animate-rise flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={eyebrow}>Your practice</p>
              <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">練習紀錄</h1>
              <p className="mt-3 max-w-lg leading-relaxed text-muted">
                點進任何一場，看完整對話和當時的糾錯，也能接著繼續練下去。
              </p>
            </div>
            {rows.length > 0 && (
              <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface">
                {[
                  { label: "場練習", value: rows.length },
                  { label: "句英文", value: totalTurns },
                  { label: "則回饋", value: totalFeedback },
                ].map((s) => (
                  <div key={s.label} className="px-4 py-3 text-center sm:px-6">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-3xl font-black text-ink">{s.value}</dd>
                    <dd className="text-xs font-semibold text-muted">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </header>

          {rows.length === 0 ? (
            <div className="dot-grid mt-12 flex flex-col items-center rounded-3xl border-2 border-dashed border-line-strong px-6 py-16 text-center">
              <p className="font-display text-2xl font-black">還沒有練習紀錄</p>
              <p className="mt-2 text-muted">選一個情境，說出你的第一句英文吧。</p>
              <Link href="/practice" className={`${buttonPrimary} mt-8 h-12`}>
                開始第一場練習 →
              </Link>
            </div>
          ) : (
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {rows.map((r, i) => {
                const scenario = getScenario(r.topic);
                return (
                  <li key={r._id.toString()} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                    <Link
                      href={`/practice/${r._id.toString()}`}
                      className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-card sm:p-6"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent transition group-hover:bg-marker group-hover:text-marker-ink">
                          <ScenarioIcon id={r.topic} />
                        </span>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="truncate text-lg font-black">{scenario?.label ?? r.title}</p>
                          <p className="truncate text-xs font-semibold tracking-wide text-muted">
                            {scenario?.aiRole} · {formatDateTime(r.startedAt)}
                          </p>
                        </div>
                        <span className="text-xl text-line-strong transition group-hover:translate-x-1 group-hover:text-ink" aria-hidden>
                          →
                        </span>
                      </div>

                      {r.last && (
                        <p lang="en" className="mt-4 line-clamp-2 flex-1 font-display text-[15px] leading-relaxed text-ink-2 italic">
                          <span className="not-italic font-sans text-xs font-bold text-muted" lang="zh-Hant">
                            {r.last.role === "user" ? "你：" : `${scenario?.aiRole ?? "AI"}：`}
                          </span>
                          &ldquo;{r.last.content}&rdquo;
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-dashed border-line pt-4 text-xs font-semibold">
                        <span className="rounded-full bg-paper-2 px-2.5 py-1 text-ink-2">你說了 {r.turns} 句</span>
                        <span
                          className={`rounded-full px-2.5 py-1 ${
                            r.correctionCount > 0 ? "bg-marker text-marker-ink" : "bg-paper-2 text-muted"
                          }`}
                        >
                          回饋 {r.correctionCount} 則
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {rows.length === LIMIT && (
            <p className="mt-8 text-center text-xs text-muted">只顯示最近 {LIMIT} 場練習</p>
          )}
        </div>
      </main>
    </>
  );
}
