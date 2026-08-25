import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import PasswordForm from "./password-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "修改密碼 | 元家企業型錄",
};

export default async function BusinessPasswordPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login?next=/business/password");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <main className="mx-auto max-w-xl px-5 py-10 lg:px-8">
        <p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">ACCOUNT SECURITY</p>
        <h1 className="mt-2 text-3xl font-bold">修改密碼</h1>
        <p className="mt-2 text-sm leading-6 text-[#536168]">更新後，所有企業型錄工作階段都需要重新登入。</p>
        <div className="mt-7 rounded-2xl border border-[#D9E1E5] bg-white p-6 shadow-[0_10px_24px_rgba(23,36,42,0.05)]"><PasswordForm /></div>
      </main>
    </div>
  );
}
