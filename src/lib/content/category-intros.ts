/**
 * /products/categories/[slug] 頁面用的分類導言文字（2026-08-25，SEO／AEO／GEO
 * 內容深度補強——使用者反饋分類頁只有商品格線、沒有導言文字，內容太薄）。
 *
 * 分類「slug」本身就是 `b2c_products.category` 的中文文字（見
 * src/lib/supabase/products.ts 檔頭說明，正式資料庫目前沒有獨立的分類表）。
 * 這裡只覆蓋目前 5 筆種子商品實際會用到的 3 個分類（魚類／蝦類／貝類）；
 * 之後 C 擴充商品、出現這份對照表沒有的新分類值時，`getCategoryIntro()`
 * 會退回 `DEFAULT_INTRO`（通用但仍然是實質內容的一段話，不是空白），
 * 頁面不會因為查不到而整段消失，也不用因為新增分類就同時改頁面元件。
 */
const CATEGORY_INTROS: Record<string, string> = {
  魚類:
    "元家精選來自台灣與挪威等優質產地的鮮凍魚類，油脂細緻、肉質鮮甜，涵蓋鮭魚、虱目魚、鯖魚等家常魚種，煎烤、氣炸、清蒸皆宜，是日常餐桌上簡單就能上手的海鮮選擇。",
  蝦類:
    "元家嚴選全球優質蝦種，肉質彈牙鮮甜、蝦膏飽滿，適合火鍋、鹽烤與各式家常料理，讓每一餐都吃得到大海的鮮甜滋味。",
  貝類:
    "元家精選台灣與各國優質貝類，殼薄肉厚、湯汁鮮甜，簡單烹調就能帶出天然鮮味，是煮湯與義式料理的最佳選擇。",
};

const DEFAULT_INTRO =
  "元家嚴選全球水產與即食料理，從採購、加工到冷鏈配送層層把關，替每一餐守住新鮮與品質。";

export function getCategoryIntro(categoryName: string): string {
  return CATEGORY_INTROS[categoryName] ?? DEFAULT_INTRO;
}
