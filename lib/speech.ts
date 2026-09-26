import { AIError, synthesizeSpeech, type Voices } from "@/lib/ai";

// 糾錯／更好的回答示範發音用的聲音
export const COACH_VOICES: Voices = { openai: "nova", gemini: "Iapetus" };
// 語氣描述目前只有 OpenAI 會用（Gemini 只靠聲音，原因見 lib/gemini.ts）
export const COACH_STYLE = "Warm and clear, like a friendly English teacher.";

// 呼叫 AI 產生語音，直接回傳給瀏覽器（OpenAI 是 mp3、Gemini 是 wav）。
// 同一句話的語音內容固定，讓瀏覽器快取一天，重播不必再花錢產生。
export async function speechResponse(
  text: string,
  voices: Voices,
  style: string,
): Promise<Response> {
  try {
    const audio = await synthesizeSpeech(text, voices, style);
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
