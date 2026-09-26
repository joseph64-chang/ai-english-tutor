import "server-only";
import { AIError, ensureOk, type ChatTurn, type SpeechAudio } from "@/lib/ai-types";

// OpenAI 版本：直接用 fetch 呼叫 OpenAI API（不另外裝 SDK）。
// 其他程式不要直接 import 這裡，請用 lib/ai.ts（會依設定切換 OpenAI / Gemini）。

// 要換模型改這裡就好
export const CHAT_MODEL = "gpt-5.4-mini";
export const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
export const TTS_MODEL = "gpt-4o-mini-tts";

type ResponsesResult = {
  output?: {
    type: string;
    content?: { type: string; text?: string }[];
  }[];
};

// 金鑰讀 OPENAI_API_KEY（也接受 OPEN_AI_API_KEY 這個寫法）
export function getOpenAIKey() {
  return (process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_API_KEY)?.trim() || undefined;
}

function requireKey() {
  const key = getOpenAIKey();
  if (!key) throw new AIError("伺服器沒有設定 OPENAI_API_KEY");
  return key;
}

// 一般對話：回傳 AI 說的一段文字
export function createReply(
  instructions: string,
  input: ChatTurn[] | string,
): Promise<string> {
  return callResponses({ instructions, input });
}

// 結構化輸出：要求 AI 照 JSON Schema 回傳，解析後交給呼叫端
export async function createStructured<T>(
  instructions: string,
  input: string,
  name: string,
  schema: Record<string, unknown>,
): Promise<T> {
  const text = await callResponses({
    instructions,
    input,
    text: { format: { type: "json_schema", name, schema, strict: true } },
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AIError("AI 回傳的格式不正確");
  }
}

// 語音轉文字。prompt 放對話上下文，可以提高辨識準確度
export async function transcribeAudio(file: File, prompt?: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("model", TRANSCRIBE_MODEL);
  form.append("language", "en");
  form.append("response_format", "json");
  if (prompt) form.append("prompt", prompt);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireKey()}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  await ensureOk(res, "OpenAI transcribe");
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

// 給英文學習者聽的要求：清楚、稍慢，方便跟讀
const LEARNER_PACE =
  "Speak natural American English clearly, at a slightly slower than normal pace so an English learner can follow and repeat.";

// 文字轉語音：回傳 mp3 串流，route 直接轉給瀏覽器播放
export async function synthesizeSpeech(
  text: string,
  voice: string,
  style: string,
): Promise<SpeechAudio> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireKey()}`,
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice,
      input: text,
      instructions: `${style} ${LEARNER_PACE}`,
      response_format: "mp3",
    }),
    signal: AbortSignal.timeout(60_000),
  });
  await ensureOk(res, "OpenAI speech");
  if (!res.body) throw new AIError("AI 沒有回傳語音");
  return { body: res.body, contentType: "audio/mpeg" };
}

async function callResponses(params: Record<string, unknown>): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      reasoning: { effort: "low" },
      max_output_tokens: 2000,
      ...params,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  await ensureOk(res, "OpenAI responses");

  const data = (await res.json()) as ResponsesResult;
  // Responses API 的輸出可能包含 reasoning 等項目，只取 message 裡的文字
  const text = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((c) => c.type === "output_text" && c.text)
    .map((c) => c.text)
    .join("")
    .trim();

  if (!text) {
    throw new AIError("AI 沒有回傳內容");
  }
  return text;
}
