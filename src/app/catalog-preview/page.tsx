import type { Metadata } from "next";

import CatalogBannerDrawerPreview from "./catalog-banner-drawer-preview";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "元家企業型錄｜分類搜尋預覽",
};

export default function CatalogPreviewPage() {
  return <CatalogBannerDrawerPreview />;
}
