import { TrackedTagLink } from "@/components/analytics/TrackedTagLink";
import type { ProductDetailData } from "@/lib/types/product";

interface ProductDetailTabsProps {
  product: ProductDetailData;
}

/**
 * 商品詳情頁的「商品詳情／規格／食品認證」區塊（2026-08-17 使用者要求，參考附圖一
 * 的三個分頁：商品介紹／規格說明／運送方式）。
 *
 * 2026-08-17（同日，第二次調整）：原本做成分頁籤（點了才切換內容，未選中的隱藏），
 * 使用者看過後改要求「三個內容都在頁面上，不用切換，點按鈕時畫面自動往下移到
 * 該區塊」——改成錨點跳轉：三個 <section> 一律都渲染在頁面上，上方一排連結只是
 * 導向對應區塊的錨點，不再有「顯示/隱藏」的狀態。因為不再需要任何互動狀態
 * （沒有 useState），這個元件從 Client Component 改回 Server Component，更單純。
 *
 * 平滑捲動沿用 globals.css 全站設定的 scroll-behavior: smooth（已包在
 * prefers-reduced-motion 判斷內，不喜歡動態效果的使用者是瞬間跳轉不是滑動），
 * 不用另外寫 JS scrollIntoView。scroll-mt-20 讓捲到定位時，區塊標題不會被
 * sticky Header 蓋住，跟首頁 #about／#quality 錨點用同一個位移值。
 *
 * 空值處理沿用 docs/b2c-product-field-spec-v1.md §8.3「缺漏時對應區塊直接隱藏」：
 * 食品安全、認證／品質、認證清單三者都沒有內容時，「食品認證」這個區塊跟上面的
 * 跳轉連結一起不顯示，不是顯示一個空區塊或「尚無資料」佔位文字。
 *
 * 2026-08-17（同日，第三次調整）：三個區塊標題加上「更有辨識度」的前綴（使用者
 * 原話舉例「｜商品詳情」）。沒有直接打全形直線字元「｜」——那個字元在不同字型／
 * 作業系統渲染粗細與對齊不一致，改用 CSS 畫一小段品牌藍色塊（SectionHeading
 * 元件），視覺效果一樣是「標題前面有個辨識標記」，但渲染穩定。
 */
export function ProductDetailTabs({ product }: ProductDetailTabsProps) {
  const hasSafetyContent =
    Boolean(product.foodSafetyInfo) ||
    Boolean(product.qualityInfo) ||
    product.certifications.length > 0;

  const sections: { key: string; label: string }[] = [
    { key: "details", label: "商品詳情" },
    { key: "spec", label: "規格" },
    ...(hasSafetyContent ? ([{ key: "safety", label: "食品認證" }] as const) : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="商品資訊區塊快速跳轉" className="flex border-b border-border-subtle">
        {sections.map((section) => (
          <a
            key={section.key}
            href={`#product-${section.key}`}
            className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-ink-600 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section id="product-details" className="scroll-mt-20 flex flex-col gap-4">
        <SectionHeading>商品詳情</SectionHeading>
        <p className="text-sm leading-7 text-ink-600">{product.description}</p>
        {product.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <li key={tag.slug}>
                <TrackedTagLink
                  href={`/products/tags/${tag.slug}`}
                  className="rounded-full bg-brand-ocean-050 px-3 py-1 text-xs text-brand-ocean-800 hover:bg-brand-ocean-700/15"
                >
                  {tag.name}
                </TrackedTagLink>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section id="product-spec" className="scroll-mt-20 flex flex-col gap-4">
        <SectionHeading>規格</SectionHeading>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {product.brand ? (
            <div>
              <dt className="text-ink-600">品牌</dt>
              <dd className="text-ink-900">{product.brand}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-ink-600">規格</dt>
            <dd className="text-ink-900">{product.specification}</dd>
          </div>
          <div>
            <dt className="text-ink-600">產地</dt>
            <dd className="text-ink-900">{product.origin}</dd>
          </div>
          <div>
            <dt className="text-ink-600">保存方式</dt>
            <dd className="text-ink-900">{product.storageMethod}</dd>
          </div>
          <div>
            <dt className="text-ink-600">分類</dt>
            <dd className="text-ink-900">
              {product.categories.map((category) => category.name).join("、")}
            </dd>
          </div>
        </dl>
      </section>

      {hasSafetyContent ? (
        <section id="product-safety" className="scroll-mt-20 flex flex-col gap-4">
          <SectionHeading>食品認證</SectionHeading>
          {product.foodSafetyInfo ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-900">食品安全</h3>
              <p className="mt-1 text-sm leading-6 text-ink-600">{product.foodSafetyInfo}</p>
            </div>
          ) : null}
          {product.qualityInfo ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-900">認證／品質</h3>
              <p className="mt-1 text-sm leading-6 text-ink-600">{product.qualityInfo}</p>
            </div>
          ) : null}
          {product.certifications.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {product.certifications.map((cert) => (
                <li key={cert.slug} className="text-sm text-ink-600">
                  {cert.name}
                  {cert.issuer ? `（${cert.issuer}）` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

/** 區塊標題，左側加一小段品牌藍色塊當辨識前綴，取代純文字的「｜」字元（見上方檔頭說明）。 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
      <span aria-hidden="true" className="h-4 w-1 rounded-full bg-brand-ocean-700" />
      {children}
    </h2>
  );
}
