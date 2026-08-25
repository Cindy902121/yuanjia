import { Noto_Sans_TC, Noto_Serif_TC, Josefin_Sans } from "next/font/google";

/**
 * 全站字體設定（日系雜誌編排風／Minimal Editorial Japanese Style）。
 *
 * 2026-08-19：原本只在 /design-preview/* 底下用（見已刪除的
 * design-preview/_lib/fonts.ts），A／B／C 三人都確認喜歡這版風格後，正式取代
 * design.md 舊有的「海洋藍＋鮮活綠」系統，搬到這裡給全站（root layout、Header、
 * Footer、所有頁面）共用。
 *
 * 字體選擇理由（Josefin Sans 細字重英文小標、Noto Serif TC 中文標題、
 * Noto Sans TC 內文）見 docs/design-editorial-proposal.md §3.2——不是憑空選的，
 * 是先實際打開參考網站（takamaru-fukuoka.com）讀取真實渲染出來的
 * getComputedStyle 才確認的。
 */
export const editorialSerif = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--ep-font-serif",
  display: "swap",
});

export const editorialSans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--ep-font-sans",
  display: "swap",
});

export const editorialEn = Josefin_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--ep-font-en",
  display: "swap",
});

/** 三個字體 className 併起來，掛在 root layout 最外層，讓底下所有 `var(--ep-font-*)` 全站生效。 */
export const editorialFontClassName = `${editorialSerif.variable} ${editorialSans.variable} ${editorialEn.variable}`;
