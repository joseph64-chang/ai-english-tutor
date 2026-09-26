// 註冊 / 登入表單的共用檢查（前後端都用）

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt 只看前 72 個 byte，超過的部分會被忽略
const MAX_PASSWORD_BYTES = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthInput = { email: string; password: string; name?: string };

// 回傳錯誤訊息；沒問題就回傳 null
export function validateAuthInput(
  input: Partial<AuthInput>,
  mode: "login" | "register",
): string | null {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) return "請輸入 Email 和密碼";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return "Email 格式不正確";
  if (mode === "register") {
    if (password.length < MIN_PASSWORD_LENGTH)
      return `密碼至少要 ${MIN_PASSWORD_LENGTH} 個字元`;
    if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES)
      return "密碼太長了（英數字最多 72 個字元）";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length > 50) return "名稱最多 50 個字";
  }
  return null;
}
