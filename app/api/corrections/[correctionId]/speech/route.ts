import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getUserIdFromRequest, unauthorized } from "@/lib/dal";
import { COACH_STYLE, COACH_VOICES, speechResponse } from "@/lib/speech";
import { CorrectionModel } from "@/models/Correction";

// 朗讀糾錯後的句子或更好的回答，讓使用者聽正確說法、跟著念。
// ?i=0（預設）是主要句子，?i=1、?i=2 是「也可以這樣說」的其他講法。回傳音檔
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/corrections/[correctionId]/speech">,
) {
  const userId = await getUserIdFromRequest();
  if (!userId) return unauthorized();

  const { correctionId } = await ctx.params;
  if (!isValidObjectId(correctionId)) {
    return Response.json({ error: "找不到這則建議" }, { status: 404 });
  }

  await connectDB();
  // 只找自己的建議
  const correction = await CorrectionModel.findOne(
    { _id: correctionId, userId },
    { correctedText: 1, alternatives: 1 },
  ).lean();
  if (!correction) {
    return Response.json({ error: "找不到這則建議" }, { status: 404 });
  }

  const i = Number(new URL(request.url).searchParams.get("i") ?? 0);
  const text = i === 0 ? correction.correctedText : correction.alternatives[i - 1];
  if (!Number.isInteger(i) || !text) {
    return Response.json({ error: "找不到這句話" }, { status: 404 });
  }

  return speechResponse(text, COACH_VOICES, COACH_STYLE);
}
