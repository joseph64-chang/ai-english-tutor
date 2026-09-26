import Link from "next/link";

// 標誌：對話框裡的聲波（開口說英文）
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-[10px] bg-accent text-on-accent ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" fill="none">
        <path
          d="M6 8.5A3.5 3.5 0 0 1 9.5 5h13A3.5 3.5 0 0 1 26 8.5v9a3.5 3.5 0 0 1-3.5 3.5H15l-5.5 4.5V21h0A3.5 3.5 0 0 1 6 17.5z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M11.5 13h0M14 10.5v5M16.5 9v8M19 11v4M21.5 13h0"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// inverted：放在深色背景上時，文字改用淺色
export default function Logo({ href = "/", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="AI 英文家教 首頁">
      <LogoMark />
      <span className="leading-none">
        <span className={`block font-display text-[17px] font-black tracking-tight ${inverted ? "text-paper" : "text-ink"}`}>
          AI 英文家教
        </span>
        <span className={`mt-0.5 block text-[10px] font-semibold tracking-[0.22em] ${inverted ? "text-paper/60" : "text-muted"}`}>
          ENGLISH TUTOR
        </span>
      </span>
    </Link>
  );
}
