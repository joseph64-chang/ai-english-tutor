import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUserId } from "@/lib/dal";
import { getScenario } from "@/lib/scenarios";
import { toSessionDTO } from "@/lib/session-dto";
import { toFeedbackDTO } from "@/lib/feedback";
import { MAX_MESSAGE_LENGTH } from "@/lib/tutor";
import { PracticeSessionModel } from "@/models/PracticeSession";
import { CorrectionModel } from "@/models/Correction";
import ChatRoom from "@/components/ChatRoom";

export default async function PracticePage(props: PageProps<"/practice/[id]">) {
  const userId = await requireUserId();
  const { id } = await props.params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  // 只找自己的練習；別人的練習一律顯示 404，不透露它存在
  const session = await PracticeSessionModel.findOne({ _id: id, userId }).lean();
  if (!session) notFound();

  const scenario = getScenario(session.topic);
  if (!scenario) notFound();

  // 之前按過的糾錯/建議一起帶出來，重新整理或之後回來看都還在
  const corrections = await CorrectionModel.find({ sessionId: id, userId })
    .sort({ createdAt: 1 })
    .lean();

  return (
    <ChatRoom
      session={toSessionDTO(session)}
      initialFeedback={corrections.map(toFeedbackDTO)}
      scenarioLabel={scenario.label}
      aiRole={scenario.aiRole}
      maxLength={MAX_MESSAGE_LENGTH}
    />
  );
}
