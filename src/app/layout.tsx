import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "元家",
  description: "元家精選冷凍海鮮與調理食品。",
};

/**
 * 目前這個網站只有 B2C 頁面（/、/products/*），所以 Header 直接掛在 root layout。
 * 之後 B 開始做 /business/*（B2B）跟 /admin 時，這個 B2C 導覽列（會員登入、企業合作、
 * 購物車這些 B2C 專屬入口）不應該一起出現在那些頁面上——屆時建議改用 Next.js 的
 * route group（例如 (b2c)/layout.tsx）把這個 Header 收進去，跟 B2B／Admin 的版面分開，
 * 不是把 Header 元件本身複雜化去判斷「現在是不是 B2C 頁面」。這裡先不動，只留這個提醒。
 *
 * 2026-08-14：套用 design.md §5.2／§5.3 的品牌色彩與字體（token 定義見
 * src/app/globals.css），跟 B 的 /login 對齊。原本的 Geist 字體（create-next-app
 * 預設）拿掉，改用 design.md 指定的 "Noto Sans TC", "Microsoft JhengHei"（見
 * globals.css 的 --font-sans），這裡不用再另外掛字體 class。
 *
 * 2026-08-14（同日）：加上全站 Footer（src/components/Footer.tsx，design.md §6.5
 * 提早做）。各頁 <main> 都帶 flex-1，Footer 排在 children 後面，內容不夠長時
 * Footer 還是會貼齊視窗底部，不會浮在中間。
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface-warm font-sans text-ink-900">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
