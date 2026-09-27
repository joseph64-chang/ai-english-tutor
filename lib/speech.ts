import { AIError, getRequestApiKey, missingApiKey, synthesizeSpeech } from "@/lib/ai";

// 糾錯／更好的回答示範發音用的聲音與語氣
export const COACH_VOICE = "nova";
export const COACH_STYLE = "Warm and clear, like a friendly English teacher.";

// 用使用者的金鑰呼叫 AI 產生語音（mp3），直接回傳給瀏覽器。
// 同一句話的語音內容固定，讓瀏覽器快取一天，重播不必再花錢產生。
export async function speechResponse(
  request: Request,
  text: string,
  voice: string,
  style: string,
): Promise<Response> {
  const apiKey = getRequestApiKey(request);
  if (!apiKey) return missingApiKey();

  try {
    const audio = await synthesizeSpeech(apiKey, text, voice, style);
    return new Response(audio.body, {
      headers: {
        "Content-Type": audio.contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof AIError ? err.message : "語音產生失敗";
    if (!(err instanceof AIError)) console.error(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
