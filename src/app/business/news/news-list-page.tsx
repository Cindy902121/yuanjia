import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import BusinessHeader from "../catalog/business-header";
import { getB2BAccess } from "@/lib/b2b/catalog";
import type { NewsArticle } from "./news-data";

type NewsListPageProps = {
  title: string;
  articles: NewsArticle[];
  description: string;
  featuredSummary: string;
};

export default async function NewsListPage({ title, articles, description, featuredSummary }: NewsListPageProps) {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <Image alt="元家最新消息" className="h-auto w-full" height={350} priority src="/news-banner.jpg" width={1920} />
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-16">
        <div className="border-b border-[#D9E1E5] pb-7">
          <nav aria-label="麵包屑導覽" className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-[#718087]">
            <Link className="shrink-0 transition hover:text-[#005DAA]" href="/business">首頁</Link>
            <span aria-hidden="true" className="text-[#B7C3C9]">/</span>
            <Link className="shrink-0 transition hover:text-[#005DAA]" href="/business/news/activities">最新消息</Link>
            <span aria-hidden="true" className="text-[#B7C3C9]">/</span>
            <span aria-current="page" className="truncate font-medium text-[#536168]">{title}</span>
          </nav>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#536168]">{description}</p>
        </div>

        <section className="mt-10">
            <div className="border-b-2 border-[#17242A] pb-3">
            <h2 className="text-2xl font-bold">焦點消息</h2>
          </div>
          <article className="mt-6 border border-[#CFE3F0] bg-[#EAF5FB] p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-[7.5rem_1fr] sm:items-start">
              <time className="text-sm tabular-nums text-[#536168]">{articles[0].date}</time>
              <div><p className="text-xs font-bold tracking-[0.12em] text-[#005DAA]">{title}</p><h3 className="mt-3 text-2xl font-bold leading-9">{articles[0].title}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#536168]">{featuredSummary}</p><Link className="mt-5 inline-flex border-b border-[#005DAA] pb-1 text-sm font-bold text-[#005DAA] hover:text-[#00457F]" href={`/business/news/article/${articles[0].slug}`}>閱讀公告</Link></div>
            </div>
          </article>
          <div className="mt-10 flex items-center gap-3"><span className="h-px w-8 bg-[#005DAA]" /><h3 className="text-sm font-bold tracking-[0.14em] text-[#536168]">MORE NEWS</h3></div>
          <ul className="mt-3 divide-y divide-[#D9E1E5]">
            {articles.slice(1).map((article) => (
              <li key={`${article.date}-${article.title}`}>
                <Link className="group grid gap-3 py-5 transition hover:bg-[#EAF5FB] sm:grid-cols-[7.5rem_1fr_auto] sm:items-center sm:px-4" href={`/business/news/article/${article.slug}`}>
                  <time className="text-sm tabular-nums text-[#718087]">{article.date}</time>
                  <span className="text-base font-medium leading-7 text-[#17242A] transition group-hover:text-[#005DAA]">{article.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
