import "server-only";
import * as openai from "@/lib/openai";
import { OPENAI_KEY_HEADER } from "@/lib/byok";
import type { ChatTurn, SpeechAudio } from "@/lib/ai-types";

// 所有 AI 功能的唯一入口。
// BYOK：用使用者自己的 OpenAI API Key（瀏覽器用 x-openai-key 標頭帶來），不讀伺服器環境變數。

export { AIError, type ChatTurn } from "@/lib/ai-types";

// 從 request 標頭取出使用者的金鑰；沒帶就回 null
export function getRequestApiKey(request: Request): string | null {
  return request.headers.get(OPENAI_KEY_HEADER)?.trim() || null;
}

export function missingApiKey() {
  return Response.json(
    { error: "請先到「設定」頁輸入你的 OpenAI API Key" },
    { status: 400 },
  );
}

export function createReply(apiKey: string, instructions: string, input: ChatTurn[] | string) {
  return openai.createReply(apiKey, instructions, input);
}

export function createStructured<T>(
  apiKey: string,
  instructions: string,
  input: string,
  name: string,
  schema: Record<string, unknown>,
) {
  return openai.createStructured<T>(apiKey, instructions, input, name, schema);
}

export function transcribeAudio(apiKey: string, file: File, prompt?: string) {
  return openai.transcribeAudio(apiKey, file, prompt);
}

// style 是語氣描述（例如 "Cheerful and welcoming"）
export function synthesizeSpeech(
  apiKey: string,
  text: string,
  voice: string,
  style: string,
): Promise<SpeechAudio> {
  return openai.synthesizeSpeech(apiKey, text, voice, style);
}
