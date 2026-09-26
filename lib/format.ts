// 日期一律用台灣時區顯示（伺服器可能不在台灣）
const dateTimeFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(date: Date | string) {
  return dateTimeFormat.format(new Date(date));
}
