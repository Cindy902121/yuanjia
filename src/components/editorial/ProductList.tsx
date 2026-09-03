"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import type { ProductDetailData } from "@/lib/types/product";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { editorialButtonLight } from "@/lib/editorial/styles";
import { collectTagGroups } from "@/lib/editorial/tag-groups";
import { trackEvent } from "@/lib/analytics/track";

/** 篩選條件變動後，等使用者停手多久才送出 b2c_search_category，避免每個按鍵／點擊都送一次。 */
const SEARCH_EVENT_DEBOUNCE_MS = 500;

/**
 * 商品列表的篩選／搜尋／清單，日系雜誌編排風（原
 * design-preview/products/_components/EditorialProductList.tsx，2026-08-19
 * 團隊確認正式採用後搬到這裡，取代 src/components/ProductListWithFilters.tsx
 * 在 /products 頁面的位置——ProductListWithFilters 本身沒有刪除，
 * /products/categories/[slug]、/products/tags/[slug] 這兩個還沒重新設計的頁面
 * 繼續沿用舊版，見 src/app/products/page.tsx 的檔頭說明。
 *
 * 篩選邏輯（搜尋字串、分類／標籤多選 AND）**完全照搬**
 * ProductListWithFilters.tsx，不是重新設計一套規則。
 *
 * 視覺：
 * - 篩選 chip 是文字＋底線（選取時底線變粗、文字變點綴色），不是圓角實心藥丸。
 * - 商品清單是 2 欄網格、無編號（2026-08-19 使用者反饋「之後產品會比較多，
 *   希望去掉編號、一橫列兩個商品」，取代原本單欄數字編號清單）。
 * - 加入購物車按鈕直接重用 src/components/AddToCartButton.tsx（真的購物車
 *   邏輯），只是透過 `className` prop 換掉視覺樣式。
 * - 商品卡整體點擊用 stretched-link（跟正式 ProductCard 同一個無障礙模式）。
 *
 * `initialCategorySlug`／`initialTagSlug`：接住 `?category=`／`?tag=` 查詢
 * 字串（跟 ProductListWithFilters 的 `initialCategorySlug` 同一個模式，見
 * src/app/products/page.tsx）——商品詳情頁左側的篩選連結會用這個查詢字串導
 * 過來。
 *
 * 2026-08-21（補回退版時遺漏的事件）：8/15 就做好的「搜尋字串或篩選條件變動
 * 後，防抖動 500ms 送出 b2c_search_category」邏輯，改版搬到這個檔案時漏掉
 * 沒有一起搬——查 FDD 6.7 事件白名單時才發現這個事件從沒被觸發過。這裡照搬
 * 原本 ProductListWithFilters.tsx 的做法（見下方 useEffect），行為完全不變：
 * 只在有實際篩選條件時送、清空篩選不會另外觸發一次。
 */
interface ProductCategoryOption {
  slug: string;
  name: string;
}

interface EditorialProductListProps {
  products: ProductDetailData[];
  categories: ProductCategoryOption[];
  initialCategorySlug?: string;
  initialTagSlug?: string;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function EditorialProductList({
  products,
  categories,
  initialCategorySlug,
  initialTagSlug,
}: EditorialProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(
    initialCategorySlug ? [initialCategorySlug] : [],
  );
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(initialTagSlug ? [initialTagSlug] : []);

  const tagGroups = useMemo(() => collectTagGroups(products), [products]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matched = products.filter((product) => {
      const matchesSearch = term.length === 0 || product.name.toLowerCase().includes(term);
      const matchesCategories = selectedCategorySlugs.every((slug) =>
        product.categories.some((category) => category.slug === slug),
      );
      const matchesTags = selectedTagSlugs.every((slug) => product.tags.some((tag) => tag.slug === slug));
      return matchesSearch && matchesCategories && matchesTags;
    });
    return sortByAvailability(matched);
  }, [products, searchTerm, selectedCategorySlugs, selectedTagSlugs]);

  const hasActiveFilters = searchTerm.length > 0 || selectedCategorySlugs.length > 0 || selectedTagSlugs.length > 0;

