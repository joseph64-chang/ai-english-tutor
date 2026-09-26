"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="h-8 shrink-0 rounded-full border border-line-strong px-3 text-xs font-semibold text-ink-2 transition hover:border-ink hover:text-ink disabled:opacity-40"
    >
      {pending ? "登出中…" : "登出"}
    </button>
  );
}
