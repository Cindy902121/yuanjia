import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth-context";
import AdminSummaryClient from "./summary-client";

export default async function AdminPage() { const context = await getAdminContext(); if (!context.user) redirect("/login"); if (!context.isAdmin) redirect("/"); return <main className="min-h-screen bg-[#F7F6F2] px-5 py-10 text-[#17242A]"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">YUANJIA ADMIN</p><h1 className="mt-2 text-3xl font-bold">管理工作台</h1><nav className="mt-6 flex flex-wrap gap-3"><Link className="rounded-lg bg-[#005DAA] px-4 py-3 text-sm font-bold text-white" href="/admin/business">B2B／企業管理</Link><Link className="rounded-lg border border-[#8FB8CD] bg-white px-4 py-3 text-sm font-bold text-[#005DAA]" href="/">返回前台</Link></nav><AdminSummaryClient /></div></main>; }
