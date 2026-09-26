import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 標題用的英文襯線字（有斜體，用在英文強調）
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
});

// 標題用的中文宋體。中文字型很大，不預先下載，用到的字才載入
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-tc",
  weight: ["600", "900"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "AI 英文家教｜開口說，就會進步",
  description:
    "選一個生活情境，和 AI 角色用英文對話。會聽、會說、會幫你糾正文法，還會示範更好的說法。",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#111217" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
