import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "型錄 UI 預覽 | 元家",
};

export default function CatalogPreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
