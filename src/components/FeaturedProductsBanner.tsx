import Image from "next/image";

/**
 * /products 頁面最上方的宣傳 banner（2026-08-17 使用者要求，第三次調整）。
 *
 * 沿革：純色色塊＋商品卡網格 → 圖片 banner＋下方 4 張「當季主打商品」卡片 →
 * 使用者看過後覺得圖片下面接商品卡不好看，要求拿掉卡片，banner 單純當成一塊
 * 宣傳圖，文案也跟著從「當季主打商品」（暗示下面有對應商品）改成不特別連結
 * 商品的標語。
 *
 * 圖片來源：跟首頁 Hero 同一張元家官網真實首頁 Banner 照片（indexbanner001.jpg），
 * 裁了不同區域（下半段橫幅，1920×380）跟首頁 Hero 區隔開，避開原圖左半邊燒進去
 * 的文字（取樣驗證過 y=600-980 整段不含文字像素）。
 *
 * 刻意不加 max-width／置中容器——呼叫端（/products/page.tsx）要把它放在 <main>
 * 外層無寬度限制的地方，圖片才能真的左右滿版；文字疊層內部另外置中、限制寬度，
 * 維持跟頁面其他內容對齊的邊界。
 *
 * `isFeatured`（src/lib/types/product.ts、fixtures/products.ts）留著沒拿掉——
 * 對應正式 schema 已經規劃的 b2c_products.is_featured，之後如果要在別處（例如
 * 首頁）用到「主打商品」的概念可以直接用，不用重新設計欄位；只是這裡不再拿它
 * 渲染商品卡。
 */
export function FeaturedProductsBanner() {
  return (
    <section className="relative flex min-h-[200px] items-end overflow-hidden sm:min-h-[260px] lg:min-h-[320px]">
      <Image
        src="/products-banner.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/35 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-6 sm:px-8 lg:px-10">
        <p className="text-sm font-bold tracking-[0.2em] text-white/80">SEASONAL</p>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">嚴選當季鮮味</h2>
      </div>
    </section>
  );
}
