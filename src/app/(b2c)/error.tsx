"use client";

import { useEffect } from "react";
import Link from "next/link";
import { editorialButtonLight, editorialButtonSolid } from "@/lib/editorial/styles";

/**
 * `(b2c)` route group 的 error boundary（2026-09-01，9/1 B2C QA 排程「補齊
 * loading、empty、error 與商品不存在狀態」發現的落差）。
 *
 * 在這支檔案出現之前，這個 route group 底下任何一個 Server／Client Component
 * 拋出未攔截的例外（例如 Supabase 連線中斷、未預期的執行期錯誤），正式環境下
 * 使用者看到的是 Next.js 內建的通用錯誤畫面——完全空白，沒有任何文字、沒有
 * 重試按鈕、沒有回首頁的路，看起來像網站真的壞掉了。
 *
 * App Router 規定 `error.tsx` 一定要是 Client Component。放在 `(b2c)` 底下
 * 而不是 root layout：跟 not-found.tsx 同樣理由，`(b2c)/layout.tsx` 的
 * Header／Footer／B2CHelpWidget 仍然照常包住這個畫面。
 *
 * 不顯示 `error.message`／stack——避免把 Supabase 連線字串、內部實作細節
 * 洩漏給使用者，一律用通用文案；真正的錯誤內容只印到 console（`useEffect`
 * 裡呼叫 `console.error`，方便開發時在瀏覽器 devtools 看到完整錯誤），伺服器端
 * 的錯誤細節已經有各 API route 自己的 `console.error` 留存，不需要在這裡
 * 重複暴露。
 *
 * `reset()` 是 Next.js 傳進來的重新渲染函式，不是 `location.reload()`——先讓
 * 使用者不用整頁重新載入就有機會恢復；如果問題出在更上層（例如整個 layout
 * 都壞了），`reset()` 不會有效果，這時候「回首頁」的連結是使用者唯一能離開
 * 這個畫面的方式，所以兩個按鈕都要有。
 */
export default function B2CError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FAF9F6] px-5 py-24 font-[family-name:var(--ep-font-sans)] text-[#2B2B2B] sm:px-8">
      <div className="flex flex-col items-center gap-4 border border-dashed border-[#2b2b2b]/20 px-12 py-20 text-center">
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
          ERROR
        </span>
        <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#2b2b2b]">
          發生了一些問題
        </h1>
        <p className="max-w-md text-sm font-light leading-[1.8] text-[#4a4a4a]">
          頁面暫時無法顯示，請稍後再試一次；如果問題持續發生，歡迎透過常見問題頁的聯絡方式與我們反應。
        </p>
        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => reset()} className={editorialButtonSolid}>
            再試一次
          </button>
          <Link href="/" className={editorialButtonLight}>
            回首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
