import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/practice", label: "練習" },
  { href: "/history", label: "練習紀錄" },
  { href: "/corrections", label: "糾錯紀錄" },
  { href: "/settings", label: "設定" },
] as const;

export default async function SiteHeader({ active }: { active: (typeof NAV)[number]["href"] }) {
  const user = await getCurrentUser();
  const displayName = user?.name ?? user?.email ?? "";

  const nav = (
    <nav className="flex items-center gap-1" aria-label="主要導覽">
      {NAV.map((item) => {
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition ${
              isActive ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href="/" />
        <div className="hidden md:block">{nav}</div>
        {user && (
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marker font-display text-sm font-black text-marker-ink"
              title={user.email}
              aria-hidden
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink-2 sm:inline" title={user.email}>
              {displayName}
            </span>
            <LogoutButton />
          </div>
        )}
      </div>
      {/* 手機：導覽放第二排，可以左右滑 */}
      <div className="overflow-x-auto border-t border-line/70 px-3 py-2 md:hidden">{nav}</div>
    </header>
  );
}
