import Image from "next/image";

/**
 * 首頁的 Photography Moment。素材來源與篩選過程見對應回覆訊息裡的
 * Photography Plan，這裡只記錄「為什麼用這張、為什麼用這個處理方式」。
 *
 * 2026-09：原為 `/about-preview` 專用元件，Ocean Motion 視覺設計五輪確認
 * 核准後原封不動搬進 `_ocean/` 給正式首頁使用，內容／參數沒有變動。
 *
 * 2026-09（使用者第五輪回饋：「Photography 使用過量、變成 Seafood
 * Collage，同一張圖不要重複使用，品牌故事的圖片跟品牌歷史語意關聯不足，
 * 企業優勢的多張商品照 Collage 要整個移除」——這裡是收斂後的最終版本）：
 *
 * - `BrandStoryPhoto`：原本用 `products-banner.jpg`（海鮮＋檸檬的商品
 *   擺拍），跟「品牌故事」文案講的 1968 年澎湖草創、品牌歷史完全對不上，
 *   單純是「隨便放一張好看的海鮮照」。重新分析 yens.com.tw／asf.com.tw
 *   後換成 `brand-story-coastal-origin.jpg`（來源：yens.com.tw「企業介紹」
 *   頁 `CompanyImg.jpg`，一張空拍的沿海港灣／漁村實景，沒有 logo／促銷
 *   文字烙印），符合使用者這次明確排序的優先序第 3 項「漁業／產地／海洋
 *   相關實景」，且視覺上直接呼應文案裡「澎湖草創」的地理起點，比純商品
 *   擺拍更貼近「History / Heritage / Ocean / Origin」的訴求。備選方案是
 *   `yens.com.tw` 大事紀頁的 `aboutyens001.jpg`（1960–70 年代風格的舊廠房
 *   實景照，同樣沒有臉孔辨識疑慮），畫質更有「老照片」的年代感，但原始
 *   解析度只有 320×220、放大到版面尺寸會偏軟——這裡先選解析度較高、視覺
 *   更精緻的空拍港灣照，如果團隊更偏好「老廠房」的懷舊感，可以直接換成
 *   這張備選。全站只用這一張當品牌故事的主圖，不重複使用在其他 Section。
 *   維持左側化開成白霧的處理方式，`mask-image` 的比例微調到 42%（原本
 *   38%）——這張照片的視覺重心比較集中在中央偏右的港灣建築，往右挪一點
 *   確保重心不被霧化蓋到。
 * - 企業優勢原本疊的兩張商品照（蝦／魷魚）已經整個移除——跟品牌故事的
 *   照片、跟全站其他海鮮商品照視覺語言重複，這個 Section 使用者明確要求
 *   改成「Typography + 大型螃蟹線稿」為主，見 page.tsx 與
 *   marine-line-art.tsx 的 `CrabLineArt`。
 * - `FoodSafetyPhoto`：使用者這次明確列為「LOCKED / APPROVED」，這裡完全
 *   沒有改動，維持上一輪的 `food-safety-cold-chain.jpg` ＋藍灰疊層設計。
 *
 * 2026-09（使用者回報「Hero 恢復後，Brand Story 圖片存在感太強、跟 Hero
 * 形成兩個連續的大型 Photography Moment」——只調整 `BrandStoryPhoto`
 * 桌機版，`BrandStoryPhotoMobile`／`FoodSafetyPhoto` 沒有動）：
 * - 容器寬度從 `w-[52%]` 收窄到 `w-[38%]`，符合「桌機上圖片主要集中在
 *   右側約 35–40%」的要求。
 * - `object-position` 從 `object-right` 改成置中偏右（見 inline style），
 *   容器變窄之後如果還是完全靠右裁切，港灣建築主體會被裁到畫面外只剩
 *   單調的海面——這裡用 `70% 50%` 讓建築群還留在可見範圍內。
 * - 新增 `filter`（`saturate`／`contrast`／`brightness`）直接降低圖片本身
 *   的飽和度與對比，讓它從一開始就是「氣氛用的次要攝影」而不是跟 Hero
 *   同一等級的清晰度——不是只疊一層白霧遮住，是圖片本身的視覺強度就比
 *   Hero 弱一截，符合「第一眼讀 Brand Story 文字，第二眼才注意到右側
 *   Photography」的要求。
 * - `.op-brand-photo` 的 mask／`.op-brand-photo-mist` 的白霧疊層比例也
 *   跟著調整（見 ocean-preview-styles.tsx），核心邏輯：mask 負責「左側
 *   化開成透明、看不出矩形邊界」，白霧疊層現在**不會在右側完全淡出到
 *   0**，維持一層很淡的常駐白霧，確保「即使在最右側也不要跟 Hero 一樣
 *   強烈，但不要淡到完全看不見」兩個要求同時成立。
 */
export function BrandStoryPhoto() {
  return (
    <div
      aria-hidden="true"
      className="op-brand-photo pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] lg:block"
    >
      <Image
        src="/brand-story-coastal-origin.jpg"
        alt=""
        fill
        sizes="38vw"
        className="object-cover"
        style={{ objectPosition: "70% 50%" }}
      />
      <div className="op-brand-photo-mist absolute inset-0" />
    </div>
  );
}

/** Mobile／小平板用的替代版本——不是把桌機版直接垂直堆疊，而是縮成一個
 * 完整寬度、置於文字下方的橫幅小圖，一樣有頂部白霧淡出銜接上方留白。 */
export function BrandStoryPhotoMobile() {
  return (
    <div aria-hidden="true" className="op-brand-photo-mobile relative mt-2 h-48 w-full overflow-hidden lg:hidden">
      <Image src="/brand-story-coastal-origin.jpg" alt="" fill sizes="100vw" className="object-cover" />
      <div className="op-brand-photo-mobile-mist absolute inset-0" />
    </div>
  );
}

/**
 * 只鋪在 Section 上半部（標題＋05 個步驟那一排，文字量少、字級較大），
 * 底部用遮罩淡出銜接回原本的漸層背景，不會整個 Section 8 條 QUALITY_FACTS
 * 密集文字列都疊在照片上——那樣即使有霧面疊層，密集小字的可讀性還是會
 * 打折扣，"Large Photography" 用在資訊量少的標題區塊即可。
 *
 * LOCKED（使用者第五輪回饋明確列為已核准、不要修改）：這個元件本身完全
 * 沒有異動。
 */
export function FoodSafetyPhoto() {
  return (
    <div aria-hidden="true" className="op-safety-photo pointer-events-none absolute inset-x-0 top-0 h-[420px] lg:h-[520px]">
      <Image src="/food-safety-cold-chain.jpg" alt="" fill sizes="100vw" className="object-cover" />
      <div className="op-safety-photo-overlay absolute inset-0" />
    </div>
  );
}
