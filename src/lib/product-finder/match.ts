export interface FinderResultProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
}

/**
 * 依已選答案（每步一個 option key，"any" 或未選代表不篩選）呼叫 C 已經寫好的
 * `GET /api/b2c/product-finder?conditions=...`（見 src/app/api/b2c/product-finder/route.ts、
 * C 的 src/lib/product-finder.ts B2C_FINDER_CONDITIONS）。
 *
 * 2026-08-17：原本刻意「不」打這支 API，改用本機 fixture 資料比對——因為當時
 * /products 系列頁面還是 fixture，這支 API 查的是另一組真實 Supabase 種子資料，
 * 兩邊對不上，點篩選結果會 404（詳見當時 config.ts／match.ts 的檔頭說明）。
 * 現在 /products 系列頁面已經改接同一個正式 Supabase（C 本週排程要求），這個
 * 落差不存在了，改回打真的 API——這是原本就規劃好、等時機到了要做的事，不是
 * 臨時決定。
 *
 * config.ts 每個選項的 `key` 本來就對齊 C 的 B2C_FINDER_CONDITIONS 命名（當初
 * 設計就是為了這一天鋪路，見 config.ts 檔頭說明），這裡直接把使用者選的 key
 * 串成 `conditions` 查詢字串，不需要另外轉換。
 *
 * 真實資料庫目前標籤很稀疏（只有 10 個標籤、5 筆商品），部分選項組合現在會
 * 合理地回傳 0 筆——這不是 bug，是資料量還小，B2CHelpWidget 本來就有處理
 * 「無符合商品」的畫面。
 */
export async function findProductsByAnswers(
  selectedKeys: string[],
): Promise<FinderResultProduct[]> {
  if (selectedKeys.length === 0) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/b2c/product-finder?conditions=${encodeURIComponent(selectedKeys.join(","))}`,
    );
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as {
      products?: Array<{ id: string; slug: string; name: string; price: number | string }>;
    };
    return (data.products ?? []).map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
    }));
  } catch {
    return [];
  }
}
