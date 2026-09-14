import type { Metadata } from "next";

import HomepagePreviewClient from "./homepage-preview-client";
import BannerMotionPrototype from "./banner-motion-prototype";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "B2B 首頁概念預覽 | 元家",
};

export default async function HomepagePreviewPage({ searchParams }: { searchParams: Promise<{ bannerPreview?: string; variant?: string }> }) {
  const params = await searchParams;
  if (params.bannerPreview === "1") return <BannerMotionPrototype initialVariant={params.variant} />;
  return <HomepagePreviewClient />;
}