  useEffect(() => {
    if (!hasActiveFilters) {
      return;
    }
    const timeoutId = setTimeout(() => {
      trackEvent({ event_name: "b2c_search_category" });
    }, SEARCH_EVENT_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategorySlugs, selectedTagSlugs, hasActiveFilters]);

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
      {/* 左側篩選欄：文字＋底線 toggle，不是圓角 pill。
          2026-08-25（響應式稽核發現）：手機版 order-2／桌機版 lg:order-1——
          窄螢幕下 DOM 順序不變（螢幕閱讀器／鍵盤 Tab 還是先進篩選欄，篩選欄
          在邏輯上仍是這個區塊的入口，這個順序沒問題），但視覺順序改成先看到
          商品，不用先滑過整組篩選才看到商品，這是純 CSS `order` 排序，不影響
          任何篩選／搜尋邏輯。桌機維持原樣（篩選欄在左）。 */}
      <aside className="order-2 flex w-full flex-col gap-8 lg:order-1 lg:sticky lg:top-28 lg:w-56 lg:shrink-0">
        <div className="flex flex-col gap-2">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜尋商品名稱"
            aria-label="搜尋商品名稱"
            className="w-full border-b border-[#0B1620]/30 bg-transparent py-2 text-sm text-[#0B1620] outline-none placeholder:text-[#5C7383] focus:border-[#0B1620]"
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategorySlugs([]);
                setSelectedTagSlugs([]);
              }}
              className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383] hover:text-[#FF5A36]"
            >
              CLEAR
            </button>
          ) : null}
        </div>

        <EditorialFilterGroup label="分類">
          {categories.map((category) => (
            <EditorialFilterToggle
              key={category.slug}
              active={selectedCategorySlugs.includes(category.slug)}
              onClick={() => setSelectedCategorySlugs((current) => toggle(current, category.slug))}
            >
              {category.name}
            </EditorialFilterToggle>
          ))}
        </EditorialFilterGroup>

        {tagGroups.map(([groupName, tags]) => (
          <EditorialFilterGroup key={groupName} label={groupName}>
            {tags.map((tag) => (
              <EditorialFilterToggle
                key={tag.slug}
                active={selectedTagSlugs.includes(tag.slug)}
                onClick={() => setSelectedTagSlugs((current) => toggle(current, tag.slug))}
              >
                {tag.name}
              </EditorialFilterToggle>
            ))}
          </EditorialFilterGroup>
        ))}
      </aside>

      {/* 右側商品清單：2 欄網格，無編號。手機版 order-1，見上方 aside 的說明。 */}
      <div className="order-1 flex flex-1 flex-col gap-2 lg:order-2">
        <p className="mb-6 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]" aria-live="polite">
          {hasActiveFilters ? `${filtered.length} RESULTS` : `${filtered.length} ITEMS`}
        </p>

        {filtered.length === 0 ? (
          <p className="border-t border-[#0B1620]/15 py-16 text-center text-sm font-light text-[#5C7383]">無符合商品</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2">
            {filtered.map((product) => {
              const card = toCardData(product);
              return (
                <FadeInSection key={product.id}>
                  <div className="group relative flex flex-col gap-4">
                    <div className="ep-hover-zoom relative aspect-[4/3]">
                      {card.coverImage ? (
                        <Image src={card.coverImage.url} alt={card.coverImage.alt} fill sizes="(min-width: 640px) 45vw, 90vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#F6FBFC] text-xs text-[#5C7383]">
                          無商品圖片
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
                      >
                        <h2 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#0B1620] group-hover:text-[#FF5A36]">
                          {product.name}
                        </h2>
                      </Link>
                      <p className="line-clamp-2 text-sm font-light leading-[1.8] text-[#5C7383]">{card.shortDescription}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-4">
                        <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">
                          NT$ {card.price}
                        </span>
                        {card.inventoryStatus === "out_of_stock" ? (
                          <span className="text-xs tracking-widest text-[#5C7383]">缺貨</span>
                        ) : null}
                      </div>
                      <div className="relative z-10 mt-1">
                        <AddToCartButton product={card} className={`${editorialButtonLight} min-h-9 w-full px-4 py-2 text-[11px]`} />
                      </div>
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EditorialFilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">{label}</span>
      <div className="flex flex-col gap-2" role="group" aria-label={`依${label}篩選`}>
        {children}
      </div>
    </div>
  );
}

function EditorialFilterToggle({
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
      className={`w-fit border-b pb-0.5 text-left text-sm font-light transition-colors ${
        active ? "border-[#FF5A36] text-[#FF5A36]" : "border-transparent text-[#5C7383] hover:border-[#0B1620]/30"
      }`}
    >
      {children}
    </button>
  );
}
