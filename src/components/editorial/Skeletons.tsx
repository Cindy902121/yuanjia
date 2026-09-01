/**
 * 商品分類頁／標籤頁的 loading.tsx 共用骨架屏（2026-09-01，9/1 B2C QA 排程
 * 「補齊 loading、empty、error 與商品不存在狀態」發現：整個 (b2c) route
 * group 沒有任何一個 `loading.tsx`，Supabase 查詢完成前使用者在慢網路下會
 * 看到畫面卡在上一頁、以為點擊沒有反應）。
 *
 * 只套用在 /products/categories/[slug]、/products/tags/[slug] 這兩個
 * route segment，**刻意不套在 /products（列表頁）跟 /products/[slug]（詳情
 * 頁）**——這不是漏掉，是實測發現的 Next.js 限制：
 *
 * `loading.tsx` 會讓那個 route segment（連同底下所有巢狀路由）改用串流
 * （streaming）回應，HTTP 狀態碼在串流開始的當下就已經送出。/products/[slug]
 * 找不到商品時呼叫 `notFound()`，但如果 /products 或 /products/[slug] 自己
 * 掛了 `loading.tsx`，狀態碼會來不及改成 404、维持在 200——實測驗證過：
 * 只掛 `products/loading.tsx`（連 [slug] 自己都沒有 loading.tsx）就會讓
 * `/products/不存在的slug` 從正確的 404 變成 200（因為 loading.tsx 建立的
 * Suspense 邊界會往下cascade到所有巢狀路由，不只影響它自己這一層）。
 *
 * 「找不到商品卻回應 200」是比「沒有載入骨架屏」更嚴重的問題（搜尋引擎會
 * 把不存在的商品頁當成正常內容收錄），所以這裡選擇犧牲列表／詳情頁的載入
 * 骨架屏，換正確的 404 狀態碼。/products/categories/[slug]、
 * /products/tags/[slug] 這兩頁沒有呼叫 `notFound()`（查無商品時顯示「無符合
 * 商品」文字，不是 404），沒有這個限制，可以放心加 loading.tsx。
 *
 * 用 `animate-pulse`＋淺灰底色塊（`#EDEAE2`，跟站內「無商品圖片」佔位色
 * `#F3F1EB` 相近但特意不同，方便肉眼區分「這是骨架屏」還是「這是無圖片的
 * 真實內容」），不模擬真實圖片／文字內容——這是骨架屏的標準做法，只是告訴
 * 使用者「這裡即將出現內容」，不是假裝畫面已經載入完成。`aria-hidden`：
 * 骨架屏本身不是資訊，不需要念給螢幕閱讀器聽；loading.tsx 顯示期間 Next.js
 * 會自動用 `aria-busy`／live region 通知使用者「頁面正在載入」。
 *
 * 卡片內部尺寸（圖片 aspect-[4/3]、標題／描述／價格列高度）刻意跟真實卡片
 * 的排版對齊，讓資料載入完成的瞬間版面跳動（layout shift）幅度最小。
 */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex animate-pulse flex-col gap-4">
          <div className="aspect-[4/3] bg-[#EDEAE2]" />
          <div className="h-5 w-3/4 bg-[#EDEAE2]" />
          <div className="h-4 w-full bg-[#EDEAE2]" />
          <div className="h-4 w-1/3 bg-[#EDEAE2]" />
          <div className="h-9 w-full bg-[#EDEAE2]" />
        </div>
      ))}
    </div>
  );
}

/** 分類頁／標籤頁共用：標題區塊＋網格骨架屏，兩頁版面結構幾乎一樣（見兩者 page.tsx）。 */
export function CategoryOrTagPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
      <div className="flex animate-pulse flex-col gap-4" aria-hidden="true">
        <div className="h-3 w-24 bg-[#EDEAE2]" />
        <div className="h-8 w-40 bg-[#EDEAE2]" />
        <div className="h-4 w-full max-w-xl bg-[#EDEAE2]" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
