import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { ProductEditor } from "../product-editor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "編輯 B2B 商品 | 元家",
};

export default async function EditB2bProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ productId }, { saved }] = await Promise.all([params, searchParams]);
  await requireAdminPage(`/admin/business/products/${productId}`);

  return <ProductEditor productId={productId} savedMessage={saved === "1"} />;
}
