import Link from "next/link";
import Logo from "@/components/Logo";
import { buttonPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="dot-grid flex min-h-dvh flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Logo />
      <p className="mt-14 font-display text-8xl font-black text-line-strong italic" aria-hidden>
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-black">
        <span className="red-pen text-muted">Page found</span> <span className="marker">Page not found</span>
      </h1>
      <p className="mt-4 max-w-sm leading-relaxed text-muted">
        找不到這個頁面，或是這不是你的練習紀錄。
      </p>
      <Link href="/practice" className={`${buttonPrimary} mt-10 h-12`}>
        回到練習 →
      </Link>
    </main>
  );
}
