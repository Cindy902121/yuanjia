/**
 * 首頁「Ocean Motion」漸層／裝飾線稿樣式。
 *
 * 2026-09：這份檔案（原名 `ocean-preview-styles.tsx`，函式原名
 * `OceanPreviewStyles`）在 `/about-preview` 走完五輪確認、視覺設計正式核准
 * 後，原封不動搬進 `src/app/(b2c)/_ocean/`（Next.js 底線資料夾，不會變成
 * 路由）給正式首頁 `src/app/(b2c)/page.tsx` 使用——這是 Migration，不是
 * 重新設計，所有漸層色票／mask／filter 數值都跟 Preview 最終確認版本逐一
 * 一致。搬過來時只做了兩件跟視覺無關的清理：
 * 1. 函式改名為 `OceanStyles`（拿掉「Preview」字樣，因為現在是正式檔案）。
 * 2. 刪掉兩處只在 Preview 階段才需要的東西：
 *    - `.op-photo-mask`（圓形柔邊遮罩）：原本用在企業優勢 Section 的兩張
 *      商品照片 Collage 上，那組 Collage 在 Preview 第五輪就已經整個移除、
 *      改成大型螃蟹線稿，這條規則從那時候起就是死碼，沒有任何元素在用。
 *    - `body:has(#op-preview-root) footer`：這是 Preview 專用的 Footer
 *      顏色範圍限定手法（只在 `/about-preview` 這個比對頁生效，不影響
 *      Footer.tsx 本身），現在是正式 Migration，直接把 `Footer.tsx` 的
 *      `bg-[#071B2B]` 改成 `bg-[#071923]`（見該檔案），不再需要這個
 *      `:has()` 範圍限定技巧。
 * 除了以上兩項刪除，其餘全部逐字保留。以下維持原本從 Preview 五輪確認
 * 過程留下來的歷史說明，方便日後追溯每個數值「為什麼是這樣」：
 *
 * 2026-09（使用者第二輪回饋後修正——「漸層太亮太鮮帶螢光感」）：
 * 上一版的漸層雖然做到了「連續、無硬切」，但色彩本身飽和度偏高、偏亮，
 * 使用者要的是「低飽和、霧面、簡約」的編輯風海洋色，不是科技公司風的亮藍。
 * 這次直接採用使用者自己給的參考色票（由淺到深）：
 * #F7FAFB → #EEF4F6 → #DDE9ED → #B8CCD3 → #8FAAB5 → #5E7D89 → #35515E →
 * #1D3540 → #102630 → #071923，全部是低飽和的灰藍／霧面色，沒有任何一個
 * 是高彩度或螢光色，10 個 color stop 平均分布確保過渡非常平順。
 *
 * 文字對比（使用者要求「深色背景時文字必須自動變淺」）：品牌故事／企業
 * 優勢兩個 Section 落在漸層前段（還是很淺），文字維持原本的深色（沿用全站
 * 既有的 `#0B1620`／`#5C7383`）；食安品質／媒體報導／收尾引言三個 Section
 * 落在漸層中後段（已經是明顯的深藍灰到近黑），這三個 Section 的
 * `<section>` 標籤上多加一個 `op-zone-dark` class（純粹是一個標記用的
 * class name，不影響任何版面／間距），下面用「class 屬性字串包含某個
 * Tailwind 任意值 class 名稱」的方式（`[class*="..."]`）把這些 Section
 * 底下既有的 `text-[#0B1620]`／`text-[#5C7383]`／相關 border／底色全部覆寫
 * 成淺色系——完全不需要動 page.tsx 裡任何一個 className 字串本身。
 *
 * 2026-09（使用者第四輪回饋：新增少量真實攝影，改善「過度依賴文字／漸層／
 * 留白」的單調感）：
 * - `.op-brand-photo`：`mask-image` 讓照片左側漸漸「化開」成透明（不是
 *   矩形硬邊），`.op-brand-photo-mist` 是疊在上面、從左到右漸淡的白霧
 *   漸層——兩層都是純 CSS gradient，沒有用 `backdrop-filter`／玻璃卡片。
 * - `.op-safety-photo`：只在上下邊緣做遮罩淡出（銜接回 `.op-descent` 背景），
 *   `.op-safety-photo-overlay` 是符合這個 Section 所在漸層深淺（Slate／
 *   Deep Blue Gray）的低飽和疊層，不是隨便一層黑色半透明。
 *
 * 2026-09（Hero 恢復成首頁正式版之後，使用者回報「Brand Story 圖片跟
 * Hero 形成兩個連續的大型 Photography Moment、存在感太強」）：
 * - `mask-image` 的黑色（完全顯示）起點從 38% 延後到 70%——化開的漸變範圍
 *   涵蓋幾乎整個容器寬度，不會有一段突然「這裡開始是張矩形照片」的平坦區。
 * - `.op-brand-photo-mist` 收斂到一個常駐的低值（0.16）而不是完全淡出到
 *   0——確保「即使在最右側，也不要像 Hero 一樣強烈」，同時還不到完全看
 *   不見的程度。
 * - `.op-brand-photo img` 的 `filter`（降飽和度／降對比／微調亮度）是圖片
 *   本身「看起來比 Hero 弱一截」的主要來源，不是只靠疊一層白霧蓋住。
 */
