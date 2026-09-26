import { getUserIdFromRequest, unauthorized } from "@/lib/dal";
import { handleFeedbackRequest } from "@/lib/feedback";

// 「糾正文法」：檢查使用者這句話的文法、拼字、標點，回傳改正後的句子與逐項說明
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/sessions/[id]/messages/[messageId]/grammar">,
) {
  const userId = await getUserIdFromRequest();
  if (!userId) return unauthorized();

  const { id, messageId } = await ctx.params;
  return handleFeedbackRequest("correction", userId, id, messageId);
}
