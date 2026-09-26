import "server-only";
import * as openai from "@/lib/openai";
import * as gemini from "@/lib/gemini";
import type { ChatTurn, SpeechAudio, Voices } from "@/lib/ai-types";

// 所有 AI 功能的唯一入口：依 .env.local 的 AI_PROVIDER 決定用 OpenAI 還是 Gemini。
//   AI_PROVIDER=openai  → 讀 OPENAI_API_KEY
//   AI_PROVIDER=gemini  → 讀 GOOGLE_API_KEY（或 GEMINI_API_KEY）
// 沒設定 AI_PROVIDER 時，有 OpenAI 金鑰就用 OpenAI，否則用 Gemini。

export { AIError, type ChatTurn, type Voices } from "@/lib/ai-types";

export type Provider = "openai" | "gemini";

export function getProvider(): Provider {
  const setting = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (setting === "openai" || setting === "gemini") return setting;
  if (setting) console.warn(`AI_PROVIDER=${setting} 不認得，改用自動判斷（openai 或 gemini）`);
  return openai.getOpenAIKey() || !gemini.getGeminiKey() ? "openai" : "gemini";
}

function impl() {
  return getProvider() === "gemini" ? gemini : openai;
}

export function createReply(instructions: string, input: ChatTurn[] | string) {
  return impl().createReply(instructions, input);
}

export function createStructured<T>(
  instructions: string,
  input: string,
  name: string,
  schema: Record<string, unknown>,
) {
  return impl().createStructured<T>(instructions, input, name, schema);
}

export function transcribeAudio(file: File, prompt?: string) {
  return impl().transcribeAudio(file, prompt);
}

// style 是語氣描述（例如 "Cheerful and welcoming"）；兩家下指令的方式不同，各自在實作裡組成提示
export function synthesizeSpeech(
  text: string,
  voices: Voices,
  style: string,
): Promise<SpeechAudio> {
  const provider = getProvider();
  return impl().synthesizeSpeech(text, voices[provider], style);
}
