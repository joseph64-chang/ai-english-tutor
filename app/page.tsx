import Link from "next/link";
import { getSession } from "@/lib/session";
import { SCENARIOS } from "@/lib/scenarios";
import { SCENARIO_SAMPLES } from "@/lib/scenario-meta";
import Logo from "@/components/Logo";
import ScenarioIcon from "@/components/ScenarioIcon";
import HeroDemo, { Wave } from "@/components/HeroDemo";
import { buttonDark, buttonPrimary, buttonSecondary, eyebrow } from "@/components/ui";

// 首頁：服務介紹（不用登入就能看）
export default async function LandingPage() {
  // 只看 cookie 決定按鈕文字，不查資料庫
  const loggedIn = Boolean(await getSession());
  const startHref = loggedIn ? "/practice" : "/register";
  const startLabel = loggedIn ? "繼續練習" : "免費開始練習";

  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      {/* ---------- 導覽列 ---------- */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-2 md:flex" aria-label="頁面導覽">
            <a href="#how" className="transition hover:text-accent">怎麼練</a>
            <a href="#features" className="transition hover:text-accent">功能</a>
            <a href="#scenarios" className="transition hover:text-accent">情境</a>
          </nav>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link href="/practice" className={`${buttonPrimary} h-10 px-5 text-sm`}>
                進入練習 →
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden h-10 items-center px-3 text-sm font-semibold text-ink-2 transition hover:text-accent sm:inline-flex">
                  登入
                </Link>
                <Link href="/register" className={`${buttonPrimary} h-10 px-5 text-sm`}>
                  免費開始
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="dot-grid relative border-b border-line">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:py-24">
            <div className="animate-rise">
              <p className={eyebrow}>AI Speaking Partner · 8 個生活情境</p>
              <h1 className="mt-5 font-display text-[44px] leading-[1.12] font-black tracking-tight sm:text-6xl lg:text-7xl">
                英文，
                <br />
                要<span className="marker">說出口</span>
                <br />
                才會進步
              </h1>
              <p className="mt-5 font-display text-xl text-ink-2 italic sm:text-2xl" lang="en">
                Speak up — we&rsquo;ll help with the rest.
              </p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                選一個生活情境，AI 扮演店員、面試官、同事或朋友，陪你一來一往用英文對話。
                說錯了，它用紅筆幫你改；說得不夠好，它示範更道地的說法，還念給你聽。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={startHref} className={`${buttonPrimary} h-13 text-base`}>
                  {startLabel} →
                </Link>
                {!loggedIn && (
                  <Link href="/login" className={`${buttonSecondary} h-13 text-base`}>
                    我已經有帳號
                  </Link>
                )}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {["不用下載，瀏覽器就能練", "打字或開口都可以", "紀錄只有你看得到"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <HeroDemo />
          </div>
        </section>

        {/* ---------- 情境跑馬燈 ---------- */}
        <section id="scenarios" className="scroll-mt-16 overflow-hidden border-b border-line bg-ink py-5 text-paper" aria-label="練習情境">
          <div className="animate-marquee flex w-max gap-3 hover:[animation-play-state:paused]">
            {[...SCENARIOS, ...SCENARIOS].map((s, i) => (
              <div
                key={`${s.id}-${i}`}
                aria-hidden={i >= SCENARIOS.length}
                className="flex shrink-0 items-center gap-3 rounded-full border border-white/15 bg-white/5 py-2 pr-5 pl-2"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-marker text-marker-ink">
                  <ScenarioIcon id={s.id} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-bold">{s.label}</span>
                <span className="font-display text-sm text-paper/70 italic" lang="en">
                  &ldquo;{SCENARIO_SAMPLES[s.id]}&rdquo;
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 怎麼練 ---------- */}
        <section id="how" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <p className={eyebrow}>How it works</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              三個步驟，<br className="sm:hidden" />每天練十分鐘
            </h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  n: "01",
                  title: "選一個情境",
                  body: "點餐、面試、機場、會議……AI 會扮演對應的角色，先開口問你第一個問題。",
                },
                {
                  n: "02",
                  title: "打字，或直接開口說",
                  body: "按下麥克風用說的，AI 聽懂後幫你轉成文字。它的回覆也會念給你聽，順便練聽力。",
                },
                {
                  n: "03",
                  title: "看紅筆，聽示範",
                  body: "每句話都能一鍵糾正文法、看更好的說法，再跟著標準發音念一遍。",
                },
              ].map((step) => (
                <li key={step.n} className="relative border-t-2 border-ink pt-6">
                  <span className="font-display text-6xl leading-none font-light text-accent italic" aria-hidden>
                    {step.n}
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- 功能 ---------- */}
        <section id="features" className="scroll-mt-16 border-b border-line bg-paper-2/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <p className={eyebrow}>Features</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              像有個家教，<br className="sm:hidden" />坐在你旁邊
            </h2>

            <div className="mt-14 grid gap-4 md:grid-cols-6">
              {/* 會聽也會說 */}
              <article className="flex flex-col justify-between gap-8 overflow-hidden rounded-3xl bg-accent p-7 text-on-accent md:col-span-4 sm:p-9">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] opacity-80">SPEAKING × LISTENING</p>
                  <h3 className="mt-3 font-display text-3xl font-black sm:text-4xl">會聽，也會說</h3>
                  <p className="mt-3 max-w-md leading-relaxed opacity-90">
                    用麥克風回答，AI 聽得懂你的口音；每句回覆都能朗讀，開啟「聽力模式」先藏起文字，只用耳朵聽。
                  </p>
                </div>
                <div className="flex items-end gap-[5px] opacity-90" aria-hidden>
                  {Array.from({ length: 48 }, (_, i) => (
                    <span
                      key={i}
                      className="animate-wave w-1.5 shrink-0 origin-bottom rounded-full bg-on-accent"
                      style={{ height: `${14 + ((i * 53) % 46)}px`, animationDelay: `${(i * 83) % 1100}ms` }}
                    />
                  ))}
                </div>
              </article>

              {/* 紅筆糾錯 */}
              <article className="rounded-3xl border border-line bg-surface p-7 md:col-span-2">
                <p className="text-xs font-bold tracking-[0.2em] text-danger">GRAMMAR</p>
                <h3 className="mt-3 text-2xl font-bold">紅筆糾正文法</h3>
                <p className="mt-6 font-display text-xl leading-relaxed" lang="en">
                  She <span className="red-pen text-muted">go</span> <span className="marker font-semibold">goes</span> to work by bus.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  逐一標出錯在哪、為什麼錯，用中文解釋給你聽。
                </p>
              </article>

              {/* 更好的回答 */}
              <article className="rounded-3xl border border-line bg-surface p-7 md:col-span-3">
                <p className="text-xs font-bold tracking-[0.2em] text-accent">BETTER ANSWER</p>
                <h3 className="mt-3 text-2xl font-bold">示範更道地的說法</h3>
                <div className="mt-6 space-y-3" lang="en">
                  <p className="text-muted">
                    <span className="mr-2 rounded-md bg-paper-2 px-1.5 py-0.5 text-[11px] font-bold text-muted" lang="zh-Hant">你說</span>
                    I like solve problem.
                  </p>
                  <p className="font-semibold">
                    <span className="mr-2 rounded-md bg-marker px-1.5 py-0.5 text-[11px] font-bold text-marker-ink" lang="zh-Hant">更好</span>
                    I really enjoy solving tricky problems.
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  依對方的問題給完整的回答，再附兩種不同語氣的講法，每句都能聽發音。
                </p>
              </article>

              {/* 8 個情境 */}
              <article className="rounded-3xl border border-line bg-surface p-7 md:col-span-3">
                <p className="text-xs font-bold tracking-[0.2em] text-accent">SCENARIOS</p>
                <h3 className="mt-3 text-2xl font-bold">8 個真實生活情境</h3>
                <ul className="mt-6 grid grid-cols-4 gap-3">
                  {SCENARIOS.map((s) => (
                    <li key={s.id} className="flex flex-col items-center gap-2 rounded-2xl bg-paper px-1 py-3 text-center">
                      <ScenarioIcon id={s.id} className="h-5 w-5 text-accent" />
                      <span className="text-xs font-semibold">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </article>

              {/* 紀錄 */}
              <article className="rounded-3xl border border-line bg-surface p-7 md:col-span-3">
                <p className="text-xs font-bold tracking-[0.2em] text-accent">REVIEW</p>
                <h3 className="mt-3 text-2xl font-bold">練過的都幫你記著</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  每一場對話、每一則糾錯都存在你的帳號裡。「糾錯紀錄」把常犯的錯集中起來，隨時回來複習、跟著念。
                </p>
              </article>

              {/* 隱私 */}
              <article className="rounded-3xl border border-ink bg-ink p-7 text-paper md:col-span-3">
                <p className="text-xs font-bold tracking-[0.2em] text-marker">PRIVATE</p>
                <h3 className="mt-3 text-2xl font-bold">只有你看得到</h3>
                <p className="mt-3 leading-relaxed text-paper/75">
                  說錯不丟臉。你的對話和糾錯只屬於你的帳號，其他人看不到，放心大膽地開口。
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- 最後的行動呼籲 ---------- */}
        <section className="dot-grid">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-28">
            <Wave className="h-8" bars={9} />
            <h2 className="mt-8 font-display text-4xl leading-tight font-black tracking-tight sm:text-6xl">
              今天，先<span className="marker">說一句</span>就好
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted">
              不用準備，不用緊張。選個情境，AI 會先開口。
            </p>
            <Link href={startHref} className={`${buttonDark} mt-10 h-14 px-8 text-base`}>
              {startLabel} →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
          <Logo />
          <p>© 2026 AI 英文家教 · 開口說，就會進步。</p>
        </div>
      </footer>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
