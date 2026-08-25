import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { AdminDashboard } from "../admin-dashboard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "B2B 管理 | 元家",
};

export default async function AdminBusinessPage() {
  await requireAdminPage("/admin/business");

  return <AdminDashboard initialTab="b2b-products" scope="business" />;
}
