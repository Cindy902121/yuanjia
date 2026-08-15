import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import CatalogInquiryWorkspace from "./catalog-inquiry-workspace";
import CatalogJourneyPrototype from "./catalog-journey-prototype";
import CatalogProcurementPrototype from "./catalog-procurement-prototype";
import CatalogProcurementCompactPrototype from "./catalog-procurement-compact-prototype";
import CatalogSearchExperiencePrototype from "./catalog-search-experience-prototype";
import CatalogTaxonomySearchPrototype from "./catalog-taxonomy-search-prototype";
import CatalogWireframePrototype from "./catalog-wireframe-prototype";
import { type B2BTag, getB2BAccess, getB2BCatalogData } from "@/lib/b2b/catalog";

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

export default async function BusinessCatalogPage({ searchParams }: CatalogPageProps) {
  const access = await getB2BAccess();

  if (access.role === "anonymous") {
    redirect("/login");
  }

  if (access.role === "admin") {
    redirect("/admin");
  }

  if (access.role === "b2c") {
    redirect("/");
  }

  const [params, catalog] = await Promise.all([searchParams, getB2BCatalogData()]);
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
  const tagGroups = groupTags(catalog.tags);

  const products = catalog.products.filter((product) => {
    const searchable = [product.productCode, product.name, product.brand, product.category].join(" ").toLocaleLowerCase(
      "zh-Hant",
    );
    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesCategory = !category || product.category === category;
    const matchesBrand = !brand || product.brand === brand;
    const productTagSlugs = new Set(product.tags.map((tag) => tag.slug));
    const matchesTags = selectedTags.every((tag) => productTagSlugs.has(tag));

    return matchesKeyword && matchesCategory && matchesBrand && matchesTags;
  });

  return (
    <main
      className="min-h-screen bg-[#F7F6F2] text-[#17242A]"
      style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}
    >
      <header className="border-b border-[#D9E1E5] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#005DAA]">YUANJIA BUSINESS</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[#17242A]">企業型錄</h1>
          </div>
          <p className="hidden rounded-full border border-[#CFE3F0] bg-[#EAF5FB] px-3 py-1.5 text-sm font-medium text-[#00457F] sm:block">
            {access.companyName}・企業帳戶
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 lg:grid-cols-[17rem_1fr] lg:px-8 lg:py-10">
        <aside className="rounded-2xl border border-[#D9E1E5] bg-white p-5 shadow-[0_10px_24px_rgba(23,36,42,0.05)] lg:sticky lg:top-6 lg:h-fit">
          <form
            className="space-y-6"
            key={[params.q ?? "", category, brand, ...selectedTags].join("|")}
            method="get"
          >
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
                placeholder="名稱、品牌或產品編號"
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
                {[...tagGroups].map(([groupName, tags]) => (
                  <div key={groupName}>
                    <p className="text-xs font-bold tracking-[0.08em] text-[#536168]">{groupName}</p>
                    <div className="mt-2 space-y-2">
                      {tags.map((tag) => (
                        <label className="flex min-h-6 cursor-pointer items-center gap-2 text-sm text-[#536168]" key={tag.slug}>
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
                  </div>
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

        <section>
          <div className="mb-6 rounded-2xl border border-[#CFE3F0] bg-[#EAF5FB] p-6 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">BUSINESS CATALOG</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17242A]">商品型錄</h2>
              <p className="mt-2 text-sm leading-6 text-[#00457F]">提供企業採購瀏覽規格、包裝、產地與保存資訊。</p>
            </div>
            <p className="mt-4 shrink-0 text-sm font-semibold text-[#00457F] sm:mt-0">共 {products.length} 項商品</p>
          </div>

          {products.length ? <CatalogInquiryWorkspace products={products} /> : (
            <div className="rounded-2xl border border-dashed border-[#B7CEDD] bg-white px-6 py-16 text-center">
              <h3 className="text-lg font-bold">沒有符合的商品</h3>
              <p className="mt-2 text-sm text-[#536168]">請調整搜尋文字或清除篩選條件後再試一次。</p>
              <Link
                className="mt-5 inline-flex rounded-lg bg-[#005DAA] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
                href="/business/catalog"
              >
                清除所有篩選
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
