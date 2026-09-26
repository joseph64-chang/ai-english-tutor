// OpenAI、Gemini 兩邊共用的型別與錯誤

export type ChatTurn = { role: "user" | "assistant"; content: string };

// 各家朗讀用的聲音名稱（兩家的聲音不一樣，所以各設一個）
export type Voices = { openai: string; gemini: string };

// 朗讀結果：OpenAI 回傳 mp3 串流，Gemini 回傳 wav
export type SpeechAudio = {
  body: ReadableStream<Uint8Array> | Uint8Array<ArrayBuffer>;
  contentType: string;
};

// 可以直接顯示給使用者看的錯誤（訊息是中文、不含敏感資訊）
export class AIError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

// 記錄 AI 服務的錯誤：只記狀態碼和錯誤內容開頭，不把 request 內容或金鑰印出來
export async function ensureOk(res: Response, label: string) {
  if (res.ok) return;
  const detail = await res.text().catch(() => "");
  console.error(`${label} error ${res.status}: ${detail.slice(0, 300)}`);
  if (res.status === 429) {
    // 超過每分鐘次數或帳號額度（例如短時間內連續朗讀很多句）
    throw new AIError("使用太頻繁，超過 AI 服務的額度了，請等一分鐘再試", 429);
  }
  throw new AIError("AI 服務暫時無法回應", res.status);
}
