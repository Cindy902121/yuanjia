import type { Metadata } from "next";

import NewsListPage from "../news-list-page";
import { getNewsArticles, newsCategories } from "../news-data";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "活動訊息 | 元家企業採購服務" };

export default function BusinessActivityNewsPage() {
  const category = newsCategories.activities;
  return <NewsListPage articles={getNewsArticles("activities")} bannerKicker="ACTIVITY UPDATES" featuredSummary={category.featuredSummary} title={category.title} />;
}
