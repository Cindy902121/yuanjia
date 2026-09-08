"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeAdminView, type AdminScope } from "@/lib/admin-view";
export function changeAdminQuery(values: Record<string, string | null>, replace = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === "") url.searchParams.delete(key); else url.searchParams.set(key, value);
  }
  if (url.href === window.location.href) return;
  const focus = document.activeElement instanceof HTMLElement ? document.activeElement.id : "";
  const current = { ...window.history.state, adminScroll: window.scrollY, adminFocus: focus };
  window.history.replaceState(current, "", window.location.href);
  if (replace) window.history.replaceState(current, "", url);
  else window.history.pushState({ adminScroll: 0 }, "", url);
}
export function useAdminView(scope: AdminScope) {
  const search = useSearchParams().toString();
  const view = normalizeAdminView(search, scope), normalized = view.params.toString();
  useEffect(() => {
    if (search === normalized) return;
    const url = new URL(window.location.href); url.search = normalized;
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new CustomEvent("admin-navigation-notice", { detail: "連結條件不正確，已返回可使用的管理頁面。" }));
  }, [normalized, search]);
  return view;
}
export function openRfq(id: string) {
  const source = window.location.pathname + window.location.search;
  changeAdminQuery({ rfq_id: id });
  window.history.replaceState({ ...window.history.state, adminReturn: source }, "", window.location.href);
}
export function returnToRfqs() {
  const source = window.history.state?.adminReturn;
  if (typeof source === "string" && source.startsWith(`${window.location.pathname}?`)) window.history.back();
  else changeAdminQuery({ rfq_id: null }, true);
}
export function adminDate(value?: string) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "尚未成功讀取";
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
export function invalidateAdminData() { window.dispatchEvent(new Event("admin-data-change")); }
