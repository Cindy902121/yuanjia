import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { getSessionContext } from "@/lib/auth-context";
import { getB2BAccess } from "@/lib/b2b/catalog";

import BusinessBreadcrumb from "../catalog/business-breadcrumb";
import BusinessHeader from "../catalog/business-header";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "帳號設定 | 元家企業採購服務",
};

export default async function BusinessAccountPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");

  const { user } = await getSessionContext();
  if (!user?.email) redirect("/login");

  return (
    <div className="min-h-screen bg-white text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <BusinessBreadcrumb current="帳號設定" />
        <section className="mt-6 max-w-3xl">
          <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">ACCOUNT SETTINGS</p>
          <h1 className="mt-2 text-3xl font-bold">帳號設定</h1>
          <p className="mt-2 text-sm leading-6 text-[#536168]">管理 {access.companyName} 企業帳戶的登入資訊。</p>
        </section>

        <section className="mt-8 rounded-2xl border border-[#C9D8DE] bg-white p-5 shadow-[0_10px_24px_rgba(23,36,42,0.05)] sm:p-7">
          <div className="border-b border-[#D9E1E5] pb-5">
            <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">LOGIN ACCOUNT</p>
            <p className="mt-2 text-lg font-bold text-[#17242A]">{user.email}</p>
          </div>
          <div className="pt-6">
            <h2 className="text-xl font-bold text-[#17242A]">變更密碼</h2>
            <p className="mt-2 text-sm leading-6 text-[#536168]">為確保帳戶安全，請先輸入目前密碼，再設定新密碼。</p>
            <ChangePasswordForm email={user.email} tone="business" />
          </div>
        </section>
      </main>
    </div>
  );
}
