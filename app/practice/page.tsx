import type { Metadata } from "next";
import { SCENARIOS } from "@/lib/scenarios";
import { SCENARIO_SAMPLES } from "@/lib/scenario-meta";
import { getCurrentUser, requireUserId } from "@/lib/dal";
import ScenarioPicker from "@/components/ScenarioPicker";
import SiteHeader from "@/components/SiteHeader";
import { eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "選擇情境｜AI 英文家教" };

// 選練習場景（登入後的第一頁）
export default async function PracticeHome() {
  await requireUserId();
  const user = await getCurrentUser();

  // persona 是給 AI 的提示詞，不需要送到前端
  const scenarios = SCENARIOS.map(({ id, label, description, aiRole }) => ({
    id,
    label,
    description,
    aiRole,
    sample: SCENARIO_SAMPLES[id] ?? "",
  }));

  return (
    <>
      <SiteHeader active="/practice" />
      <main className="dot-grid flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <header className="animate-rise mb-10 max-w-2xl">
            <p className={eyebrow}>Choose a scene</p>
            <h1 className="mt-3 font-display text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              {user?.name ? `${user.name}，` : ""}今天想練
              <span className="marker">哪個情境</span>？
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              選一張卡片，AI 會扮演卡片上的角色先開口。打字或按麥克風回答都可以。
            </p>
          </header>

          <ScenarioPicker scenarios={scenarios} />
        </div>
      </main>
    </>
  );
}
