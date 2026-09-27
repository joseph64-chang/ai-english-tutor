// BYOK（Bring Your Own Key）：OpenAI API Key 由使用者自己提供。
// 金鑰只存在使用者瀏覽器的 localStorage，每次呼叫需要 AI 的 API 時用標頭帶上；
// 伺服器只拿來呼叫 OpenAI，不儲存、不寫進 log。
// 這個檔案前後端共用：標頭名稱兩邊都要用，其餘函式只在瀏覽器呼叫。

// 前端送、後端收都用這個標頭名稱
export const OPENAI_KEY_HEADER = "x-openai-key";

const STORAGE_KEY = "ai-english-tutor:openai-key";
const CHANGE_EVENT = "openai-key-change";

// 基本格式檢查：OpenAI 金鑰都是 sk- 開頭（實際能不能用要打 OpenAI 才知道）
export function looksLikeOpenAIKey(key: string) {
  return /^sk-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

// 畫面上顯示用：只露出開頭和最後 4 碼
export function maskKey(key: string) {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 7)}••••••••${key.slice(-4)}`;
}

// localStorage 在無痕模式或被封鎖時可能直接丟錯，所以都包 try/catch
export function getStoredKey(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveKey(key: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    throw new Error("瀏覽器不允許儲存資料（可能是無痕模式），無法保存金鑰");
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearKey() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 本來就存不了，當作已清除
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 呼叫需要 AI 的 API 時加上的標頭；沒設定金鑰就不帶，由伺服器回傳「請先設定」
export function openAIKeyHeaders(): Record<string, string> {
  const key = getStoredKey();
  return key ? { [OPENAI_KEY_HEADER]: key } : {};
}

// 給 useSyncExternalStore 用：同分頁（自訂事件）與其他分頁（storage 事件）改動都會通知
export function subscribeKey(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
