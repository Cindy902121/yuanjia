import HomepagePreviewClient from "./homepage-preview-client";
import BannerMotionPrototype from "./banner-motion-prototype";

export default async function HomepagePreviewPage({ searchParams }: { searchParams: Promise<{ bannerPreview?: string; variant?: string }> }) {
  const params = await searchParams;
  if (params.bannerPreview === "1") return <BannerMotionPrototype initialVariant={params.variant} />;
  return <HomepagePreviewClient />;
}
