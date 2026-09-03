"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import type { ProductDetailData, ProductTagRef } from "@/lib/types/product";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { editorialButtonLight } from "@/lib/editorial/styles";
import { collectTagGroups } from "@/lib/editorial/tag-groups";
import { trackEvent } from "@/lib/analytics/track";

/** 篩選條件變動後，等使用者停手多久才送出 b2c_search_category，避免每個按鍵／點擊都送一次。 */
const SEARCH_EVENT_DEBOUNCE_MS = 500;

/** 「Ocean Blue」強調色——跟首頁 Ocean Gradient（src/app/(b2c)/_ocean/ocean-styles.tsx
 * 的 .op-descent）共用同一個色票，不是另外發明的新顏色。用在 hover／選取狀態的
 * 指示條、打勾記號、搜尋框 focus 底線；「Dark Blue Gray」用在篩選 Group 標籤，
 * 同樣是 Ocean Gradient 既有的一階，比目前全站慣用的 mist（#5C7383）再深一點。 */
const OCEAN_BLUE = "#1D3540";
const GROUP_LABEL_COLOR = "#35515E";

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
 * 加入購物車按鈕直接重用 src/components/AddToCartButton.tsx（真的購物車
 * 邏輯），只是透過 `className` prop 換掉視覺樣式。商品卡整體點擊用
 * stretched-link（跟正式 ProductCard 同一個無障礙模式）。
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
 *
 * 2026-09（使用者要求「改善 Filter Sidebar 的 UX/UI 與篩選狀態呈現」——只動
 * 這個檔案的 JSX／樣式，`filtered`／`toggle`／debounce 這三塊篩選邏輯本身
 * 一個字都沒改）：
 * - 篩選選項從純底線文字改成明確的 Default／Hover／Selected 三態（見
 *   `EditorialFilterToggle`），搜尋框加上圖示＋focus 變成 Ocean Blue，
 *   新增「篩選條件／清除全部」標頭列（原本的 CLEAR 按鈕沒有篩選時整個消失，
 *   現在改成常駐但降權，比較容易被發現），新增可個別移除的 Active Filter
 *   Tag（`ActiveFilterChip`），商品清單上方的「N ITEMS」擴充成完整的
 *   Result Header。
 * - 桌機／手機分成兩種呈現：桌機維持既有的 sticky 側欄；手機原本是「整組
 *   篩選欄用 CSS order 排到商品下方、一直都在畫面上」，改成「篩選」觸發列
 *   ＋ Bottom Sheet（沿用 CartDrawer.tsx 已經驗證過的 dialog／focus-trap／
 *   Esc／backdrop 模式，只是方向從側邊滑入改成由下往上，見
 *   `MobileFilterSheet`）。兩邊實際的篩選選項＋搜尋欄＋清除全部都是同一個
 *   `FilterPanel`，不是分別維護兩份重複的 JSX。
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);

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

  function clearAll() {
    setSearchTerm("");
    setSelectedCategorySlugs([]);
    setSelectedTagSlugs([]);
  }

  /** Active Filter Tag 清單——每個 tag 對應搜尋字串或一個已選的分類／標籤，
   * 各自帶一個 onRemove（只清掉自己那一個，不是整組清空）。 */
  const activeFilterList = useMemo(() => {
    const list: { key: string; label: string; onRemove: () => void }[] = [];
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length > 0) {
      list.push({ key: "search", label: `「${trimmedSearch}」`, onRemove: () => setSearchTerm("") });
    }
    for (const slug of selectedCategorySlugs) {
      const category = categories.find((item) => item.slug === slug);
      if (!category) continue;
      list.push({
        key: `category-${slug}`,
        label: category.name,
        onRemove: () => setSelectedCategorySlugs((current) => current.filter((item) => item !== slug)),
      });
    }
    const allTags = tagGroups.flatMap(([, tags]) => tags);
    for (const slug of selectedTagSlugs) {
      const tag = allTags.find((item) => item.slug === slug);
      if (!tag) continue;
      list.push({
        key: `tag-${slug}`,
        label: tag.name,
        onRemove: () => setSelectedTagSlugs((current) => current.filter((item) => item !== slug)),
      });
    }
    return list;
  }, [searchTerm, selectedCategorySlugs, selectedTagSlugs, categories, tagGroups]);

  function closeMobileFilters() {
    setMobileFiltersOpen(false);
    mobileTriggerRef.current?.focus();
  }

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return;
    }

    mobileCloseButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileFilters();
        return;
      }
      if (event.key !== "Tab" || !mobilePanelRef.current) {
        return;
      }
      const focusable = mobilePanelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileFiltersOpen]);

  const filterPanelProps = {
    searchTerm,
    onSearchChange: setSearchTerm,
    hasActiveFilters,
    onClearAll: clearAll,
    categories,
    selectedCategorySlugs,
    onToggleCategory: (slug: string) => setSelectedCategorySlugs((current) => toggle(current, slug)),
    tagGroups,
    selectedTagSlugs,
    onToggleTag: (slug: string) => setSelectedTagSlugs((current) => toggle(current, slug)),
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
      {/* 桌機側欄：sticky（lg:top-28，避開 76px 高的 sticky Header），手機
          完全不顯示——手機改用下面的觸發列＋Bottom Sheet。 */}
      <aside className="hidden lg:sticky lg:top-28 lg:flex lg:w-56 lg:shrink-0 lg:flex-col">
        <FilterPanel {...filterPanelProps} />
      </aside>

      <div className="flex flex-1 flex-col gap-2">
        {/* 手機篩選觸發列：取代原本「整組篩選欄用 CSS order 排到商品下方」的
            做法，改成一個緊湊的列，點了才展開完整篩選內容。 */}
        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          aria-haspopup="dialog"
          className="flex items-center justify-between border-y border-[#0B1620]/15 py-3 text-left lg:hidden"
        >
          <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">篩選</span>
          <span className="text-xs text-[#5C7383]">
            {activeFilterList.length > 0 ? `目前 ${activeFilterList.length} 個條件` : "尚未套用條件"}
          </span>
        </button>

        {/* Result Header：所有商品／篩選結果 ＋ 數量，下方是可個別移除的
            Active Filter Tag（使用者要求的「Result Feedback」）。 */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-[family-name:var(--ep-font-serif)] text-lg font-light text-[#0B1620]">
              {hasActiveFilters ? "篩選結果" : "所有商品"}
            </p>
            <p
              className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]"
              aria-live="polite"
            >
              {filtered.length} {hasActiveFilters ? "RESULTS" : "ITEMS"}
            </p>
          </div>

          {activeFilterList.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterList.map((filter) => (
                <ActiveFilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
              ))}
            </div>
          ) : null}
        </div>

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

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            onClick={closeMobileFilters}
            className="absolute inset-0 bg-[#0B1620]/40 motion-safe:animate-[fade-in_150ms_ease-out]"
          />
          <div
            ref={mobilePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="篩選商品"
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-y-auto rounded-t-lg bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620] shadow-[0_-16px_40px_rgba(11,22,32,0.16)] motion-safe:animate-[slide-in-up_200ms_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-[#0B1620]/15 px-6 py-5">
              <h2 className="font-[family-name:var(--ep-font-serif)] text-lg font-light tracking-[0.03em] text-[#0B1620]">
                篩選商品
              </h2>
              <button
                ref={mobileCloseButtonRef}
                type="button"
                onClick={closeMobileFilters}
                aria-label="關閉篩選"
                className="flex h-9 w-9 items-center justify-center border border-[#0B1620]/20 text-[#5C7383] transition-colors hover:border-[#0B1620] hover:text-[#0B1620]"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-6">
              <FilterPanel {...filterPanelProps} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  categories: ProductCategoryOption[];
  selectedCategorySlugs: string[];
  onToggleCategory: (slug: string) => void;
  tagGroups: [string, ProductTagRef[]][];
  selectedTagSlugs: string[];
  onToggleTag: (slug: string) => void;
}

/** 桌機側欄與手機 Bottom Sheet 共用的實際篩選內容（搜尋欄＋標頭列＋
 * 分類／料理方式／需求特性），純 props 驅動、不持有自己的 state，確保兩邊
 * 顯示的是同一份篩選狀態，不是各自獨立的兩份。 */
function FilterPanel({
  searchTerm,
  onSearchChange,
  hasActiveFilters,
  onClearAll,
  categories,
  selectedCategorySlugs,
  onToggleCategory,
  tagGroups,
  selectedTagSlugs,
  onToggleTag,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜尋商品名稱"
          aria-label="搜尋商品名稱"
          className="w-full border-b border-[#0B1620]/30 bg-transparent py-2 pr-6 text-sm text-[#0B1620] outline-none transition-colors duration-300 placeholder:text-[#5C7383] hover:border-[#1D3540] focus:border-[#1D3540]"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute bottom-2.5 right-0 h-3.5 w-3.5 text-[#5C7383]"
        >
          <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <line x1="9.8" y1="9.8" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex items-center justify-between border-b border-[#0B1620]/10 pb-3">
        <span
          className="font-[family-name:var(--ep-font-en)] text-xs font-medium tracking-widest"
          style={{ color: GROUP_LABEL_COLOR }}
        >
          篩選條件
        </span>
        <button
          type="button"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
          className={`font-[family-name:var(--ep-font-en)] text-xs tracking-widest transition-colors ${
            hasActiveFilters ? "text-[#FF5A36] hover:text-[#0B1620]" : "cursor-default text-[#5C7383]/40"
          }`}
        >
          清除全部
        </button>
      </div>

      <div className="flex flex-col divide-y divide-[#0B1620]/10">
        <div className="pb-6 first:pt-0">
          <EditorialFilterGroup label="分類">
            {categories.map((category) => (
              <EditorialFilterToggle
                key={category.slug}
                active={selectedCategorySlugs.includes(category.slug)}
                onClick={() => onToggleCategory(category.slug)}
              >
                {category.name}
              </EditorialFilterToggle>
            ))}
          </EditorialFilterGroup>
        </div>

        {tagGroups.map(([groupName, tags]) => (
          <div key={groupName} className="py-6">
            <EditorialFilterGroup label={groupName}>
              {tags.map((tag) => (
                <EditorialFilterToggle
                  key={tag.slug}
                  active={selectedTagSlugs.includes(tag.slug)}
                  onClick={() => onToggleTag(tag.slug)}
                >
                  {tag.name}
                </EditorialFilterToggle>
              ))}
            </EditorialFilterGroup>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorialFilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span
        className="font-[family-name:var(--ep-font-en)] text-xs font-medium tracking-widest"
        style={{ color: GROUP_LABEL_COLOR }}
      >
        {label}
      </span>
      <div className="flex flex-col gap-2.5" role="group" aria-label={`依${label}篩選`}>
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
      className={`group relative flex w-fit items-center gap-1.5 py-0.5 pl-3 text-left text-sm transition-colors ${
        active ? "font-medium text-[#0B1620]" : "font-light text-[#5C7383] hover:text-[#0B1620]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-[2px] origin-center scale-y-0 bg-[#1D3540]/60 transition-transform duration-200 group-hover:scale-y-100 ${
          active ? "!scale-y-100 !bg-[#1D3540]" : ""
        }`}
      />
      {children}
      {active ? (
        <span aria-hidden="true" style={{ color: OCEAN_BLUE }}>
          ✓
        </span>
      ) : null}
    </button>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#0B1620]/20 bg-[#EAF4F8]/70 px-2.5 py-1 text-xs text-[#0B1620]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`移除${label}篩選`}
        className="text-[#5C7383] transition-colors hover:text-[#FF5A36]"
      >
        ×
      </button>
    </span>
  );
}
