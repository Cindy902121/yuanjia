import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isUuid } from "@/lib/api";
import { requireAdminPage } from "@/lib/admin-page-auth";

import { ProductEditor } from "../product-editor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "編輯 B2B 商品 | 元家",
};

export default async function BusinessProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  if (!isUuid(productId)) notFound();
  await requireAdminPage(`/admin/business/products/${productId}`);
  return <ProductEditor productId={productId} />;
}
