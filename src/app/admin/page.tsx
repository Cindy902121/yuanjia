import type { Metadata } from "next";

import { requireAdminPage } from "@/lib/admin-page-auth";

import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "管理後台 | 元家",
};

export default async function AdminPage() {
  await requireAdminPage("/admin");

  return <AdminDashboard scope="admin" />;
}
