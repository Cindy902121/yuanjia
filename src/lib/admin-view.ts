export const ADMIN_TABS = ["overview", "analytics", "b2c-products", "b2c-orders", "b2b-products", "b2b-companies", "b2b-rfqs", "admin-staff"] as const;
export type AdminTab = typeof ADMIN_TABS[number];
export type AdminScope = "admin" | "business";
export const BUSINESS_TABS: readonly AdminTab[] = ["b2b-products", "b2b-rfqs"];

export function normalizeAdminView(search: string, scope: AdminScope) {
  const params = new URLSearchParams(search), original = params.toString();
  const allowed = scope === "admin" ? ADMIN_TABS : BUSINESS_TABS;
  const fallback = scope === "admin" ? "overview" : "b2b-products";
  const tab = params.get("tab");
  if ((tab !== null && !allowed.includes(tab as AdminTab)) || params.getAll("tab").length > 1) params.set("tab", fallback);
  const activeTab = (params.get("tab") ?? fallback) as AdminTab;
  const enums: Record<string, readonly string[]> = {
    queue: ["new", "processing"], rfq_status: ["new", "all", "processing", "closed"], rfq_sort: ["oldest", "newest"],
    product_status: ["all", "draft", "review", "published", "offline"], missing_images: ["false", "true"],
  };
  for (const [key, values] of Object.entries(enums)) {
    if (params.has(key) && (params.getAll(key).length !== 1 || !values.includes(params.get(key)!))) params.set(key, values[0]);
  }
  for (const key of ["rfq_page", "product_page"]) {
    const value = params.get(key);
    if (value !== null && (params.getAll(key).length > 1 || !/^[1-9]\d*$/.test(value) || Number(value) > 100000)) params.set(key, "1");
  }
  if (params.getAll("product_q").length > 1) params.set("product_q", params.get("product_q") ?? "");
  return { activeTab, params, corrected: original !== params.toString() };
}

export function validRfqId(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }

export function parsePage(params: URLSearchParams, defaultSize: number, maxSize: number) {
  const page = params.get("page") ?? "1", size = params.get("page_size") ?? String(defaultSize);
  if (["page", "page_size", "status", "sort", "id", "missing_images", "include_inactive", "q"].some((key) => params.getAll(key).length > 1)) return null;
  if (!/^[1-9]\d*$/.test(page) || !/^[1-9]\d*$/.test(size) || Number(page) > 100000 || Number(size) > maxSize) return null;
  return { page: Number(page), pageSize: Number(size) };
}
