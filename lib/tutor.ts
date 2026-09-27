import type { Scenario } from "@/lib/scenarios";
import { createReply, type ChatTurn } from "@/lib/ai";

// 送給 AI 的歷史訊息上限，避免對話太長時 token 爆掉
const MAX_HISTORY = 30;

// 使用者一次輸入的字數上限
export const MAX_MESSAGE_LENGTH = 500;

function buildInstructions(scenario: Scenario) {
  return `You are role-playing with an English learner (a native Mandarin speaker from Taiwan) so they can practice spoken English.

Your role: ${scenario.aiRole}
Scenario: ${scenario.persona}

Rules:
- Stay in character the whole time. Never say you are an AI or a tutor.
- Reply ONLY in English, in 1 to 3 short sentences, like real spoken conversation.
- End almost every reply with one question or prompt so the learner keeps talking.
- Use clear, natural English at an intermediate level. Avoid rare idioms unless they fit the role.
- Do not correct the learner's grammar or explain English; just respond naturally to what they meant.
- If the learner writes in Chinese or seems stuck, reply in simple English and gently encourage them to try in English.
- No emojis, no markdown, no stage directions.`;
}

// 開場：AI 先用角色身分說第一句，並問一個問題
export function createOpeningLine(apiKey: string, scenario: Scenario) {
  return createReply(
    apiKey,
    buildInstructions(scenario),
    "Start the conversation now with your first line in character. Greet the learner and ask them one question.",
  );
}

// 依照目前的完整對話，產生 AI 的下一句
export function createTutorReply(apiKey: string, scenario: Scenario, history: ChatTurn[]) {
  return createReply(apiKey, buildInstructions(scenario), history.slice(-MAX_HISTORY));
}
