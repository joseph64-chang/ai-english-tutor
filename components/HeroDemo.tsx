import ScenarioIcon from "@/components/ScenarioIcon";

// 首頁的示範畫面：AI 問 → 你用說的回答 → 紅筆糾錯 → 更好的說法。純展示，沒有互動
export default function HeroDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* 背後疊一張紙，做出筆記本的層次 */}
      <div
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-[2deg] rounded-[28px] border border-line bg-paper-2"
        aria-hidden
      />
      <div className="relative rounded-[28px] border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
              <ScenarioIcon id="ordering" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">點餐</p>
              <p className="text-xs text-muted">AI 扮演 Server</p>
            </div>
          </div>
          <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted">
            自動朗讀 ON
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-4" lang="en">
          <div className="animate-rise max-w-[85%] self-start [animation-delay:150ms]">
            <p className="rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-2.5 text-[15px] leading-relaxed">
              Hi! What can I get for you today?
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-[11px] font-semibold text-muted">
              <Wave className="h-3" bars={5} /> 正在朗讀
            </p>
          </div>

          <div className="animate-rise flex max-w-[85%] flex-col items-end self-end [animation-delay:700ms]">
            <p className="mb-1 pr-1 text-[11px] font-semibold text-muted">你（口說）</p>
            <p className="rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[15px] leading-relaxed text-on-accent">
              I want two coffee, please.
            </p>
          </div>

          <div className="animate-pop self-end rounded-2xl border border-line bg-surface p-4 shadow-card [animation-delay:1300ms] sm:w-[88%]">
            <p className="text-[11px] font-bold tracking-[0.18em] text-danger">糾正文法</p>
            <p className="mt-1.5 text-[15px] leading-relaxed">
              I want two <span className="red-pen text-muted">coffee</span>{" "}
              <span className="marker font-semibold">coffees</span>, please.
            </p>
            <p className="mt-1 text-xs text-muted" lang="zh-Hant">
              兩杯咖啡要用複數 coffees。
            </p>
          </div>

          <div className="animate-pop self-end rounded-2xl border border-dashed border-accent/50 bg-accent-soft/60 p-4 [animation-delay:1900ms] sm:w-[88%]">
            <p className="text-[11px] font-bold tracking-[0.18em] text-accent">更好的回答</p>
            <p className="mt-1.5 text-[15px] font-semibold leading-relaxed">
              Could I get two coffees, please?
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-paper px-3 py-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-danger text-white">
            <MicGlyph />
          </span>
          <Wave className="h-5 flex-1" bars={22} />
          <span className="font-mono text-xs text-muted">0:04</span>
        </div>
      </div>
    </div>
  );
}

// 跳動的聲波條
export function Wave({ className = "h-5", bars = 16 }: { className?: string; bars?: number }) {
  return (
    <span className={`flex items-center gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="animate-wave h-full w-[3px] shrink-0 origin-center rounded-full bg-accent"
          style={{ animationDelay: `${(i * 97) % 900}ms`, opacity: 0.45 + ((i * 37) % 55) / 100 }}
        />
      ))}
    </span>
  );
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    </svg>
  );
}
