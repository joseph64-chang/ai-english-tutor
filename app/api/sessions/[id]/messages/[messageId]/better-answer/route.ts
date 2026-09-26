import { getUserIdFromRequest, unauthorized } from "@/lib/dal";
import { handleFeedbackRequest } from "@/lib/feedback";

// 「更好的回答」：依照場景和 AI 的上一句，示範更自然、更完整的回答方式
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/sessions/[id]/messages/[messageId]/better-answer">,
) {
  const userId = await getUserIdFromRequest();
  if (!userId) return unauthorized();

  const { id, messageId } = await ctx.params;
  return handleFeedbackRequest("suggestion", userId, id, messageId);
}
