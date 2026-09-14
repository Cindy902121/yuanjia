import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { AdminServiceUnavailable } from "../../admin-service-unavailable";
import { ProductEditor } from "../product-editor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "新增 B2C 商品 | 元家",
};

export default async function NewB2cProductPage() {
  const access = await requireAdminPage("/admin/products/new");
  if (access.unavailable) return <AdminServiceUnavailable />;

  return <ProductEditor />;
}
