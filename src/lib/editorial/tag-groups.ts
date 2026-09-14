import type { ProductDetailData, ProductTagRef } from "@/lib/types/product";

/**
 * 從目前這批商品收集所有出現過的標籤，去重後依群組分區、依 TAG_GROUP_ORDER
 * 排序。跟 src/components/ProductListWithFilters.tsx 的同名函式邏輯一致。
 *
 * 2026-08-19：從 design-preview/_lib/tag-groups.ts 搬過來（團隊確認正式採用
 * 編輯風後）。刻意放在純模組（沒有 "use client"）——商品詳情頁（Server
 * Component）跟商品列表（Client Component）都要用同一份邏輯，純函式模組兩邊
 * 都能直接 import，不會有 RSC 邊界問題（"use client" 檔案 export 的東西整批
 * 被視為 client 端，Server Component 直接呼叫會出錯）。
 *
 * 2026-09-03（使用者回報「分類」跟「食材」篩選重疊，決定拿掉食材篩選群組）：
 * 目前 5 筆商品的「食材」標籤（魚類／貝類／蝦類）剛好跟「分類」用同一組值，
 * 兩組篩選器看起來完全重複；食材標籤原本設計成比分類更細（例如之後商品
 * 擴充規格書 docs/B2C商品展示資料_完善版.md 就是用「鮭魚」「雪鰈」這種細到
 * 物種的食材標籤），但現有資料還沒細到那個程度，所以現階段先隱藏「食材」
 * 這個篩選群組，不刪除底層 `b2c_tags`／`b2c_product_tags` 資料——之後如果把
 * 食材標籤改細，或商品種類變多真的需要這個篩選維度，把 `HIDDEN_TAG_GROUPS`
 * 這行拿掉即可恢復，不用重新設計。
 *
 * 這裡用「隱藏」而不是從資料庫刪除標籤：拿掉之後，商品詳情頁自己的標籤 pill
 * （見 /products/[slug]/page.tsx，直接讀 `product.tags`，不經過這個函式）
 * 不受影響，該商品的「蝦類」之類標籤還是會顯示、還是可以點進 `/products/tags/[slug]`
 * ——只有「依食材篩選」這個側欄篩選群組被隱藏，不是整個標籤系統消失。
 */
const TAG_GROUP_ORDER = ["食材", "料理方式", "需求特性", "加工方式"];

/** 見上方 2026-09-03 註解：暫時隱藏跟「分類」重疊的「食材」篩選群組。 */
const HIDDEN_TAG_GROUPS = ["食材"];

export function collectTagGroups(products: ProductDetailData[]): [string, ProductTagRef[]][] {
  const seen = new Map<string, ProductTagRef>();
  for (const product of products) {
    for (const tag of product.tags) {
      if (!seen.has(tag.slug)) {
        seen.set(tag.slug, tag);
      }
    }
  }

  const byGroup = new Map<string, ProductTagRef[]>();
  for (const tag of seen.values()) {
    const list = byGroup.get(tag.groupName) ?? [];
    list.push(tag);
    byGroup.set(tag.groupName, list);
  }

  const orderedGroupNames = [
    ...TAG_GROUP_ORDER.filter((name) => byGroup.has(name)),
    ...[...byGroup.keys()].filter((name) => !TAG_GROUP_ORDER.includes(name)),
  ].filter((name) => !HIDDEN_TAG_GROUPS.includes(name));

  return orderedGroupNames.map((name) => [name, byGroup.get(name)!]);
}
