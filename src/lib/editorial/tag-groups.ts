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
 */
const TAG_GROUP_ORDER = ["食材", "料理方式", "需求特性", "加工方式"];

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
  ];

  return orderedGroupNames.map((name) => [name, byGroup.get(name)!]);
}
