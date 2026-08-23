/**
 * 編輯風共用的按鈕樣式（原 design-preview/_lib/styles.ts，2026-08-19 團隊確認
 * 正式採用後搬到這裡，給全站共用）。
 *
 * 全部**故意不含** `rounded-*`——Tailwind 預設就是直角，符合「九十度方框」的
 * 要求。
 *
 * 兩個版本：
 * - `editorialButtonDark`：用在深色圖片疊層上（例如各頁 Hero／Banner），白色
 *   外框、字白色，hover 時填滿白底、文字變深色。
 * - `editorialButtonLight`：用在一般淺色背景上（加入購物車、其他 CTA），墨色
 *   外框，hover 時填滿墨色、文字變白。
 */
export const editorialButtonDark =
  "inline-flex items-center justify-center gap-2 border border-white px-8 py-3.5 font-[family-name:var(--ep-font-en)] text-sm tracking-[0.15em] text-white transition-colors duration-300 hover:bg-white hover:text-[#2b2b2b]";

export const editorialButtonLight =
  "inline-flex items-center justify-center gap-2 border border-[#2b2b2b] px-6 py-2.5 font-[family-name:var(--ep-font-en)] text-xs tracking-[0.15em] text-[#2b2b2b] transition-colors duration-300 hover:bg-[#2b2b2b] hover:text-white disabled:cursor-not-allowed disabled:border-[#2b2b2b]/30 disabled:text-[#2b2b2b]/40 disabled:hover:bg-transparent disabled:hover:text-[#2b2b2b]/40";

/**
 * 常駐填滿的主要 CTA（購物車「前往結帳」、結帳「送出訂單」這種頁面上最主要的
 * 下一步動作）——`editorialButtonDark` 是「外框 → hover 才填滿」，用在淺色
 * 背景上不夠明確；這個版本直接填滿墨色，hover 才變點綴色，強調「這是這個頁面
 * 最主要的按鈕」。
 */
export const editorialButtonSolid =
  "inline-flex items-center justify-center gap-2 border border-[#2b2b2b] bg-[#2b2b2b] px-6 py-3 font-[family-name:var(--ep-font-en)] text-sm tracking-[0.15em] text-white transition-colors hover:border-[#3E5C6B] hover:bg-[#3E5C6B] disabled:cursor-not-allowed disabled:border-[#2b2b2b]/30 disabled:bg-[#2b2b2b]/30";

/** 商品詳情頁數量選擇器的方框，跟按鈕系統同一套「直角＋細框」語言。 */
export const editorialStepperWrap = "flex items-center border border-[#2b2b2b]/30";
export const editorialStepperButton =
  "flex h-11 w-11 items-center justify-center text-[#2b2b2b] transition-colors hover:bg-[#F3F1EB] disabled:cursor-not-allowed disabled:text-[#2b2b2b]/30 disabled:hover:bg-transparent";
export const editorialStepperInput =
  "h-11 w-14 border-x border-[#2b2b2b]/30 bg-transparent text-center text-sm text-[#2b2b2b] outline-none disabled:text-[#2b2b2b]/40";
