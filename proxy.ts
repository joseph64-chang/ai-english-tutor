import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decrypt } from "@/lib/session";

// 登入 / 註冊頁：已登入的人不需要再看，直接送去選場景
const AUTH_PAGES = ["/login", "/register"];
// 不用登入就能看的頁面（首頁是服務介紹）
const PUBLIC_PAGES = ["/", ...AUTH_PAGES];

// 只看 cookie 裡的 session 做快速導頁，不查資料庫。
// 這裡只是讓頁面體驗順一點；真正的權限檢查在每個頁面和每支 API 裡（lib/dal.ts），
// 而且所有資料查詢都會帶上 userId，只能讀到自己的紀錄。
export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!PUBLIC_PAGES.includes(pathname) && !session) {
    const url = new URL("/login", req.nextUrl);
    // 登入後回到原本要去的頁面
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/practice", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  // API 自己檢查登入並回 JSON，靜態檔不需要檢查
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
