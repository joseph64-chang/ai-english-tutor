import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getUserIdFromRequest, unauthorized } from "@/lib/dal";
import { getScenario } from "@/lib/scenarios";
import { toMessageDTO } from "@/lib/session-dto";
import { createTutorReply, MAX_MESSAGE_LENGTH } from "@/lib/tutor";
import { AIError, getRequestApiKey, missingApiKey } from "@/lib/ai";
import { PracticeSessionModel } from "@/models/PracticeSession";

// 使用者送出一句英文 → AI 用場景人設回應 → 兩句一起存進這場練習 → 回傳給前端
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/sessions/[id]/messages">,
) {
  const userId = await getUserIdFromRequest();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }

  const apiKey = getRequestApiKey(request);
  if (!apiKey) return missingApiKey();

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return Response.json({ error: "請輸入內容" }, { status: 400 });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `一次最多 ${MAX_MESSAGE_LENGTH} 個字` },
      { status: 400 },
    );
  }
  // 這句是用說的（語音辨識）還是打字的
  const inputType = body?.inputType === "voice" ? "voice" : "text";

  await connectDB();
  // 只找自己的練習；別人的練習 id 一律當作不存在
  const session = await PracticeSessionModel.findOne({ _id: id, userId });
  if (!session) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }
  if (session.status !== "active") {
    return Response.json({ error: "這場練習已經結束了" }, { status: 409 });
  }
  const scenario = getScenario(session.topic);
  if (!scenario) {
    return Response.json({ error: "找不到這個練習場景" }, { status: 400 });
  }

  const history = [
    ...session.messages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content },
  ];

  let reply: string;
  try {
    reply = await createTutorReply(apiKey, scenario, history);
  } catch (err) {
    // AI 失敗就兩句都不存，前端可以直接重送同一句
    const message = err instanceof AIError ? err.message : "AI 服務發生錯誤";
    return Response.json({ error: message }, { status: 502 });
  }

  // 用 $push 一次加入兩句，不會蓋掉同時間其他寫入
  const updated = await PracticeSessionModel.findOneAndUpdate(
    { _id: id, userId },
    {
      $push: {
        messages: {
          $each: [
            { role: "user", content, inputType },
            { role: "assistant", content: reply },
          ],
        },
      },
    },
    { returnDocument: "after", projection: { messages: { $slice: -2 } } },
  );
  if (!updated) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }

  const [userMessage, assistantMessage] = updated.messages.map(toMessageDTO);
  return Response.json({ userMessage, assistantMessage });
}
