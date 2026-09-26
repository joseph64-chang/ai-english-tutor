import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { UserModel } from "@/models/User";

// 權限檢查集中在這裡（Data Access Layer）。
// proxy.ts 只做頁面導向；真正擋人的是這裡：每個頁面和每支 API 都要自己呼叫。

// 頁面用：沒登入就導去登入頁，有登入回傳 userId
export const requireUserId = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
});

// 取得目前登入的使用者（只回傳可以給前端看的欄位）
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await UserModel.findById(session.userId)
    .select("email name")
    .lean();
  if (!user) return null;
  return { id: String(user._id), email: user.email, name: user.name ?? null };
});

// API 用：沒登入回 null，由呼叫端回 401
export async function getUserIdFromRequest() {
  const session = await getSession();
  return session?.userId ?? null;
}

export function unauthorized() {
  return Response.json({ error: "請先登入" }, { status: 401 });
}
