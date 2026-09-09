import type { Metadata } from "next";

import HomepagePreviewClient from "./homepage-preview-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "B2B 首頁概念預覽 | 元家",
};

export default function HomepagePreviewPage() {
  return <HomepagePreviewClient />;
}
