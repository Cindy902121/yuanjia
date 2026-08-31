import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { ProductEditor } from "../product-editor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "新增 B2B 商品 | 元家",
};

export default async function NewBusinessProductPage() {
  await requireAdminPage("/admin/business/products/new");
  return <ProductEditor productId={null} />;
}
