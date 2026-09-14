/**
 * `/ui-preview` 專用樣式，完全獨立於正式站的
 * `src/components/editorial/EditorialStyles.tsx`——不 import、不共用任何
 * class 名稱（全部加 `up-` 前綴，"UI Preview" 縮寫），確保這份提案不會
 * 意外覆蓋或被正式站的 CSS 影響，反之亦然。
 *
 * 色彩系統（見 page.tsx 檔頭分析）：
 * --up-abyss   #071B2B  深海，Hero／收尾深色區
 * --up-glacier #EAF4F8  冰川藍，全站淺色區塊統一底色（取代原本白／米色交替）
 * --up-frost   #F6FBFC  卡片／內容區塊更亮一階的白，营造層次
 * --up-mist    #536168  次要文字（取代原本的 #8a8a8a，帶一點藍灰調更符合海洋主題）
 * --up-ink     #0B1620  主要文字
 * --up-coral   #FF5A36  CTA／強調數字／少量點綴，唯一的暖色高飽和色
 * --up-salmon  #FFB199  商品標籤／hover 光暈的柔和暖色
 *
 * 字體沿用全站已註冊的 --ep-font-serif／--ep-font-sans／--ep-font-en
 * （見 src/lib/editorial/fonts.ts，root layout 已經掛好，這裡不用重新載入）。
 */
export function UiPreviewStyles() {
  return (
    <style>{`
      .up-root {
        --up-abyss: #071B2B;
        --up-ocean: #0F3350;
        --up-glacier: #EAF4F8;
        --up-frost: #F6FBFC;
        --up-mist: #536168;
        --up-ink: #0B1620;
        --up-coral: #FF5A36;
        --up-salmon: #FFB199;
        --up-line: rgba(11, 22, 32, 0.1);
        background: var(--up-glacier);
        color: var(--up-ink);
      }

      /* 捲動淡入：比正式站的 .ep-fade-in 多了輕微縮放，且用 ease-out（不 overshoot），
         走精品調性，不是可愛彈跳感。 */
      .up-reveal {
        opacity: 0;
        transform: translateY(36px) scale(0.98);
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .up-reveal.is-visible { opacity: 1; transform: translateY(0) scale(1); }
      .up-reveal-d1 { transition-delay: 0.06s; }
      .up-reveal-d2 { transition-delay: 0.14s; }
      .up-reveal-d3 { transition-delay: 0.22s; }
      .up-reveal-d4 { transition-delay: 0.3s; }
      .up-reveal-d5 { transition-delay: 0.38s; }

      /* 商品圖片 hover：放大＋一道光澤斜向掃過（sheen），不是單純 scale。 */
      .up-media { position: relative; overflow: hidden; }
      .up-media img { transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1); }
      .up-media::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
        transform: translateX(-120%);
        transition: transform 0.9s ease;
        pointer-events: none;
      }
      .up-media:hover img { transform: scale(1.08); }
      .up-media:hover::after { transform: translateX(120%); }

      /* CTA：箭頭滑動＋極輕微放大，跟現有 editorialButtonDark 的「純變色」不同。 */
      .up-cta {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        transition: transform 0.3s ease;
      }
      .up-cta:hover { transform: translateX(2px); }
      .up-cta .up-cta-arrow { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
      .up-cta:hover .up-cta-arrow { transform: translateX(8px); }

      /* Nav 底線：hover 時由左至右展開，取代純變色。 */
      .up-nav-link { position: relative; }
      .up-nav-link::after {
        content: "";
        position: absolute;
        left: 0; right: 0; bottom: -6px;
        height: 1px;
        background: currentColor;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
      }
      .up-nav-link:hover::after { transform: scaleX(1); }

      /* Hero 視差層：transform 由 client component 依捲動量寫入 inline style。 */
      .up-parallax { will-change: transform; }

      /* 波浪分隔：Hero 深色區到冰川藍區塊的過渡，避免死板水平線。 */
      .up-wave { display: block; width: 100%; height: 72px; line-height: 0; }
      .up-wave svg { width: 100%; height: 100%; display: block; }

      /* 商品卡浮動價格標：故意讓它「壓」在圖片邊緣外，不是乖乖待在卡片內。 */
      .up-price-tag {
        position: absolute;
        left: 18px;
        bottom: -16px;
        z-index: 2;
        background: var(--up-frost);
        border: 1px solid var(--up-line);
        padding: 8px 16px;
        box-shadow: 0 12px 28px -12px rgba(7, 27, 43, 0.35);
      }

      @media (prefers-reduced-motion: reduce) {
        .up-reveal { opacity: 1; transform: none; transition: none; }
        .up-media img, .up-media::after, .up-cta, .up-cta-arrow, .up-parallax {
          transition: none !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}
