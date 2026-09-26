import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getScenario, type Scenario } from "@/lib/scenarios";
import { AIError, createStructured } from "@/lib/ai";
import { PracticeSessionModel } from "@/models/PracticeSession";
import {
  CorrectionModel,
  type Correction,
  type CorrectionCategory,
  type CorrectionIssue,
  type CorrectionKind,
  type Severity,
} from "@/models/Correction";

// 使用者按下「糾正文法」「更好的回答」時的共用邏輯：
// 找到那句話 → 已經有結果就直接回傳 → 沒有就問 OpenAI → 存進 corrections → 回傳給前端

export type FeedbackDTO = {
  id: string;
  messageId: string;
  kind: CorrectionKind;
  originalText: string;
  correctedText: string;
  explanation: string;
  issues: CorrectionIssue[];
  alternatives: string[];
};

export function toFeedbackDTO(c: Correction): FeedbackDTO {
  return {
    id: c._id.toString(),
    messageId: c.messageId.toString(),
    kind: c.kind,
    originalText: c.originalText,
    correctedText: c.correctedText,
    explanation: c.explanation,
    issues: c.issues.map(({ original, corrected, category, explanation }) => ({
      original,
      corrected,
      category,
      explanation,
    })),
    alternatives: c.alternatives,
  };
}

// ---------- 糾正文法 ----------

const ISSUE_CATEGORIES = [
  "grammar",
  "spelling",
  "punctuation",
  "word-choice",
  "vocabulary",
  "other",
] as const;

