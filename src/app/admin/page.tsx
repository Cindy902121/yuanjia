import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { AdminDashboard } from "./admin-dashboard";
import { AdminServiceUnavailable } from "./admin-service-unavailable";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "管理後台 | 元家",
};

export default async function AdminPage() {
  const access = await requireAdminPage("/admin");
  if (access.unavailable) return <AdminServiceUnavailable />;

  return <AdminDashboard scope="admin" />;
}
