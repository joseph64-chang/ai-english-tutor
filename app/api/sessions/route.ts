import { connectDB } from "@/lib/mongodb";
import { getUserIdFromRequest, unauthorized } from "@/lib/dal";
import { getScenario } from "@/lib/scenarios";
import { toSessionDTO } from "@/lib/session-dto";
import { createOpeningLine } from "@/lib/tutor";
import { AIError, getRequestApiKey, missingApiKey } from "@/lib/ai";
import { PracticeSessionModel } from "@/models/PracticeSession";

// 開始一場練習：選場景 → AI 先說第一句 → 存進資料庫 → 回傳整場練習
export async function POST(request: Request) {
  const userId = await getUserIdFromRequest();
  if (!userId) return unauthorized();

  const apiKey = getRequestApiKey(request);
  if (!apiKey) return missingApiKey();

  const body = await request.json().catch(() => null);
  const scenario = getScenario(String(body?.scenarioId ?? ""));
  if (!scenario) {
    return Response.json({ error: "找不到這個練習場景" }, { status: 400 });
  }

  let opening: string;
  try {
    opening = await createOpeningLine(apiKey, scenario);
  } catch (err) {
    const message = err instanceof AIError ? err.message : "AI 服務發生錯誤";
    return Response.json({ error: message }, { status: 502 });
  }

  await connectDB();
  const session = await PracticeSessionModel.create({
    userId,
    title: scenario.label,
    topic: scenario.id,
    messages: [{ role: "assistant", content: opening }],
  });

  return Response.json({ session: toSessionDTO(session) }, { status: 201 });
}
