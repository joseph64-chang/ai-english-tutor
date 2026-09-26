import "server-only";
import { AIError, ensureOk, type ChatTurn, type SpeechAudio } from "@/lib/ai-types";

// Gemini 版本：直接用 fetch 呼叫 Gemini API（generateContent），不另外裝 SDK。
// 其他程式不要直接 import 這裡，請用 lib/ai.ts（會依設定切換 OpenAI / Gemini）。

// 要換模型改這裡就好
export const CHAT_MODEL = "gemini-3.8-flash";
export const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";
export const TTS_MODEL = "gemini-3.8-flash-tts";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type Part = {
  text?: string;
  thought?: boolean;
  inlineData?: { mimeType: string; data: string };
  audioTranscription?: { text?: string };
};

type GenerateResult = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

// 金鑰讀 GEMINI_API_KEY（也接受 GOOGLE_API_KEY）
export function getGeminiKey() {
  return (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim() || undefined;
}

async function generate(model: string, body: Record<string, unknown>) {
  const key = getGeminiKey();
  if (!key) throw new AIError("伺服器沒有設定 GOOGLE_API_KEY");

  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  await ensureOk(res, `Gemini ${model}`);

  const data = (await res.json()) as GenerateResult;
  const candidate = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || candidate?.finishReason === "SAFETY") {
    throw new AIError("AI 無法回應這句話，請換個說法");
  }
  return candidate?.content?.parts ?? [];
}

// 取出回覆文字（跳過模型的思考內容）
function textOf(parts: Part[]) {
  return parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text)
    .join("")
    .trim();
}

// low 思考就夠用，回應比較快（這個模型不支援 minimal）
const THINKING = { thinkingConfig: { thinkingLevel: "low" } };

// 一般對話：回傳 AI 說的一段文字
export async function createReply(
  instructions: string,
  input: ChatTurn[] | string,
): Promise<string> {
  const contents =
    typeof input === "string"
      ? [{ role: "user", parts: [{ text: input }] }]
      : input.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.content }],
        }));

  const text = textOf(
    await generate(CHAT_MODEL, {
      systemInstruction: { parts: [{ text: instructions }] },
      contents,
      generationConfig: { ...THINKING, maxOutputTokens: 4000 },
    }),
  );
  if (!text) throw new AIError("AI 沒有回傳內容");
  return text;
}

// 結構化輸出：要求 AI 照 JSON Schema 回傳，解析後交給呼叫端
export async function createStructured<T>(
  instructions: string,
  input: string,
  _name: string,
  schema: Record<string, unknown>,
): Promise<T> {
  const text = textOf(
    await generate(CHAT_MODEL, {
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: "user", parts: [{ text: input }] }],
      generationConfig: {
        ...THINKING,
        maxOutputTokens: 8000,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    }),
  );
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AIError("AI 回傳的格式不正確");
  }
}

// 語音轉文字：用專門的 transcribe 模型，結果放在 audioTranscription 裡
export async function transcribeAudio(file: File, prompt?: string): Promise<string> {
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const parts: Part[] = [{ inlineData: { mimeType: file.type, data } }];
  if (prompt) parts.push({ text: `Context: the other person just said "${prompt}"` });

  const result = await generate(TRANSCRIBE_MODEL, {
    contents: [{ role: "user", parts }],
  });
  return result
    .map((p) => p.audioTranscription?.text ?? (p.thought ? "" : p.text ?? ""))
    .join("")
    .trim();
}

// 文字轉語音：回傳 wav。只送要念的句子，語氣描述（style）刻意不用，各場景的差別靠不同聲音。
// 實測（2026-09-26，gemini-3.8-flash-tts）：
//   - 加語氣指示（例如「稍慢、清楚地念」）會念得又慢又誇張，4 秒的句子變 10～20 秒
//   - 用 [括號註記] 寫語氣，有時會被當成內容一起念出來
//   - 這個模型不支援 systemInstruction
export async function synthesizeSpeech(text: string, voice: string): Promise<SpeechAudio> {
  const parts = await generate(TTS_MODEL, {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });

  const audio = parts.find((p) => p.inlineData)?.inlineData;
  if (!audio) throw new AIError("AI 沒有回傳語音");
  return {
    body: new Uint8Array(Buffer.from(audio.data, "base64")),
    contentType: audio.mimeType.startsWith("audio/wav") ? "audio/wav" : audio.mimeType,
  };
}
