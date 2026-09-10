import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isUuid } from "@/lib/api";
import { requireAdminPage } from "@/lib/admin-page-auth";

import { AdminServiceUnavailable } from "../../admin-service-unavailable";
import { ProductEditor } from "../product-editor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "編輯 B2C 商品 | 元家",
};

export default async function B2cProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ productId }, { saved }] = await Promise.all([params, searchParams]);
  if (!isUuid(productId)) notFound();

  const access = await requireAdminPage(`/admin/products/${productId}`);
  if (access.unavailable) return <AdminServiceUnavailable />;

  return <ProductEditor productId={productId} savedMessage={saved === "1"} />;
}
