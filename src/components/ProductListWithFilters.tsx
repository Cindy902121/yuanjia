"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { toCardData } from "@/lib/types/product";
import type { ProductDetailData, ProductTagRef } from "@/lib/types/product";
import type { ProductCategoryOption } from "@/lib/fixtures/categories";
import { trackEvent } from "@/lib/analytics/track";

/** 篩選條件變動後，等使用者停手多久才送出 b2c_search_category，避免每個按鍵／點擊都送一次。 */
const SEARCH_EVENT_DEBOUNCE_MS = 500;

interface ProductListWithFiltersProps {
  products: ProductDetailData[];
  categories: ProductCategoryOption[];
  /** 從 /products?category=<slug> 帶進來的初始分類篩選（見 app/products/page.tsx）；可選。 */
  initialCategorySlug?: string;
}

/** 標籤群組顯示順序；沒列到的群組（理論上不會發生）排在後面。 */
const TAG_GROUP_ORDER = ["食材", "料理方式", "需求特性", "加工方式"];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** 從目前這批商品收集所有出現過的標籤，去重後依群組分區、依 TAG_GROUP_ORDER 排序。 */
function collectTagGroups(products: ProductDetailData[]): [string, ProductTagRef[]][] {
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

/**
 * 商品列表的搜尋／分類／標籤篩選，多選、AND（完全符合）邏輯——見 PRD 5.3.2、6.4，
 * FDD 6.4「多個標籤條件採 AND『全部符合』」，以及 docs/B2C商品展示資料.md §4.1
 * 的測試案例（例如「食材＝鮭魚 AND 加工方式＝調味」）。
 *
 * 分類、標籤都是可複選的切換按鈕（不是單選），選取後互為 AND：已選的每一個分類、
 * 每一個標籤，商品都要同時符合才會出現。目前純前端 Array.filter，接上 Supabase 後
 * 改成呼叫 /api/b2c/products?tags=... 這類查詢，UI 與這層 AND 邏輯不需要大改。
 *
 * 8/15：搜尋字串或篩選條件變動時，防抖動 500ms 後送出 b2c_search_category
 * （見 src/lib/analytics）；只在有實際篩選條件時送，清空篩選不會另外觸發一次。
 * b2c_search_no_result、b2c_filter_no_result 還沒加入 FDD 6.7 白名單，維持
 * 待新增狀態（見 docs/B2C商品展示資料.md §9）。
 *
 * 2026-08-14：套用 design.md §5.2／§5.3 的品牌色彩與字體，跟 B 的 /login 對齊
 * （token 見 src/app/globals.css）。已選取的篩選 chip 用海洋藍實心，呼應
 * design.md §7.1 Primary 按鈕的用法。
 */
export function ProductListWithFilters({
  products,
  categories,
  initialCategorySlug,
}: ProductListWithFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(
    initialCategorySlug ? [initialCategorySlug] : [],
  );
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);

  const tagGroups = useMemo(() => collectTagGroups(products), [products]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = term.length === 0 || product.name.toLowerCase().includes(term);
      const matchesCategories = selectedCategorySlugs.every((slug) =>
        product.categories.some((category) => category.slug === slug),
      );
      const matchesTags = selectedTagSlugs.every((slug) =>
        product.tags.some((tag) => tag.slug === slug),
      );
      return matchesSearch && matchesCategories && matchesTags;
    });
  }, [products, searchTerm, selectedCategorySlugs, selectedTagSlugs]);

  const hasActiveFilters =
    searchTerm.length > 0 || selectedCategorySlugs.length > 0 || selectedTagSlugs.length > 0;

  useEffect(() => {
    if (!hasActiveFilters) {
      return;
    }
    const timeoutId = setTimeout(() => {
      trackEvent({ event_name: "b2c_search_category" });
    }, SEARCH_EVENT_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategorySlugs, selectedTagSlugs, hasActiveFilters]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategorySlugs([]);
    setSelectedTagSlugs([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜尋商品名稱"
            aria-label="搜尋商品名稱"
            className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-600 focus:border-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-ink-600 underline-offset-2 hover:text-brand-ocean-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
            >
              清除篩選
            </button>
          ) : null}
        </div>

        <FilterGroup label="分類">
          {categories.map((category) => (
            <FilterChip
              key={category.slug}
              active={selectedCategorySlugs.includes(category.slug)}
              onClick={() => setSelectedCategorySlugs((current) => toggle(current, category.slug))}
            >
              {category.name}
            </FilterChip>
          ))}
        </FilterGroup>

        {tagGroups.map(([groupName, tags]) => (
          <FilterGroup key={groupName} label={groupName}>
            {tags.map((tag) => (
              <FilterChip
                key={tag.slug}
                active={selectedTagSlugs.includes(tag.slug)}
                onClick={() => setSelectedTagSlugs((current) => toggle(current, tag.slug))}
              >
                {tag.name}
              </FilterChip>
            ))}
          </FilterGroup>
        ))}
      </div>

      <p className="text-xs text-ink-600" aria-live="polite">
        {hasActiveFilters ? `已套用篩選，符合 ${filtered.length} 筆商品` : `顯示全部 ${filtered.length} 筆商品`}
      </p>

      {filtered.length === 0 ? (
        // 對應 PRD「無符合商品」規則——關鍵字搜尋、分類篩選、標籤篩選任何組合造成 0 筆，文案統一。
        <p className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-sm text-ink-600">
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

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <span className="mt-1 w-16 shrink-0 text-xs font-medium text-ink-600">{label}</span>
      <div className="flex flex-1 flex-wrap gap-2" role="group" aria-label={`依${label}篩選`}>
        {children}
      </div>
    </div>
  );
}

function FilterChip({
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
          ? "rounded-full bg-brand-ocean-700 px-3 py-1 text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
          : "rounded-full bg-brand-ocean-050 px-3 py-1 text-xs text-brand-ocean-800 hover:bg-brand-ocean-700/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
      }
    >
      {children}
    </button>
  );
}
