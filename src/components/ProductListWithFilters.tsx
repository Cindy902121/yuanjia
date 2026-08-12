"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { toCardData } from "@/lib/types/product";
import type { ProductDetailData } from "@/lib/types/product";
import type { ProductCategoryOption } from "@/lib/fixtures/categories";

interface ProductListWithFiltersProps {
  products: ProductDetailData[];
  categories: ProductCategoryOption[];
}

/**
 * 純前端搜尋／分類篩選（見 docs/B2C商品展示資料.md §4、§9）。
 *
 * - 目前直接在傳入的 products 陣列上做 Array.filter，沒有打任何 API；接上 Supabase
 *   後，這裡的篩選邏輯要換成伺服器查詢（依 category_slug／關鍵字），元件的 UI／互動
 *   不需要大改。
 * - 搜尋與分類是 AND 條件（同時符合才顯示），呼應文件裡「多條件全部符合」的規則。
 * - 篩選是用 ProductDetailData（有 categories）做的，但實際渲染卡片時只丟
 *   ProductCardData 給 <ProductCard />——分類本來就不該出現在卡片上（見
 *   docs/b2c-product-field-spec-v1.md §1.6，卡片只顯示圖片／名稱／價格／標籤）。
 * - TODO：之後接 b2c_search_category、b2c_search_no_result、b2c_filter_no_result
 *   事件（見 docs/B2C商品展示資料.md §9），目前這些事件都還沒有白名單／API 可送。
 */
export function ProductListWithFilters({ products, categories }: ProductListWithFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = term.length === 0 || product.name.toLowerCase().includes(term);
      const matchesCategory =
        selectedCategorySlug === null ||
        product.categories.some((category) => category.slug === selectedCategorySlug);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategorySlug]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜尋商品名稱"
          aria-label="搜尋商品名稱"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-zinc-700"
        />

        <div className="flex flex-wrap gap-2" role="group" aria-label="依分類篩選">
          <CategoryButton
            active={selectedCategorySlug === null}
            onClick={() => setSelectedCategorySlug(null)}
          >
            全部
          </CategoryButton>
          {categories.map((category) => (
            <CategoryButton
              key={category.slug}
              active={selectedCategorySlug === category.slug}
              onClick={() => setSelectedCategorySlug(category.slug)}
            >
              {category.name}
            </CategoryButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        // 對應 PRD「無符合商品」規則——不論是關鍵字搜尋還是分類篩選造成 0 筆，文案統一。
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          無符合商品
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={toCardData(product)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-zinc-50 dark:text-zinc-900"
          : "rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }
    >
      {children}
    </button>
  );
}
