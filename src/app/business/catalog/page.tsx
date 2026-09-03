import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import CatalogInquiryWorkspace from "./catalog-inquiry-workspace";
import B2bCatalogTracker from "./catalog-tracker";
import BusinessHeader from "./business-header";
import CatalogJourneyPrototype from "./catalog-journey-prototype";
import CatalogProcurementPrototype from "./catalog-procurement-prototype";
import CatalogProcurementCompactPrototype from "./catalog-procurement-compact-prototype";
import CatalogSearchExperiencePrototype from "./catalog-search-experience-prototype";
import CatalogTaxonomySearchPrototype from "./catalog-taxonomy-search-prototype";
import CatalogWireframePrototype from "./catalog-wireframe-prototype";
import { type B2BTag, getB2BAccess, getB2BCatalogData } from "@/lib/b2b/catalog";
import { getNewsArticle } from "../news/news-data";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "企業型錄 | 元家",
};

type CatalogPageProps = {
  searchParams: Promise<{
    brand?: string;
    category?: string;
    q?: string;
    prototype?: string;
    project?: string;
    tag?: string | string[];
  }>;
};

function asSelectedTags(tag: string | string[] | undefined) {
  return Array.from(new Set((Array.isArray(tag) ? tag : tag ? [tag] : []).filter(Boolean)));
}

function groupTags(tags: B2BTag[]) {
  return tags.reduce<Map<string, B2BTag[]>>((groups, tag) => {
    groups.set(tag.groupName, [...(groups.get(tag.groupName) ?? []), tag]);
    return groups;
  }, new Map());
}

const FDD_TAG_GROUP_ORDER = ["食材", "加工／規格", "用途", "保存／包裝"];
const PROJECT_CATEGORY_PRESETS: Record<string, string[]> = {
  "summer-restaurant-restock": ["魚類", "蝦蟹類", "貝類", "調理食品"],
  "new-product-trial": ["魚類", "蝦蟹類", "調理食品"],
  "group-meal-proposal": ["魚類", "蝦蟹類", "貝類", "調理食品"],
  "holiday-preorder": ["魚類", "蝦蟹類", "貝類", "調理食品"],
  "expo-consultation": ["魚類", "蝦蟹類", "貝類", "軟體類", "肉類", "調理食品"],
};

function orderedTagGroups(tags: B2BTag[]) {
  return [...groupTags(tags)].sort(([left], [right]) => {
    const leftIndex = FDD_TAG_GROUP_ORDER.indexOf(left);
    const rightIndex = FDD_TAG_GROUP_ORDER.indexOf(right);

    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
      || left.localeCompare(right, "zh-Hant");
  });
}

