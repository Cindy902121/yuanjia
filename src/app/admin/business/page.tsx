import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { AdminDashboard } from "../admin-dashboard";
import { AdminServiceUnavailable } from "../admin-service-unavailable";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "B2B 管理 | 元家",
};

export default async function AdminBusinessPage() {
  const access = await requireAdminPage("/admin/business");
  if (access.unavailable) return <AdminServiceUnavailable />;

  return <AdminDashboard initialTab="b2b-products" scope="business" />;
}
