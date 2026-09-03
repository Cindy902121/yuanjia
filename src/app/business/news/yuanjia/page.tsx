import type { Metadata } from "next";

import NewsListPage from "../news-list-page";
import { getNewsArticles, newsCategories } from "../news-data";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "元家資訊 | 元家企業採購服務" };

export default function BusinessYuanjiaNewsPage() {
  const category = newsCategories.yuanjia;
  return <NewsListPage articles={getNewsArticles("yuanjia")} description={category.description} featuredSummary={category.featuredSummary} title={category.title} />;
}
