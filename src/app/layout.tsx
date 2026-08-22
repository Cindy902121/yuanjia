import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [
    { path: "../../public/fonts/Geist-VariableFont_wght.ttf", style: "normal", weight: "100 900" },
    { path: "../../public/fonts/Geist-Italic-VariableFont_wght.ttf", style: "italic", weight: "100 900" },
  ],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "元家",
  description: "元家精選冷凍海鮮與調理食品。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
