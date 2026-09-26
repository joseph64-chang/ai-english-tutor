import { AIError, transcribeAudio } from "@/lib/ai";
import { getUserIdFromRequest, unauthorized } from "@/lib/dal";

// 錄音上限：一句話 60 秒的 webm/opus 大約只有幾百 KB，10MB 綽綽有餘
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// 瀏覽器錄音的格式 → 副檔名（Chrome/Edge 是 webm，Safari 是 mp4）
const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
};

// 口說輸入：前端上傳一段錄音 → AI（OpenAI 或 Gemini）轉成英文文字 → 回傳 { text }
export async function POST(request: Request) {
  // 語音辨識要花 OpenAI 的錢，只給登入的使用者用
  if (!(await getUserIdFromRequest())) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "請用 multipart/form-data 上傳錄音" }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "沒有收到錄音" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "錄音太長了，請分成短一點的句子" }, { status: 413 });
  }

  const mime = audio.type.split(";")[0].trim();
  const ext = EXTENSIONS[mime];
  if (!ext) {
    return Response.json({ error: "不支援這種錄音格式" }, { status: 400 });
  }

  // AI 上一句話當作上下文，幫助辨識（例如人名、菜名）
  const context = form.get("context");
  const prompt = typeof context === "string" ? context.slice(0, 500) : undefined;

  try {
    const file = new File([audio], `speech.${ext}`, { type: mime });
    const text = await transcribeAudio(file, prompt);
    if (!text) {
      return Response.json({ error: "沒有聽到說話聲，請再說一次" }, { status: 422 });
    }
    return Response.json({ text });
  } catch (err) {
    const message = err instanceof AIError ? err.message : "語音辨識失敗";
    if (!(err instanceof AIError)) console.error(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