const GRAMMAR_SCHEMA = {
  type: "object",
  properties: {
    correctedSentence: { type: "string" },
    summary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          category: { type: "string", enum: ISSUE_CATEGORIES },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "category", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["correctedSentence", "summary", "issues"],
  additionalProperties: false,
};

type GrammarResult = {
  correctedSentence: string;
  summary: string;
  issues: CorrectionIssue[];
};

const GRAMMAR_INSTRUCTIONS = `You are a patient English teacher for learners from Taiwan. Check the learner's sentence for mistakes in grammar, spelling, punctuation and wrong word usage.

Rules:
- Make the smallest edits needed. Keep the learner's meaning, words and tone.
- Normal spoken style is NOT a mistake (contractions, starting with "And", short answers like "Medium, please.").
- Do not rewrite for style or make it sound fancier. Only fix real mistakes.
- correctedSentence: the full sentence with only the mistakes fixed. If there are no mistakes, return the original sentence unchanged and an empty issues array.
- issues: one item per mistake. "original" is the wrong part copied exactly from the learner's sentence, "corrected" is the fixed part.
- explanation and summary: in Traditional Chinese used in Taiwan (台灣繁體中文), short and friendly. Keep English words in English.
- summary: one sentence overall comment. If there are no mistakes, say the sentence is correct and briefly praise it.
- Plain text only: no markdown, no asterisks or backticks. Quote English words with 「」 when needed.
- If the learner wrote in Chinese, translate it into natural English as correctedSentence, return no issues, and say in summary that this is how to say it in English.`;

// ---------- 更好的回答 ----------

const BETTER_ANSWER_SCHEMA = {
  type: "object",
  properties: {
    betterAnswer: { type: "string" },
    explanation: { type: "string" },
    alternatives: { type: "array", items: { type: "string" } },
  },
  required: ["betterAnswer", "explanation", "alternatives"],
  additionalProperties: false,
};

type BetterAnswerResult = {
  betterAnswer: string;
  explanation: string;
  alternatives: string[];
};

const BETTER_ANSWER_INSTRUCTIONS = `You are an English speaking coach for learners from Taiwan. The learner is practicing a role-play conversation. Show them how a fluent speaker would answer the other person's last line more naturally and completely.

Rules:
- Keep the learner's intended meaning and facts. Do not change what they wanted to say.
- Do not invent specific facts the learner never mentioned (names, companies, teams, numbers, places, experiences). To make the answer more complete, you may add at most one short general reason or feeling.
- betterAnswer: 1 to 3 sentences of natural spoken English that fits the scenario and the other person's line. Slightly above the learner's level, not overly formal.
- explanation: in Traditional Chinese used in Taiwan (台灣繁體中文), 2 to 4 short points on what makes it better (e.g. more polite, more complete, more natural phrasing). Put each point on its own line starting with "• ". Keep English phrases in English.
- alternatives: exactly 2 other natural ways to answer, with a different tone (for example one more casual, one more polite).
- If the learner wrote in Chinese, give the English version of what they meant.
- Plain text only: no markdown, no asterisks or backticks.`;

function contextFor(scenario: Scenario, aiLine: string | undefined, sentence: string) {
  return [
    `Scenario: ${scenario.label} — ${scenario.persona}`,
    `The other person (${scenario.aiRole}) said: ${aiLine ?? "(nothing yet)"}`,
    `The learner replied: ${sentence}`,
  ].join("\n");
}

function severityFor(issueCount: number): Severity {
  if (issueCount >= 3) return "major";
  if (issueCount >= 1) return "moderate";
  return "minor";
}

async function generate(
  kind: CorrectionKind,
  scenario: Scenario,
  aiLine: string | undefined,
  sentence: string,
) {
  const input = contextFor(scenario, aiLine, sentence);

  if (kind === "correction") {
    const r = await createStructured<GrammarResult>(
      GRAMMAR_INSTRUCTIONS,
      input,
      "grammar_check",
      GRAMMAR_SCHEMA,
    );
    return {
      category: (r.issues[0]?.category ?? "grammar") as CorrectionCategory,
      severity: severityFor(r.issues.length),
      correctedText: r.correctedSentence.trim() || sentence,
      explanation: r.summary,
      issues: r.issues,
      alternatives: [],
    };
  }

  const r = await createStructured<BetterAnswerResult>(
    BETTER_ANSWER_INSTRUCTIONS,
    input,
    "better_answer",
    BETTER_ANSWER_SCHEMA,
  );
  return {
    category: "naturalness" as const,
    severity: "minor" as const,
    correctedText: r.betterAnswer.trim(),
    explanation: r.explanation,
    issues: [],
    alternatives: r.alternatives.map((a) => a.trim()).filter(Boolean),
  };
}

// 給兩個 API route 共用，回傳要送給前端的 Response。
// userId 由 route 從登入 session 取得；所有查詢都帶 userId，只能操作自己的練習
export async function handleFeedbackRequest(
  kind: CorrectionKind,
  userId: string,
  sessionId: string,
  messageId: string,
): Promise<Response> {
  if (!isValidObjectId(sessionId) || !isValidObjectId(messageId)) {
    return Response.json({ error: "找不到這句話" }, { status: 404 });
  }

  await connectDB();

  // 同一句話已經問過就直接回傳，不重複花 OpenAI 的錢
  const existing = await CorrectionModel.findOne({ userId, sessionId, messageId, kind }).lean();
  if (existing) {
    return Response.json({ feedback: toFeedbackDTO(existing) });
  }

  const session = await PracticeSessionModel.findOne({ _id: sessionId, userId }).lean();
  const index = session?.messages.findIndex((m) => m._id.toString() === messageId) ?? -1;
  const message = index >= 0 ? session!.messages[index] : undefined;
  if (!session || !message || message.role !== "user") {
    return Response.json({ error: "找不到這句話" }, { status: 404 });
  }
  const scenario = getScenario(session.topic);
  if (!scenario) {
    return Response.json({ error: "找不到這個練習場景" }, { status: 400 });
  }

  // 使用者這句話是在回答 AI 的哪一句
  const aiLine = session.messages
    .slice(0, index)
    .findLast((m) => m.role === "assistant")?.content;

  let result: Awaited<ReturnType<typeof generate>>;
  try {
    result = await generate(kind, scenario, aiLine, message.content);
  } catch (err) {
    const msg = err instanceof AIError ? err.message : "AI 服務發生錯誤";
    if (!(err instanceof AIError)) console.error(err);
    return Response.json({ error: msg }, { status: 502 });
  }

  try {
    const created = await CorrectionModel.create({
      sessionId,
      messageId,
      userId,
      kind,
      originalText: message.content,
      ...result,
    });
    await PracticeSessionModel.updateOne(
      { _id: sessionId, userId },
      { $inc: { correctionCount: 1 } },
    );
    return Response.json({ feedback: toFeedbackDTO(created) }, { status: 201 });
  } catch (err) {
    // 同時送出兩次時，唯一索引會擋下第二筆，回傳先存好的那筆就好
    if ((err as { code?: number }).code === 11000) {
      const saved = await CorrectionModel.findOne({ userId, sessionId, messageId, kind }).lean();
      if (saved) return Response.json({ feedback: toFeedbackDTO(saved) });
    }
    throw err;
  }
}
