import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開發模式左下角的 Next.js 圖示會蓋住對話頁的麥克風按鈕，關掉它。
  // 編譯或執行錯誤還是會照常顯示在畫面上。
  devIndicators: false,
};

export default nextConfig;
