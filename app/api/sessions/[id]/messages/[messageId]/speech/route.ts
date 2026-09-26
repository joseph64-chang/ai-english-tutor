import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getUserIdFromRequest, unauthorized } from "@/lib/dal";
import { getScenario } from "@/lib/scenarios";
import { speechResponse } from "@/lib/speech";
import { PracticeSessionModel } from "@/models/PracticeSession";

// 朗讀 AI 的一句回覆（聽力練習），用該場景角色的聲音。回傳音檔
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/sessions/[id]/messages/[messageId]/speech">,
) {
  const userId = await getUserIdFromRequest();
  if (!userId) return unauthorized();

  const { id, messageId } = await ctx.params;
  if (!isValidObjectId(id) || !isValidObjectId(messageId)) {
    return Response.json({ error: "找不到這句話" }, { status: 404 });
  }

  await connectDB();
  // 只找自己的練習，並且只取出需要的那一句，不把整場對話讀出來
  const session = await PracticeSessionModel.findOne(
    { _id: id, userId, "messages._id": messageId },
    { topic: 1, "messages.$": 1 },
  ).lean();
  const message = session?.messages[0];
  if (!session || !message || message.role !== "assistant") {
    return Response.json({ error: "找不到這句話" }, { status: 404 });
  }

  const scenario = getScenario(session.topic);
  return speechResponse(
    message.content,
    scenario?.voices ?? { openai: "alloy", gemini: "Kore" },
    scenario?.voiceStyle ?? "",
  );
}
