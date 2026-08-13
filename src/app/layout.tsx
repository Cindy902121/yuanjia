import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
