// AI 相關的共用型別與錯誤

export type ChatTurn = { role: "user" | "assistant"; content: string };

// 朗讀結果：OpenAI 回傳 mp3 串流
export type SpeechAudio = {
  body: ReadableStream<Uint8Array>;
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
  if (res.status === 401) {
    // 金鑰是使用者自己的；OpenAI 的 401 錯誤內容會帶出部分金鑰，所以不記錄內容
    console.error(`${label} error 401`);
    throw new AIError("你的 OpenAI API Key 無效或已被停用，請到「設定」頁更換", 401);
  }
  const detail = await res.text().catch(() => "");
  console.error(`${label} error ${res.status}: ${detail.slice(0, 300)}`);
  if (res.status === 429) {
    // 超過每分鐘次數或帳號額度（例如短時間內連續朗讀很多句）
    throw new AIError("使用太頻繁，超過 AI 服務的額度了，請等一分鐘再試", 429);
  }
  throw new AIError("AI 服務暫時無法回應", res.status);
}
