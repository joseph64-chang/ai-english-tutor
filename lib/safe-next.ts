// 登入後要去的頁面（預設是選場景）。只接受站內路徑，避免 ?next=https://壞網站 這種開放式轉址
export function safeNextPath(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/practice";
  }
  return next;
}
