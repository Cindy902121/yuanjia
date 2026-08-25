import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { B2CHelpWidget } from "@/components/B2CHelpWidget";

/**
 * B2C route group layout（2026-08-25，回應 B 回報「/business/catalog 同時顯示
 * B2C Header 與 B2B BusinessHeader」）。
 *
 * 這是 src/app/layout.tsx 從一開始就留著的 TODO（見該檔案 2026-08-14 附近的
 * 註解：「之後 B 開始做 /business/*（B2B）跟 /admin 時...建議改用 Next.js 的
 * route group」）——當時網站只有 B2C 頁面，Header／Footer／B2CHelpWidget 直接
 * 掛在 root layout 最簡單；現在 B2B（/business/catalog 等）、Admin（/admin/*）
 * 頁面加進來了，root layout 全站套用就會讓這些頁面也一起顯示 B2C 導覽列，跟
 * B2B 自己的 BusinessHeader 疊在一起。
 *
 * 這裡把 Header／Footer／B2CHelpWidget 從 root layout 收進來，只套用在
 * `(b2c)` route group底下的頁面（/、/about、/products/*、/cart、/checkout、
 * /faq、/media、/user、/business/lead——最後這個雖然路徑開頭是 /business，
 * 但 FDD §7.2 把它列為 B2C 頁面，用 route group 精確控制而不是用路徑前綴，
 * 剛好能正確處理這種「路徑像 B2B、實際是 B2C」的例外，見
 * src/app/(b2c)/business/lead/page.tsx）。route group 的資料夾名稱
 * `(b2c)` 不會出現在網址上，所以這些頁面的實際路徑完全不變。
 *
 * `/login`、`/business`、`/business/catalog`、`/business/product-finder`、
 * `/business/rfq`、`/admin`、`/admin/business` 都留在這個 route group
 * 之外，不會套用這裡的 Header／Footer／B2CHelpWidget——B2B／Admin 頁面用
 * 自己的版面（例如 BusinessHeader），/login 是 B2C／B2B／管理者共用的統一
 * 登入頁，本來就不該有 B2C 專屬導覽列。
 *
 * 底色／字體／文字色（`bg-[#FAF9F6]`／編輯風內文字體／`#2B2B2B`）原本掛在
 * root layout 的 `<body>` 上，現在收進來變成這個 group 專屬的外層 div——
 * B2B／Admin／登入頁不應該被迫套用 B2C 的視覺色彩，交給各自頁面自己決定。
 * `flex-1 flex flex-col`／`min-h-full` 是為了維持原本「內容不夠長時 Footer
 * 仍貼齊視窗底部」的排版邏輯，跟原本 `<body>` 的 flex 設定等價，只是往下移了
 * 一層。
 */
export default function B2CLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <Header />
      {children}
      <Footer />
      <B2CHelpWidget />
    </div>
  );
}
