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
import { OceanBackgroundLayer, categoryWatermarkLabel } from "./ocean-background-layer";

/** 篩選條件變動後，等使用者停手多久才送出 b2c_search_category，避免每個按鍵／點擊都送一次。 */
const SEARCH_EVENT_DEBOUNCE_MS = 500;

const OCEAN_BLUE = "#1D3540";
const GROUP_LABEL_COLOR = "#35515E";

/**
 * `/products-preview`——正式 `/products` 頁面（`src/components/editorial/
 * ProductList.tsx` 的 `EditorialProductList`）的 Visual Enhancement 變體。
 *
 * 2026-09-12（使用者要求「Product Listing Page Visual Enhancement」，先建
 * 獨立 Preview，不直接改正式版本）：搜尋／分類／標籤篩選（含 AND 邏輯）、
 * debounce 事件、Active Filter Tag、手機 Bottom Sheet、無障礙 focus-trap——
 * 這些全部**逐字複製**自 `EditorialProductList`，一個字都沒有改，確保這份
 * Preview 呈現的篩選行為跟正式頁面完全一致，使用者看到的差異只在「視覺」。
 *
 * 這次真正新增的東西：
 * 1. `<OceanBackgroundLayer>`——見該檔案，極低存在感的海洋裝飾層＋極輕微
 *    Parallax，蓋住整個篩選＋商品格區塊（不含上面的滿版照片 Hero，那塊
 *    本身已經有真實照片，不需要再疊裝飾）。
 * 2. 商品卡片 Hover：圖片 1→1.02 極慢縮放（`duration-300`，比全站共用的
 *    `.ep-hover-zoom`（1.06 / 700ms）更收斂，這裡刻意不共用那個 class，
 *    避免連帶影響其他還在用 `.ep-hover-zoom` 的頁面）、標題極輕微位移、
 *    新增「VIEW PRODUCT ↗」hover 才浮現的小標籤。加入購物車按鈕本身沿用
 *    既有 `editorialButtonLight`（hover 已經是 Ocean Navy 填色轉場，不需要
 *    另外做）。
 * 3. 分類浮水印：單選一個分類時，`categoryWatermarkLabel()` 算出對應英文
 *    標籤傳給背景層，見 `ocean-background-layer.tsx`。
 *
 * 這個檔案審核通過後，視覺變更會回頭套用到 `EditorialProductList`，這份
 * 檔案不會變成長期並存、各自維護的兩份篩選邏輯——目前階段刻意複製一份是
 * 「不直接動正式頁面」的安全做法，不是最終形態。
 */
interface ProductCategoryOption {
  slug: string;
  name: string;
}

interface OceanProductListProps {
  products: ProductDetailData[];
  categories: ProductCategoryOption[];
  initialCategorySlug?: string;
  initialTagSlugs?: string[];
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function OceanProductList({
  products,
  categories,
  initialCategorySlug,
  initialTagSlugs,
}: OceanProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(
    initialCategorySlug ? [initialCategorySlug] : [],
  );
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(initialTagSlugs ?? []);
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

  const watermarkLabel = categoryWatermarkLabel(selectedCategorySlugs, categories);

  return (
    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
      <OceanBackgroundLayer activeCategoryLabel={watermarkLabel} />

      {/* 桌機側欄：sticky（lg:top-28，避開 76px 高的 sticky Header），手機
          完全不顯示——手機改用下面的觸發列＋Bottom Sheet。 */}
      <aside className="hidden lg:sticky lg:top-28 lg:flex lg:w-56 lg:shrink-0 lg:flex-col">
        <FilterPanel {...filterPanelProps} />
      </aside>

      <div className="relative flex flex-1 flex-col gap-2">
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
          <span className="text-xs text-[#536168]">
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
              className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]"
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
          <p className="border-t border-[#0B1620]/15 py-16 text-center text-sm font-light text-[#536168]">無符合商品</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2">
            {filtered.map((product) => {
              const card = toCardData(product);
              return (
                <FadeInSection key={product.id} className="h-full">
                  <div className="group relative flex h-full flex-col gap-4">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {card.coverImage ? (
                        <Image
                          src={card.coverImage.url}
                          alt={card.coverImage.alt}
                          fill
                          sizes="(min-width: 640px) 45vw, 90vw"
                          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#F6FBFC] text-xs text-[#536168]">
                          無商品圖片
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <h2 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#0B1620] transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:text-[#FF5A36]">
                            {product.name}
                          </h2>
                          <span className="shrink-0 whitespace-nowrap font-[family-name:var(--ep-font-en)] text-[10px] tracking-[0.15em] text-[#FF5A36] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            VIEW PRODUCT ↗
                          </span>
                        </span>
                      </Link>
                      <p className="line-clamp-2 text-sm font-light leading-[1.8] text-[#536168]">{card.shortDescription}</p>

                      <div className="mt-auto flex flex-col gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">
                            NT$ {card.price}
                          </span>
                          {card.inventoryStatus === "out_of_stock" ? (
                            <span className="text-xs tracking-widest text-[#536168]">缺貨</span>
                          ) : null}
                        </div>
                        <div className="relative z-10">
                          <AddToCartButton product={card} className={`${editorialButtonLight} min-h-9 w-full px-4 py-2 text-[11px]`} />
                        </div>
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
                className="flex h-9 w-9 items-center justify-center border border-[#0B1620]/20 text-[#536168] transition-colors hover:border-[#0B1620] hover:text-[#0B1620]"
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
          className="w-full border-b border-[#0B1620]/30 bg-transparent py-2 pr-6 text-sm text-[#0B1620] outline-none transition-colors duration-300 placeholder:text-[#536168] hover:border-[#1D3540] focus:border-[#1D3540]"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute bottom-2.5 right-0 h-3.5 w-3.5 text-[#536168]"
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
            hasActiveFilters ? "text-[#C2401D] hover:text-[#0B1620]" : "cursor-default text-[#536168]/40"
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
        active ? "font-medium text-[#0B1620]" : "font-light text-[#536168] hover:text-[#0B1620]"
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
        className="text-[#536168] transition-colors hover:text-[#FF5A36]"
      >
        ×
      </button>
    </span>
  );
}
