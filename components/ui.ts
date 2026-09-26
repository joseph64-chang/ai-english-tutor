// 共用的按鈕與區塊樣式（Tailwind class 字串）

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-on-accent shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_20px_-8px_var(--accent)] transition hover:-translate-y-0.5 hover:bg-accent-ink active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 font-semibold text-ink transition hover:-translate-y-0.5 hover:border-ink active:translate-y-0";

export const buttonDark =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-paper transition hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0";

export const card = "rounded-2xl border border-line bg-surface shadow-card";

// 頁面上方的小標（英文大寫、字距拉開）
export const eyebrow = "text-[11px] font-bold tracking-[0.24em] text-accent uppercase";
