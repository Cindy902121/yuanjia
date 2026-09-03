import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BusinessHeader from "../../../catalog/business-header";
import { getB2BAccess } from "@/lib/b2b/catalog";
import { getNewsArticle } from "../../news-data";

export async function generateMetadata(props: PageProps<"/business/news/article/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = getNewsArticle(slug);
  if (!article) return { title: "找不到公告 | 元家企業採購服務" };

  return {
    title: `${article.title} | 元家企業採購服務`,
    description: article.summary,
  };
}

export default async function BusinessNewsArticlePage(props: PageProps<"/business/news/article/[slug]">) {
  const { slug } = await props.params;
  const article = getNewsArticle(slug);
  if (!article) notFound();

  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  const categoryHref = `/business/news/${article.category}`;
  const categoryLabel = article.category === "offers" ? "大宗專案" : article.categoryLabel;
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <Image alt="元家最新消息" className="h-auto w-full" height={350} priority src="/news-banner.jpg" width={1920} />
      <main className="mx-auto max-w-[960px] px-5 py-9 lg:px-8 lg:py-12">
        <nav aria-label="麵包屑導覽" className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-[#718087]">
          <Link className="shrink-0 transition hover:text-[#005DAA]" href="/business">首頁</Link>
          <span aria-hidden="true" className="text-[#B7C3C9]">/</span>
          <Link className="shrink-0 transition hover:text-[#005DAA]" href={categoryHref}>最新消息</Link>
          <span aria-hidden="true" className="text-[#B7C3C9]">/</span>
          <Link className="shrink-0 transition hover:text-[#005DAA]" href={categoryHref}>{categoryLabel}</Link>
        </nav>
        <article className="mt-8 border-t-2 border-[#17242A] pt-6">
          <p className="text-sm font-bold text-[#005DAA]">{categoryLabel}</p>
          <time className="mt-5 block text-sm tabular-nums text-[#718087]">{article.date}</time>
          <h1 className="mt-3 max-w-none text-3xl font-bold leading-[1.28] tracking-tight sm:text-[34px] lg:text-[36px]">{article.title}</h1>
          <p className="mt-5 text-base leading-7 text-[#536168]">{article.summary}</p>
          {article.offer ? (
            <section aria-label="方案資訊" className="mt-7 border border-[#C7D7E0] bg-[#F1F7FA] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">方案資訊</h2><span className="border border-[#A8C8DA] bg-white px-2 py-1 text-xs font-medium text-[#356277]">展示用方案</span></div>
              <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold text-[#718087]">適用品類</dt><dd className="mt-1 leading-6 text-[#33434A]">{article.offer.productCategories}</dd></div><div><dt className="text-xs font-bold text-[#718087]">活動期間</dt><dd className="mt-1 leading-6 text-[#33434A]">{article.offer.period}</dd></div><div><dt className="text-xs font-bold text-[#718087]">最低採購量 MOQ</dt><dd className="mt-1 leading-6 text-[#33434A]">{article.offer.moq}</dd></div><div><dt className="text-xs font-bold text-[#718087]">箱規／包裝</dt><dd className="mt-1 leading-6 text-[#33434A]">{article.offer.packaging}</dd></div><div><dt className="text-xs font-bold text-[#718087]">價格方式</dt><dd className="mt-1 font-bold leading-6 text-[#005DAA]">{article.offer.pricing}</dd></div><div><dt className="text-xs font-bold text-[#718087]">適用對象</dt><dd className="mt-1 leading-6 text-[#33434A]">{article.offer.eligibility}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold text-[#718087]">採購建議</dt><dd className="mt-1 leading-6 text-[#33434A]">{article.offer.purchaseNote}</dd></div></dl>
            </section>
          ) : null}
          <div className="mt-8 max-w-none space-y-5 border-y border-[#D9E1E5] py-7 text-[15px] leading-7 text-[#33434A] lg:text-base lg:leading-8">
            {article.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          {article.imagePaths?.length ? (
            <section aria-label={`${article.title} 官方圖片`} className="mt-7 max-w-[860px]">
              <div className={article.imagePaths.length === 1 ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
                {article.imagePaths.map((imagePath, index) => (
                  <div className="overflow-hidden border border-[#D9E1E5] bg-white" key={imagePath}>
                    <Image alt={`${article.title}｜官方圖片 ${index + 1}`} className="h-auto w-full" height={1200} priority={index === 0} src={imagePath} width={1600} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {article.attachment ? <a className="mt-8 inline-flex border border-[#8FB8CD] bg-white px-4 py-2.5 text-sm font-bold text-[#005DAA] transition hover:bg-[#EAF5FB]" download href={article.attachment.href}>{article.attachment.label}</a> : null}
          <div className="mt-8">
            <Link className="border border-[#8FB8CD] bg-white px-4 py-2.5 text-sm font-bold text-[#005DAA] transition hover:bg-[#EAF5FB]" href={categoryHref}>返回{categoryLabel}</Link>
            {article.offer ? <Link className="ml-3 inline-flex border border-[#005DAA] bg-[#005DAA] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#00457F]" href={`/business/catalog?project=${article.slug}`}>取得專案報價</Link> : null}
          </div>
        </article>
      </main>
    </div>
  );
}