export function OceanStyles() {
  return (
    <style>{`
      .op-descent {
        background: linear-gradient(
          180deg,
          #F7FAFB 0%,
          #EEF4F6 11%,
          #DDE9ED 22%,
          #B8CCD3 33%,
          #8FAAB5 44%,
          #5E7D89 55%,
          #35515E 66%,
          #1D3540 77%,
          #102630 88%,
          #071923 100%
        );
      }

      /* Hero 底部的黑色相片疊層，淡出成跟 .op-descent 起始色一致的暖白／
         冰白色，讓相片跟下方頁面「融接」在一起。 */
      .op-hero-fade {
        background: linear-gradient(180deg, rgba(247, 250, 251, 0) 0%, #F7FAFB 100%);
      }

      /* 收尾色塊：.op-descent 終點已經是 #071923（接近全黑深藍），這裡只是
         再往 Footer 的顏色收一次尾，確保跟 Footer（見 Footer.tsx 的
         bg-[#071923]）完全同色、零接縫。 */
      .op-abyss-fade {
        background: #071923;
      }

      .op-line-art path {
        stroke: #0B1620;
      }

      /* 深色區段的文字／邊框覆寫——只影響帶有 op-zone-dark 這個標記 class
         的 Section 底下的內容，見上方檔頭說明。順序：一般規則在前、更精確
         的透明度變體在後，確保後者正確覆蓋前者（CSS 同特異度時後宣告的贏）。 */
      .op-zone-dark [class*="text-[#0B1620]"] { color: #F3F8FA !important; }
      .op-zone-dark [class*="text-[#5C7383]"] { color: #B9CBD6 !important; }
      .op-zone-dark [class*="bg-[#0B1620]"] { background-color: #EAF4F8 !important; }
      .op-zone-dark [class*="bg-[#0B1620]/20"] { background-color: rgba(234, 244, 248, 0.32) !important; }
      .op-zone-dark [class*="border-[#0B1620]/10"] { border-color: rgba(234, 244, 248, 0.14) !important; }
      .op-zone-dark [class*="border-[#0B1620]/15"] { border-color: rgba(234, 244, 248, 0.16) !important; }
      .op-zone-dark [class*="border-[#0B1620]/20"] { border-color: rgba(234, 244, 248, 0.2) !important; }

      @media (prefers-reduced-motion: reduce) {
        .op-fish-layer * {
          transition: none !important;
          animation: none !important;
        }
      }

      /* 品牌故事的照片：左側化開成透明，讓底下的 .op-descent 背景透出來；
         化開的範圍延伸到 70%，右側也刻意不到完全清楚（見下面的 filter／
         mist 常駐值），維持「Secondary Atmospheric Image」的定位。 */
      .op-brand-photo {
        mask-image: linear-gradient(to right, transparent 0%, black 70%, black 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0%, black 70%, black 100%);
      }
      .op-brand-photo img {
        filter: saturate(0.7) contrast(0.88) brightness(1.05);
      }
      .op-brand-photo-mist {
        background: linear-gradient(
          to right,
          rgba(247, 250, 251, 0.95) 0%,
          rgba(247, 250, 251, 0.68) 22%,
          rgba(247, 250, 251, 0.4) 42%,
          rgba(247, 250, 251, 0.22) 62%,
          rgba(247, 250, 251, 0.16) 100%
        );
      }
      .op-brand-photo-mobile-mist {
        background: linear-gradient(180deg, rgba(247, 250, 251, 0.85) 0%, rgba(247, 250, 251, 0) 30%, rgba(247, 250, 251, 0) 100%);
      }

      /* 食安品質的冷鏈照片：上下邊緣淡出＋低飽和藍灰疊層。 */
      .op-safety-photo {
        mask-image: linear-gradient(180deg, transparent 0%, black 16%, black 82%, transparent 100%);
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, black 16%, black 82%, transparent 100%);
      }
      .op-safety-photo-overlay {
        background: linear-gradient(180deg, rgba(29, 53, 64, 0.72) 0%, rgba(53, 81, 94, 0.58) 55%, rgba(16, 38, 48, 0.75) 100%);
      }
    `}</style>
  );
}
