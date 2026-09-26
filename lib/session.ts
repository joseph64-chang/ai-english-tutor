import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// 登入狀態存在瀏覽器的 httpOnly cookie 裡（簽章過的 JWT），伺服器不另外存 session。
// 前端 JavaScript 讀不到這個 cookie，也無法偽造（沒有 SESSION_SECRET 就簽不出有效的 JWT）

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;

export type SessionPayload = { userId: string };

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("請在 .env.local 設定 SESSION_SECRET");
  return new TextEncoder().encode(secret);
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());
}

export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.userId === "string"
      ? { userId: payload.userId }
      : null;
  } catch {
    return null; // 過期或被竄改
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}
