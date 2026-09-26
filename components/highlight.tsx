// 把句子裡改過的片段用螢光筆標出來（伺服器端、瀏覽器端都能用）。
// 只比對完整的字，避免像「i」這種短片段標到別的單字裡面
export function highlight(text: string, phrases: string[]) {
  const targets = phrases.map((p) => p.trim()).filter(Boolean);
  if (targets.length === 0) return text;
  const escaped = [...targets]
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(?<![A-Za-z])(${escaped.join("|")})(?![A-Za-z])`, "g"));
  return parts.map((part, i) =>
    targets.includes(part) ? (
      <mark key={i} className="marker bg-transparent font-semibold text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
