"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AdminTab, AdminScope } from "@/lib/admin-view";
import s from "./admin-workspace.module.css";

const modules: Array<{ id: AdminTab; label: string; group: string }> = [
  { id: "overview", label: "營運總覽", group: "工作台" }, { id: "analytics", label: "分析報表", group: "工作台" },
  { id: "b2b-rfqs", label: "企業詢價", group: "B2B 企業業務" }, { id: "b2b-products", label: "商品型錄", group: "B2B 企業業務" }, { id: "b2b-companies", label: "企業會員", group: "B2B 企業業務" },
  { id: "b2c-products", label: "商品管理", group: "B2C 商品與展示" }, { id: "b2c-orders", label: "展示訂單", group: "B2C 商品與展示" },
  { id: "admin-staff", label: "管理帳號", group: "系統管理" }, { id: "customer-prefix-rules", label: "客戶代碼規則", group: "系統管理" },
];
export function AdminShell({ children, scope, activeTab, onSelect, onRefresh, busy }: { children: ReactNode; scope: AdminScope; activeTab: AdminTab; onSelect: (tab: AdminTab) => void; onRefresh: () => void; busy: boolean }) {
  const [access, setAccess] = useState(0), [notice, setNotice] = useState("");
  const menu = useRef<HTMLDetailsElement>(null);
  const previousTab = useRef(activeTab);
  useEffect(() => {
    const denied = (event: Event) => setAccess((event as CustomEvent<number>).detail);
    const notified = (event: Event) => setNotice((event as CustomEvent<string>).detail);
    window.addEventListener("admin-access-error", denied); window.addEventListener("admin-navigation-notice", notified);
    return () => { window.removeEventListener("admin-access-error", denied); window.removeEventListener("admin-navigation-notice", notified); };
  }, []);
  useEffect(() => {
    if (previousTab.current === activeTab) return;
    previousTab.current = activeTab;
    if (menu.current) menu.current.open = false;
    document.getElementById("admin-title")?.focus();
  }, [activeTab]);
  const visible = modules.filter((item) => scope === "admin" || ["b2b-products", "b2b-rfqs"].includes(item.id));
  function nav() { return <nav aria-label="管理後台模組" className={s.nav}>{visible.map((item, index) => <div key={item.id}>{index === 0 || visible[index - 1].group !== item.group ? <p className={s.navGroup}>{item.group}</p> : null}<button className={s.navLink} type="button" aria-current={activeTab === item.id ? "page" : undefined} onClick={() => { setNotice(""); onSelect(item.id); }}>{item.label}</button></div>)}</nav>; }
  return <main className={s.workspace}>
    <a className={s.skip} href="#admin-content">跳到主要內容</a>
    <details className={s.mobileNav} ref={menu}><summary>元家｜管理後台 <span aria-hidden="true">☰</span></summary>{nav()}</details>
    <div className={s.shell}>
      <aside className={s.sidebar}><div className={s.brand}><span className={s.brandMark} aria-hidden="true">元</span><div><strong>元家</strong><small>營運管理工作台</small></div></div>{nav()}<div className={s.sidebarFoot}><Link href="/">← 回到前台</Link></div></aside>
      <div className={s.main}>
        <header className={s.topbar}><div><p className={s.eyebrow}>YUANJIA / OPERATIONS</p><h1 id="admin-title" tabIndex={-1} className={s.title}>{modules.find((item) => item.id === activeTab)?.label ?? "管理後台"}</h1><p className={s.subtitle}>{activeTab === "overview" ? "從企業需求到商品上架，掌握今天的工作。" : "清楚查看資料，依目前狀態完成下一步。"}</p></div><div className={s.actions}><span className={s.role}>{scope === "admin" ? "管理工作區" : "B2B 工作區"}</span><button type="button" className={s.button} disabled={busy || !!access} onClick={onRefresh}>{busy ? "更新中…" : "重新整理"}</button></div></header>
        <section id="admin-content" tabIndex={-1} className="min-w-0">
          {notice ? <p className={s.error} role="status">{notice}</p> : null}
          {access ? <section className={s.panel} role="alert"><h2 className={s.heading}>{access === 401 ? "登入已逾時" : "目前無法存取此管理資料"}</h2><p className={s.muted}>請重新確認帳號權限。未完成操作不會自動重送。</p><Link className={s.textButton} href={`/login?next=${encodeURIComponent(scope === "business" ? "/admin/business" : "/admin")}`}>重新登入 →</Link></section> : children}
        </section>
      </div>
    </div>
  </main>;
}