export default async function BusinessCatalogPage({ searchParams }: CatalogPageProps) {
  const access = await getB2BAccess();

  if (access.role === "anonymous") {
    redirect("/login");
  }

  if (access.role === "admin") {
    redirect("/admin");
  }

  if (access.role === "business_staff") {
    redirect("/admin/business");
  }

  if (access.role === "b2c") {
    redirect("/");
  }

  const [params, catalog] = await Promise.all([searchParams, getB2BCatalogData()]);
  const candidateProject = params.project ? getNewsArticle(params.project) : undefined;
  const activeProject = candidateProject?.category === "offers" && candidateProject.offer ? candidateProject : undefined;
  const activeProjectOffer = activeProject?.offer;
  const projectCategories = activeProject ? PROJECT_CATEGORY_PRESETS[activeProject.slug] ?? [] : [];
  const resetCatalogHref = activeProject ? `/business/catalog?project=${activeProject.slug}` : "/business/catalog";
  const prototype = params.prototype?.toLowerCase();
  if (prototype === "journey") {
    return <CatalogJourneyPrototype catalog={catalog} companyName={access.companyName} />;
  }
  if (prototype === "procurement") {
    return <CatalogProcurementPrototype catalog={catalog} companyName={access.companyName} />;
  }
  if (prototype === "procurement-compact") {
    return <CatalogProcurementCompactPrototype catalog={catalog} companyName={access.companyName} />;
  }
  if (prototype === "search-experience") {
    return <CatalogSearchExperiencePrototype catalog={catalog} companyName={access.companyName} />;
  }
  if (prototype === "taxonomy-search") {
    return <CatalogTaxonomySearchPrototype catalog={catalog} companyName={access.companyName} />;
  }
  if (prototype === "a" || prototype === "b" || prototype === "c") {
    return <CatalogWireframePrototype catalog={catalog} companyName={access.companyName} variant={prototype} />;
  }

  const keyword = params.q?.trim().toLocaleLowerCase("zh-Hant") ?? "";
  const category = params.category ?? "";
  const brand = params.brand ?? "";
  const selectedTags = asSelectedTags(params.tag);
  // A one-choice group cannot meaningfully narrow the catalog. Keep it
  // accessible when already selected from a saved URL, but otherwise show
  // only groups with a real choice. Product cards/detail still show storage
  // and packaging as product attributes.
  const tagGroups = orderedTagGroups(catalog.tags).filter(([groupName, tags]) => groupName !== "食材" && (tags.length > 1 || tags.some((tag) => selectedTags.includes(tag.slug))));

  const products = catalog.products.filter((product) => {
    const searchable = [
      product.productCode,
      product.name,
      product.brand,
      product.category,
      product.specification,
      product.packaging ?? "",
      product.origin,
      product.storageMethod,
      ...product.tags.map((tag) => tag.name),
    ].join(" ").toLocaleLowerCase("zh-Hant");
    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesCategory = !category || product.category === category;
    const matchesProjectCategory = Boolean(category) || !projectCategories.length || projectCategories.includes(product.category);
    const matchesBrand = !brand || product.brand === brand;
    const productTagSlugs = new Set(product.tags.map((tag) => tag.slug));
    const matchesTags = selectedTags.every((tag) => productTagSlugs.has(tag));

    return matchesKeyword && matchesCategory && matchesProjectCategory && matchesBrand && matchesTags;
  });

  return (
    <main
      className="min-h-screen bg-[#F7F4EE] text-[#17242A]"
      style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}
    >
      <BusinessHeader companyName={access.companyName} />
      <B2bCatalogTracker
        brand={brand}
        category={category}
        hasKeyword={Boolean(keyword)}
        selectedTags={selectedTags}
      />

      {activeProject && activeProjectOffer ? (
        <section aria-labelledby="project-catalog-title" className="border-b border-[#B7D3E2] bg-[#EAF5FB]">
          <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8 lg:py-7">
            <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">PROJECT INQUIRY</p><h1 className="mt-2 text-2xl font-bold" id="project-catalog-title">正在洽詢：{activeProject.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#356277]">已預設顯示：{projectCategories.join("、")}。{activeProjectOffer.moq}；{activeProjectOffer.packaging}。</p></div><div className="flex flex-wrap gap-3"><Link className="border border-[#8FB8CD] bg-white px-4 py-2.5 text-sm font-bold text-[#005DAA] transition hover:bg-[#F7FCFF]" href={`/business/news/article/${activeProject.slug}`}>返回方案內容</Link><Link className="border border-[#B7C3C9] bg-white px-4 py-2.5 text-sm font-bold text-[#536168] transition hover:bg-[#F7FCFF]" href="/business/catalog">查看完整型錄</Link></div></div>
            <ol className="mt-5 grid gap-3 border-t border-[#B7D3E2] pt-4 text-sm sm:grid-cols-3"><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#005DAA] text-xs font-bold text-white">1</span><span><strong className="block">選擇品項</strong><span className="text-[#536168]">依方案建議瀏覽規格與包裝</span></span></li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#D3E5EF] text-xs font-bold text-[#005DAA]">2</span><span><strong className="block">加入詢價單</strong><span className="text-[#536168]">選擇規格並填寫預估箱數</span></span></li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#D3E5EF] text-xs font-bold text-[#005DAA]">3</span><span><strong className="block">送出專案詢價</strong><span className="text-[#536168]">業務確認供應、交期與專案價</span></span></li></ol>
          </div>
        </section>
      ) : <section aria-labelledby="business-banner-title" className="border-b border-[#193C49] bg-[#102C37]">
        <h1 className="sr-only" id="business-banner-title">企業型錄｜全球冷凍水產食材供應服務</h1>
        <picture><source media="(max-width: 767px)" srcSet="/brand/yuanjia-banner-mobile.jpg" /><img alt="元家全球冷凍水產食材供應服務 Banner" className="h-[300px] w-full object-cover object-center sm:h-[350px]" src="/brand/yuanjia-banner.jpg" /></picture>
      </section>}

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 lg:grid-cols-[17rem_1fr] lg:px-8 lg:py-10">
        <aside aria-label="型錄篩選器" className="self-start rounded-2xl border border-[#D9E1E5] bg-white p-5 shadow-[0_10px_24px_rgba(23,36,42,0.05)] lg:sticky lg:top-24">
          <form
            className="space-y-6"
            key={[params.q ?? "", category, brand, ...selectedTags].join("|")}
            method="get"
          >
            {activeProject ? <input name="project" type="hidden" value={activeProject.slug} /> : null}
            <div className="border-b border-[#D9E1E5] pb-5">
              <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">CATALOG FILTER</p>
              <h2 className="mt-2 text-lg font-bold">篩選商品</h2>
              <p className="mt-1 text-sm leading-6 text-[#536168]">依需求縮小可瀏覽的商品範圍。</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#17242A]" htmlFor="q">
                搜尋商品
              </label>
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] px-3 py-2.5 text-sm outline-none transition duration-200 placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
                defaultValue={params.q ?? ""}
                id="q"
                name="q"
                placeholder="產品編號、品名、品牌、規格或包裝"
                type="search"
              />
            </div>

            <label className="block text-sm font-semibold text-[#17242A]" htmlFor="category">
              分類
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-3 py-2.5 text-sm font-normal outline-none transition duration-200 focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
                defaultValue={category}
                id="category"
                name="category"
              >
                <option value="">全部分類</option>
                {catalog.categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#17242A]" htmlFor="brand">
              品牌
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-3 py-2.5 text-sm font-normal outline-none transition duration-200 focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
                defaultValue={brand}
                id="brand"
                name="brand"
              >
                <option value="">全部品牌</option>
                {catalog.brands.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="border-t border-[#D9E1E5] pt-6">
              <legend className="text-sm font-semibold text-[#17242A]">商品標籤</legend>
              <p className="mt-1 text-xs leading-5 text-[#536168]">同時勾選多個標籤時，僅顯示全部符合的商品。</p>
              <div className="mt-4 space-y-5">
                {[...tagGroups].map(([groupName, tags], index) => (
                  <details className="group border-b border-[#EEF2F3] pb-4 last:border-b-0 last:pb-0" key={groupName} open={index < 2 || tags.some((tag) => selectedTags.includes(tag.slug))}>
                    <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold tracking-[0.08em] text-[#536168] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]">
                      {groupName}
                      <span aria-hidden="true" className="text-base font-normal text-[#005DAA] transition group-open:rotate-45">＋</span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {tags.map((tag) => (
                        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-[#536168]" key={tag.slug}>
                          <input
                            className="size-4 rounded border-[#D9E1E5] text-[#005DAA] focus:ring-[#005DAA]"
                            defaultChecked={selectedTags.includes(tag.slug)}
                            name="tag"
                            type="checkbox"
                            value={tag.slug}
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </fieldset>

            <div className="flex gap-3">
              <button
                className="min-h-12 flex-1 rounded-lg bg-[#005DAA] px-3 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
                type="submit"
              >
                套用篩選
              </button>
              <Link
                className="inline-flex min-h-12 items-center rounded-lg border border-[#D9E1E5] px-3 py-2.5 text-sm font-semibold text-[#536168] transition duration-200 hover:border-[#005DAA] hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
                href="/business/catalog"
              >
                清除
              </Link>
            </div>
          </form>
        </aside>

        <section id="catalog-results">
          <div aria-live="polite" className="mb-5 rounded-2xl border border-[#CFE3F0] bg-[#EAF5FB] p-6 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">BUSINESS CATALOG</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17242A]">企業產品型錄</h2>
              <p className="mt-2 text-sm leading-6 text-[#00457F]">提供企業採購瀏覽規格、包裝、產地與保存資訊。</p>
            </div>
            <p className="mt-4 shrink-0 text-sm font-semibold text-[#00457F] sm:mt-0">符合條件 {products.length} 項商品</p>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E1E5] pb-4">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">RESULTS</p>
              <h3 className="mt-1 text-lg font-bold">符合條件的商品</h3>
            </div>
            {keyword || category || brand || selectedTags.length || projectCategories.length ? (
              <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold text-[#536168]">
                <span>已套用條件</span>
                {projectCategories.length && !category ? <span className="rounded-full bg-[#EAF5FB] px-2.5 py-1.5 text-[#005DAA]">大宗專案推薦品類</span> : null}
                {keyword ? <span className="rounded-full bg-[#F1F5F7] px-2.5 py-1.5">「{params.q}」</span> : null}
                {category ? <span className="rounded-full bg-[#EAF5FB] px-2.5 py-1.5 text-[#005DAA]">{category}</span> : null}
                {brand ? <span className="rounded-full bg-[#EAF5FB] px-2.5 py-1.5 text-[#005DAA]">{brand}</span> : null}
                {selectedTags.map((slug) => <span className="rounded-full bg-[#EAF5FB] px-2.5 py-1.5 text-[#005DAA]" key={slug}>{catalog.tags.find((tag) => tag.slug === slug)?.name ?? slug}</span>)}
                <Link className="px-1 py-1.5 text-[#005DAA] underline underline-offset-2" href={resetCatalogHref}>{activeProject ? "清除搜尋" : "清除"}</Link>
              </div>
            ) : <p className="text-sm text-[#536168]">可用左側條件縮小結果。</p>}
          </div>

          {products.length ? <CatalogInquiryWorkspace products={products} /> : (
            <div className="rounded-2xl border border-dashed border-[#B7CEDD] bg-white px-6 py-16 text-center">
              <h3 className="text-lg font-bold">沒有符合的商品</h3>
              <p className="mt-2 text-sm text-[#536168]">{activeProject ? "目前的搜尋或篩選條件沒有符合方案推薦品類的商品。" : "請調整搜尋文字或清除篩選條件後再試一次。"}</p>
              <Link
                className="mt-5 inline-flex rounded-lg bg-[#005DAA] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
                href={resetCatalogHref}
              >
                {activeProject ? "清除搜尋，查看推薦品類" : "清除所有篩選"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
