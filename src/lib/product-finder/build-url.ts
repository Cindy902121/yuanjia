import { B2C_FINDER_CONDITIONS } from "@/lib/product-finder";

/**
 * 把 B2CHelpWidget 需求釐清小工具已選的答案 key，轉成 `/products` 能懂的查詢
 * 字串（P1-1「B2C Finder 多筆結果導流」，C 提出）。
 *
 * 直接重用 `B2C_FINDER_CONDITIONS`（C 已經寫好、`/api/b2c/product-finder`
 * 自己也在用同一份對照表）決定每個 key 該變成 `?category=` 還是 `?tag=`，
 * 不另外維護一份重複的對照邏輯：
 * - `type: "category"`：FINDER_STEPS 設計上最多只會選到一個（見
 *   config.ts「想吃哪一類？」那一步），寫入 `category` 參數。
 * - `type: "tag"`：可能有多個（料理方式、在意的需求、加工偏好三步都是 tag），
 *   各自 `append` 成多個 `tag` 參數——`/products/page.tsx` 已經在同一批修改
 *   補上多個 `?tag=` 的支援，不會再像修之前那樣互相蓋掉。
 *
 * 不認得的 key（理論上不會發生，`selectedKeys` 一定是 FINDER_STEPS 出的
 * 選項）直接跳過，不丟例外，維持這個函式對呼叫端來說是純粹、不會失敗的
 * 字串轉換。
 */
export function buildProductsUrl(selectedKeys: string[]): string {
  const params = new URLSearchParams();

  for (const key of selectedKeys) {
    const condition = B2C_FINDER_CONDITIONS[key as keyof typeof B2C_FINDER_CONDITIONS];
    if (!condition) {
      continue;
    }
    if (condition.type === "category") {
      params.set("category", condition.value);
    } else if (condition.type === "tag") {
      params.append("tag", condition.value);
    }
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}
