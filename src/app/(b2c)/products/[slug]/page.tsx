import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getDistinctCategories, getProductBySlug } from "@/lib/supabase/products";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { EditorialAddToCartWithQuantity } from "@/components/editorial/AddToCartWithQuantity";
import { TrackedTagLink } from "@/components/analytics/TrackedTagLink";
import { collectTagGroups } from "@/lib/editorial/tag-groups";
import { getB2BAccess } from "@/lib/b2b/catalog";
import { B2BShoppingGuard } from "@/components/B2BShoppingGuard";

/**
 * /products/[slug] 頁面。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，正式取代舊版
 * ProductDetail／ProductDetailTabs／Breadcrumb／RecommendedProducts 組合。
 * SEO 相關的部分（generateMetadata、Product／BreadcrumbList JSON-LD、
 * TrackPageView）完全不變，只有畫面呈現換掉。
 *
 * 團隊回饋的兩處結構調整：
 * 1. 標籤、規格搬到加入購物車正下方（原本是頁面下方獨立的「規格」區塊），
 *    標籤改成可點選連結（連到 /products/tags/[slug]，還沒重新設計但是真實
 *    存在的路由）。
 * 2. 最左側新增篩選欄（分類／標籤連結，點了跳轉到 /products 並套用該篩選），
 *    視覺跟商品列表頁一致。
 *
 * 舊元件（ProductDetail、ProductDetailTabs、Breadcrumb、RecommendedProducts、
 * AddToCartWithQuantity）**沒有刪除**，如果之後有其他地方還在用。
 *
 * 2026-09-03：路由規格註 1，B2B 公司 session 進來要顯示「請先登出企業帳號」
 * 守門畫面，不是商品詳情——放在讀商品資料之前判斷，不管 slug 是否存在都不
 * 需要查。generateMetadata() 不用擋，商品名稱／描述本身不是敏感資料。
 */
export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const product = await getProductBySlug(supabase, slug);

  if (!product) {
    return { title: "找不到這項商品 | 元家" };
  }

  const title = `${product.name} | 元家`;
  const ogImage = product.coverImage
    ? { url: product.coverImage.url, alt: product.coverImage.alt }
    : { url: "/products-banner.jpg", width: 1920, height: 380, alt: product.name };

  return {
    title,
    description: product.shortDescription,
    alternates: canonicalFor(`/products/${product.slug}`),
    openGraph: buildOpenGraph({
      title,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      images: [ogImage],
    }),
  };
}

export default async function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  const access = await getB2BAccess();
  if (access.role === "b2b") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 bg-[#EAF4F8] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#0B1620] sm:px-8 lg:py-20">
        <B2BShoppingGuard />
      </main>
    );
  }

  const { slug } = await params;
  const supabase = await createClient();
  const product = await getProductBySlug(supabase, slug);

  if (!product) {
    notFound();
  }

  const [allProducts, categories] = await Promise.all([
    getAllActiveProducts(supabase),
    getDistinctCategories(supabase),
  ]);
  const tagGroups = collectTagGroups(allProducts);

  const primaryCategory = product.categories.find((c) => c.isPrimary);
  const recommended = allProducts
    .filter((p) => p.id !== product.id && (primaryCategory ? p.categories.some((c) => c.slug === primaryCategory.slug) : true))
    .slice(0, 3);

  const breadcrumbSegments = [
    { label: "首頁", href: "/" },
    { label: "商品列表", href: "/products" },
    ...(primaryCategory
      ? [{ label: primaryCategory.name, href: `/products/categories/${encodeURIComponent(primaryCategory.slug)}` }]
      : []),
    { label: product.name },
  ];

  /**
   * Product／BreadcrumbList 結構化資料。offers 直接用資料庫真實的
   * price／inventoryStatus——頁面上本來就顯示「本網站商品資訊為 MVP 展示資料」
   * 的揭露文字，結構化資料標記的是資料庫當下真的存在的值，不是另外編造。
   */
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.id,
    ...(product.coverImage ? { image: [`${SITE_URL}${product.coverImage.url}`] } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      availability:
        product.inventoryStatus === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbSegments.map((segment, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: segment.label,
      ...(segment.href ? { item: `${SITE_URL}${segment.href}` } : {}),
    })),
  };

  const hasSafetyContent = Boolean(product.foodSafetyInfo) || Boolean(product.qualityInfo) || product.certifications.length > 0;
  const sections = [
    { key: "details", label: "商品詳情" },
    ...(hasSafetyContent ? [{ key: "safety", label: "食品認證" }] : []),
  ];

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <EditorialStyles />
      <TrackPageView eventName="b2c_product_view" productId={product.id} />

      <div className="mx-auto flex w-full max-w-[1300px] flex-col gap-16 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        {/* 麵包屑：純文字，斜線分隔取代 ">" 圖示。 */}
        <FadeInSection>
          <nav aria-label="breadcrumb" className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
            <Link href="/" className="hover:text-[#FF5A36]">
              HOME
            </Link>{" "}
            /{" "}
            <Link href="/products" className="hover:text-[#FF5A36]">
              PRODUCTS
            </Link>
            {primaryCategory ? (
              <>
                {" "}
                / <span>{primaryCategory.name}</span>
              </>
            ) : null}
          </nav>
        </FadeInSection>

        {/* 主要商品資訊：篩選欄／圖片／文字（含標籤、規格、加入購物車）三欄。
            2026-08-25（響應式稽核發現）：手機版原本是「篩選欄→圖片→文字」的
            堆疊順序，使用者點進商品詳情頁想看的是這個商品，卻要先滑過整組
            分類／標籤導覽連結才看得到商品照片。這裡用 CSS `order` 把手機版
            視覺順序改成「圖片→文字→篩選欄」，篩選欄變成頁面最後、比較像是
            「延伸瀏覽」的位置；桌機版三欄並排維持原樣不變（`lg:order-*`
            蓋回原本 1/2/3 順序）。DOM／Tab 順序完全沒動，只有視覺排序。 */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr_1fr] lg:gap-14">
          {/* 篩選欄：導覽用連結，不是這個頁面自己的篩選狀態。 */}
          <FadeInSection className="order-3 flex flex-row flex-wrap gap-8 lg:order-1 lg:sticky lg:top-28 lg:flex-col lg:gap-8 lg:self-start">
            <SidebarLinkGroup label="分類">
              {categories.map((category) => (
                <SidebarLink key={category.slug} href={`/products?category=${category.slug}`}>
                  {category.name}
                </SidebarLink>
              ))}
            </SidebarLinkGroup>
            {tagGroups.map(([groupName, tags]) => (
              <SidebarLinkGroup key={groupName} label={groupName}>
                {tags.map((tag) => (
                  <SidebarLink key={tag.slug} href={`/products?tag=${tag.slug}`}>
                    {tag.name}
                  </SidebarLink>
                ))}
              </SidebarLinkGroup>
            ))}
          </FadeInSection>

          <FadeInSection className="order-1 ep-hover-zoom relative aspect-square lg:order-2">
            {product.coverImage ? (
              <Image src={product.coverImage.url} alt={product.coverImage.alt} fill sizes="(min-width: 1024px) 35vw, 100vw" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F6FBFC] text-sm text-[#5C7383]">
                無商品圖片
              </div>
            )}
          </FadeInSection>

          <FadeInSection className="order-2 flex flex-col gap-6 lg:order-3">
            {product.brand ? (
              <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
                {product.brand}
              </span>
            ) : null}
            <h1 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.4] tracking-[0.03em] text-[#0B1620]">
              {product.name}
            </h1>
            <span className="font-[family-name:var(--ep-font-en)] text-xl tracking-widest text-[#0B1620]">
              NT$ {product.price}
            </span>
            {product.inventoryStatus === "out_of_stock" ? (
              <span className="w-fit text-xs tracking-widest text-[#5C7383]">缺貨中</span>
            ) : null}
            <p className="text-xs font-light leading-[1.8] text-[#5C7383]">
              本網站商品資訊為 MVP 展示資料，實際價格與庫存請以正式商城公告為準。
            </p>

            <div className="h-px w-full bg-[#0B1620]/15" aria-hidden="true" />

            <EditorialAddToCartWithQuantity product={product} />

            {/* 標籤：可點選連結，補滿加入購物車下面的留白。
                2026-09-02（9/2 B2C QA 排程「確認 B2C 事件可正常送出」發現：
                `b2c_tag_click`（FDD §6.7 白名單事件）從有 TrackedTagLink 這個
                元件開始就沒有任何地方真的在用它——這裡本來是普通 <Link>，跟
                左側篩選欄那些「導覽用」的分類／標籤連結（見上面 SidebarLink）
                刻意不送事件不一樣：這裡的標籤 pill 是「使用者主動點一個標籤
                去探索相關商品」，語意上就是白名單設計 b2c_tag_click 想量測的
                動作，改用 TrackedTagLink 補上這個從未真正送出過的事件，行為
                （導覽到 /products/tags/[slug]）完全不變，只多送一個事件。 */}
            {product.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <TrackedTagLink
                    key={tag.slug}
                    href={`/products/tags/${tag.slug}`}
                    className="border border-[#0B1620]/25 px-3 py-1 text-xs text-[#5C7383] transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
                  >
                    {tag.name}
                  </TrackedTagLink>
                ))}
              </div>
            ) : null}

            {/* 規格：搬到這裡，補滿留白，不再獨立成下方一個區塊。 */}
            <dl className="flex flex-col gap-2 border-t border-[#0B1620]/15 pt-4 text-sm">
              {product.brand ? <SpecInline label="品牌" value={product.brand} /> : null}
              <SpecInline label="規格" value={product.specification} />
              <SpecInline label="產地" value={product.origin} />
              <SpecInline label="保存方式" value={product.storageMethod} />
              <SpecInline label="分類" value={product.categories.map((c) => c.name).join("、")} />
            </dl>
          </FadeInSection>
        </div>

        {/* 商品詳情／食品認證：規格已搬到右欄，這裡只剩兩段。 */}
        <div className="flex flex-col gap-14 lg:pl-[calc(200px+3.5rem)]">
          <FadeInSection>
            <nav aria-label="商品資訊區塊快速跳轉" className="flex gap-8 border-t border-b border-[#0B1620]/15 py-4">
              {sections.map((section) => (
                <a
                  key={section.key}
                  href={`#product-${section.key}`}
                  className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.15em] text-[#5C7383] hover:text-[#FF5A36]"
                >
                  {section.label.toUpperCase()}
                </a>
              ))}
            </nav>
          </FadeInSection>

          <FadeInSection id="product-details" className="scroll-mt-24">
            <EditorialSectionHeading index={1} title="商品詳情" />
            <p className="mt-4 max-w-2xl text-sm font-light leading-[1.9] text-[#5C7383]">{product.description}</p>
          </FadeInSection>

          {hasSafetyContent ? (
            <FadeInSection id="product-safety" className="scroll-mt-24">
              <EditorialSectionHeading index={2} title="食品認證" />
              <div className="mt-4 flex flex-col gap-4">
                {product.foodSafetyInfo ? (
                  <div>
                    <h3 className="font-[family-name:var(--ep-font-serif)] text-sm text-[#0B1620]">食品安全</h3>
                    <p className="mt-1 max-w-2xl text-sm font-light leading-[1.8] text-[#5C7383]">{product.foodSafetyInfo}</p>
                  </div>
                ) : null}
                {product.qualityInfo ? (
                  <div>
                    <h3 className="font-[family-name:var(--ep-font-serif)] text-sm text-[#0B1620]">認證／品質</h3>
                    <p className="mt-1 max-w-2xl text-sm font-light leading-[1.8] text-[#5C7383]">{product.qualityInfo}</p>
                  </div>
                ) : null}
              </div>
            </FadeInSection>
          ) : null}
        </div>

        {/* 推薦商品：同分類，簡化版雜誌清單。 */}
        {recommended.length > 0 ? (
          <div className="border-t border-[#0B1620]/15 pt-14 lg:pl-[calc(200px+3.5rem)]">
            <FadeInSection className="mb-8">
              <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
                MORE · 推薦商品
              </span>
            </FadeInSection>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {recommended.map((item) => (
                <FadeInSection key={item.id}>
                  <Link href={`/products/${item.slug}`} className="group flex flex-col gap-3">
                    <div className="ep-hover-zoom relative aspect-[4/3]">
                      {item.coverImage ? (
                        <Image src={item.coverImage.url} alt={item.coverImage.alt} fill sizes="33vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#F6FBFC] text-xs text-[#5C7383]">
                          無商品圖片
                        </div>
                      )}
                    </div>
                    <h3 className="font-[family-name:var(--ep-font-serif)] text-sm text-[#0B1620] group-hover:text-[#FF5A36]">
                      {item.name}
                    </h3>
                    <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
                      NT$ {item.price}
                    </span>
                  </Link>
                </FadeInSection>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function EditorialSectionHeading({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-[family-name:var(--ep-font-en)] text-xl font-thin text-[#FF5A36]">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-light tracking-[0.03em] text-[#0B1620]">{title}</h2>
    </div>
  );
}

function SpecInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-16 shrink-0 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
        {label.toUpperCase()}
      </dt>
      <dd className="text-sm font-light text-[#0B1620]">{value}</dd>
    </div>
  );
}

function SidebarLinkGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">{label}</span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="w-fit border-b border-transparent pb-0.5 text-sm font-light text-[#5C7383] transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
    >
      {children}
    </Link>
  );
}
