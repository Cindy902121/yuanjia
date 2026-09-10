"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAdminView, changeAdminQuery } from "./admin-navigation";
import { useAdminResource } from "./use-admin-resource";
import { ResourceState } from "./resource-state";
import { AdminShell } from "./admin-shell";
import { RfqWorkspace } from "./rfq-workspace";
import { adminRequest } from "./admin-request";
import { FormEvent, useCallback, useEffect, useState } from "react";

import type { B2bProductStatus } from "@/lib/admin-catalog";

import { B2bCsvImportPanel } from "./admin-catalog-tools";
import AnalyticsReportPanel from "./analytics-report-panel";
import { OperationsOverview } from "./operations-overview";
import styles from "./admin-workspace.module.css";

type AdminTab =
  | "overview"
  | "analytics"
  | "b2c-products"
  | "b2c-orders"
  | "b2b-products"
  | "b2b-companies"
  | "b2b-rfqs"
  | "admin-staff";
type AdminScope = "admin" | "business";

type Channel = "b2c" | "b2b";
type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  specification: string;
  product_code?: string;
  slug?: string;
  price?: number | string;
  mock_inventory?: number;
  is_active: boolean;
  status?: B2bProductStatus;
  image_count?: number;
  updated_at: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number | string;
};

type Order = {
  id: string;
  status: "created" | "processing" | "completed";
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

type Company = {
  id: string;
  client_code: string;
  name: string;
  prefix: string;
  tier_label: string;
  updated_at: string;
  is_active: boolean;
  created_at: string;
};

type Staff = {
  user_id: string;
  email: string | null;
  role: "admin" | "business_staff";
  is_active: boolean;
  created_at: string;
};

type CompanyForm = {
  name: string;
  clientCode: string;
  password: string;
  passwordAgain: string;
};

const statusLabels = {
  created: "已建立",
  processing: "處理中",
  completed: "已完成",
  new: "新詢價",
  closed: "已結案",
  draft: "草稿",
  review: "待審核",
  published: "已發布",
  offline: "已下架",
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const savedReadError = "已儲存，但最新資料讀取失敗。請重新整理，勿重送操作。";

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  return adminRequest<T>(String(input), init);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: number | string | undefined) {
  if (value === undefined) {
    return "—";
  }
  return `NT$ ${Number(value).toLocaleString("zh-TW")}`;
}

function statusBadge(isActive: boolean) {
  return isActive
    ? "border-[#B8E1CB] bg-[#F0FBF4] text-[#18794E]"
    : "border-[#E5D2D0] bg-[#FFF5F4] text-[#A43B34]";
}

export function AdminDashboard({
  scope = "admin",
}: {
  initialTab?: AdminTab;
  scope?: AdminScope;
}) {
  const { activeTab, params } = useAdminView(scope);
  const [revision, setRevision] = useState(0);
  const [loadedTab, setLoadedTab] = useState("");
  const [b2cProducts, setB2cProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [credentialNotice, setCredentialNotice] = useState("");
  const [staffUserId, setStaffUserId] = useState("");
  const [staffRole, setStaffRole] = useState<Staff["role"]>("business_staff");
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    name: "",
    clientCode: "",
    password: "",
    passwordAgain: "",
  });

  const loadProducts = useCallback(async (channel: Channel) => {
    const payload = await requestJson<{ products: Product[] }>(
      `/api/admin/products/${channel}?include_inactive=true`,
    );
    if (channel === "b2c") {
      setB2cProducts(payload.products ?? []);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const payload = await requestJson<{ orders: Order[] }>("/api/b2c/mock-orders");
    setOrders(payload.orders ?? []);
  }, []);

  const loadCompanies = useCallback(async () => {
    const payload = await requestJson<{ companies: Company[] }>("/api/admin/companies");
    setCompanies(payload.companies ?? []);
  }, []);

  const loadStaff = useCallback(async () => {
    const payload = await requestJson<{ staff: Staff[] }>("/api/admin/staff");
    setStaff(payload.staff ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (activeTab === "b2c-products") await loadProducts("b2c");
      else if (activeTab === "b2c-orders") await Promise.all([loadOrders(), loadProducts("b2c")]);
      else if (activeTab === "b2b-companies") await loadCompanies();
      else if (activeTab === "admin-staff") await loadStaff();
      setLoadedTab(activeTab);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "目前無法讀取後台資料。");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadCompanies, loadOrders, loadProducts, loadStaff]);

  async function refreshAfterWrite(loader: () => Promise<void>) {
    try {
      await loader();
      return true;
    } catch {
      setError(savedReadError);
      return false;
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  function selectTab(tab: AdminTab) {
    if (companyForm.name || companyForm.clientCode || companyForm.password || companyForm.passwordAgain) {
      if (!window.confirm("企業會員表單尚未儲存，確定要離開嗎？")) return;
      setCompanyForm({ name: "", clientCode: "", password: "", passwordAgain: "" });
    }
    const values: Record<string, string | null> = { tab };
    for (const key of params.keys()) if (key !== "date_from" && key !== "date_to" && key !== "tab") values[key] = null;
    changeAdminQuery(values); setError(""); setNotice("");
  }

  async function toggleProduct(channel: Channel, product: Product) {
    if (
      product.is_active &&
      !window.confirm(`確定要下架「${product.name}」嗎？下架後前台將不再顯示。`)
    ) {
      return;
    }

    const key = `${channel}-product-${product.id}`;
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      await requestJson(`/api/admin/products/${channel}/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !product.is_active, expected_updated_at: product.updated_at }),
      });
      if (!await refreshAfterWrite(() => loadProducts(channel))) return;
      setNotice(`${product.name} 已${product.is_active ? "下架" : "上架"}。`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "商品狀態更新失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    setBusyKey(`order-${orderId}`);
    setError("");
    try {
      await requestJson("/api/b2c/mock-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status, expected_updated_at: orders.find((order) => order.id === orderId)?.updated_at }),
      });
      if (!await refreshAfterWrite(loadOrders)) return;
      setNotice("B2C 訂單狀態已更新。");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "訂單狀態更新失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function updateCompany(company: Company) {
    const action = company.is_active ? "停用" : "啟用";
    if (
      company.is_active &&
      !window.confirm(`確定要${action}「${company.name}」嗎？停用後該公司將無法登入。`)
    ) {
      return;
    }

    setBusyKey(`company-${company.id}`);
    setError("");
    try {
      await requestJson(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !company.is_active, expected_updated_at: company.updated_at }),
      });
      if (!await refreshAfterWrite(loadCompanies)) return;
      setNotice(`企業會員已${action}。`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "企業會員狀態更新失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("add-staff");
    setError("");
    setNotice("");
    try {
      await requestJson("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: staffUserId.trim(), role: staffRole }),
      });
      if (!await refreshAfterWrite(loadStaff)) return;
      setStaffUserId("");
      setNotice("管理帳號已加入。");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "管理帳號加入失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function updateStaff(member: Staff, updates: Partial<Pick<Staff, "role" | "is_active">>) {
    const nextLabel = updates.role && updates.role !== member.role
      ? `改為${updates.role === "admin" ? " admin" : " business_staff"}`
      : updates.is_active === false
        ? "停用"
        : "更新";
    if (!window.confirm(`確定要${nextLabel}「${member.email ?? member.user_id}」嗎？`)) return;

    setBusyKey(`staff-${member.user_id}`);
    setError("");
    try {
      await requestJson("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.user_id, ...updates }),
      });
      if (!await refreshAfterWrite(loadStaff)) return;
      setNotice("管理帳號已更新。");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "管理帳號更新失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (companyForm.password !== companyForm.passwordAgain) {
      setError("兩次輸入的初始密碼不一致。");
      return;
    }
    setBusyKey("create-company");
    setError("");
    setNotice("");
    setCredentialNotice("");
    try {
      const payload = await requestJson<{
        company: Company;
        credential: { client_code: string; note: string };
      }>("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyForm.name,
          client_code: companyForm.clientCode,
          password: companyForm.password,
        }),
      });
      setCompanyForm({
        name: "",
        clientCode: "",
        password: "",
        passwordAgain: "",
      });
      setCredentialNotice(
        `企業「${payload.company.name}」已建立。客戶代碼：${payload.credential.client_code}；${payload.credential.note}`,
      );
      await refreshAfterWrite(loadCompanies);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "企業會員建立失敗。");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <AdminShell scope={scope} activeTab={activeTab} onSelect={selectTab} busy={isLoading} onRefresh={() => { setRevision((value) => value + 1); void loadAll(); }}>
            {error ? (
              <div className="mb-4 rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="mb-4 rounded-xl border border-[#B8E1CB] bg-[#F0FBF4] px-4 py-3 text-sm text-[#18794E]" role="status">
                {notice}
              </div>
            ) : null}
            {credentialNotice ? (
              <div className="mb-4 rounded-xl border border-[#C5D8E9] bg-[#EEF7FD] px-4 py-3 text-sm leading-6 text-[#00457F]" role="status">
                <strong className="font-bold">建立成功：</strong> {credentialNotice}
              </div>
            ) : null}

            {isLoading && loadedTab !== activeTab && !["overview", "analytics", "b2b-rfqs", "b2b-products"].includes(activeTab) ? (
              <div className="rounded-2xl border border-[#D8E1E5] bg-white p-8 text-center text-sm text-[#536168]">
                正在讀取管理資料…
              </div>
            ) : (
              <>
                {activeTab === "overview" ? <OperationsOverview revision={revision} scope={scope} /> : null}
                {activeTab === "analytics" ? <AnalyticsReportPanel key={params.toString()} revision={revision} /> : null}
                {activeTab === "b2c-products" ? (
                  <ProductPanel
                    channel="b2c"
                    busyKey={busyKey}
                    onToggle={toggleProduct}
                    products={b2cProducts}
                  />
                ) : null}
                {activeTab === "b2b-products" ? (
                  <B2bProductPanel key={params.toString()} revision={revision} busyKey={busyKey} />
                ) : null}
                {activeTab === "b2c-orders" ? (
                  <OrderPanel
                    busyKey={busyKey}
                    orders={orders}
                    products={b2cProducts}
                    onUpdateStatus={updateOrderStatus}
                  />
                ) : null}
                {activeTab === "b2b-companies" ? (
                  <CompanyPanel
                    busyKey={busyKey}
                    companies={companies}
                    form={companyForm}
                    onCreate={createCompany}
                    onFormChange={setCompanyForm}
                    onToggle={updateCompany}
                  />
                ) : null}
                {activeTab === "b2b-rfqs" ? (
                  <RfqWorkspace revision={revision} />
                ) : null}
                {activeTab === "admin-staff" ? (
                  <StaffPanel
                    busyKey={busyKey}
                    onAdd={addStaff}
                    onRoleChange={(member, role) => void updateStaff(member, { role })}
                    onToggle={(member) => void updateStaff(member, { is_active: !member.is_active })}
                    role={staffRole}
                    setRole={setStaffRole}
                    setUserId={setStaffUserId}
                    staff={staff}
                    userId={staffUserId}
                  />
                ) : null}
              </>
            )}
    </AdminShell>
  );
}

function ProductPanel({
  channel,
  products,
  busyKey,
  onToggle,
}: {
  channel: Channel;
  products: Product[];
  busyKey: string;
  onToggle: (channel: Channel, product: Product) => void;
}) {
  const isB2c = channel === "b2c";
  return (
    <PanelShell
      description={
        isB2c
          ? "管理 B2C 前台商品是否可見；下架不會刪除商品資料。"
          : "管理 B2B 私有型錄是否提供給已啟用的企業會員。"
      }
      title={isB2c ? "B2C 商品上架管理" : "B2B 商品型錄管理"}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#536168]">
        <span>共 {products.length} 筆，已上架 {products.filter((product) => product.is_active).length} 筆</span>
        <div className="flex flex-wrap items-center gap-3">
          <span>狀態更新後會立即套用至前台查詢。</span>
          {isB2c ? (
            <Link
              className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
              href="/admin/products/new"
            >
              新增 B2C 商品
            </Link>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">品牌／分類</th>
              <th className="px-4 py-3">規格</th>
              {isB2c ? <th className="px-4 py-3">價格／庫存</th> : null}
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EDF0] bg-white">
            {products.map((product) => {
              const key = `${channel}-product-${product.id}`;
              return (
                <tr key={product.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-[#17242A]">{product.name}</p>
                    <p className="mt-1 text-xs text-[#809099]">
                      {product.product_code ?? product.slug ?? product.id}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">
                    <p>{product.brand || "未填品牌"}</p>
                    <p className="mt-1 text-xs text-[#809099]">{product.category}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">{product.specification}</td>
                  {isB2c ? (
                    <td className="px-4 py-4 align-top text-[#536168]">
                      <p>{formatMoney(product.price)}</p>
                      <p className="mt-1 text-xs text-[#809099]">模擬庫存 {product.mock_inventory ?? 0}</p>
                    </td>
                  ) : null}
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(product.is_active)}`}>
                      {product.is_active ? "上架中" : "已下架"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      {isB2c ? (
                        <Link
                          aria-label={`編輯 ${product.name}`}
                          className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`}
                          href={`/admin/products/${product.id}`}
                        >
                          編輯
                        </Link>
                      ) : null}
                      <button
                        className={`${buttonClass} ${
                          product.is_active
                            ? "border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]"
                            : "bg-[#005DAA] text-white hover:bg-[#00457F]"
                        }`}
                        disabled={busyKey === key}
                        onClick={() => void onToggle(channel, product)}
                        type="button"
                      >
                        {busyKey === key ? "處理中…" : product.is_active ? "下架" : "上架"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-[#809099]" colSpan={isB2c ? 6 : 5}>
                  目前沒有商品資料。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

const B2B_STATUS_OPTIONS: B2bProductStatus[] = [
  "draft",
  "review",
  "published",
  "offline",
];

function b2bStatusClass(status: B2bProductStatus) {
  if (status === "published") return "border-[#B8E1CB] bg-[#F0FBF4] text-[#18794E]";
  if (status === "offline") return "border-[#E5D2D0] bg-[#FFF5F4] text-[#A43B34]";
  if (status === "review") return "border-[#F1D8A5] bg-[#FFF9E9] text-[#8A5A00]";
  return "border-[#C5D8E9] bg-[#EEF7FD] text-[#00457F]";
}

function B2bProductPanel({ revision, busyKey }: { revision: number; busyKey: string }) {
  const params = useSearchParams();
  const appliedSearch = params.get("product_q") ?? "";
  const appliedStatus = params.get("product_status") ?? "all";
  const missing = params.get("missing_images") === "true";
  const page = Number(params.get("product_page")) || 1;
  const query = new URLSearchParams({ include_inactive: "true", page: String(page), page_size: "25" });
  if (appliedSearch) query.set("q", appliedSearch);
  if (appliedStatus !== "all") query.set("status", appliedStatus);
  if (missing) query.set("missing_images", "true");
  const resource = useAdminResource<{ products: Product[]; total: number }>(`/api/admin/products/b2b?${query}`, revision);
  const products = resource.data?.products ?? [];
  const filteredProducts = products;
  const pages = Math.max(1, Math.ceil((resource.data?.total ?? 0) / 25));
  const [search, setSearch] = useState(appliedSearch);
  const [statusFilter, setStatusFilter] = useState(appliedStatus);
  const [missingFilter, setMissingFilter] = useState(missing);
  async function onReload() { if (!await resource.reload()) throw new Error("已儲存，但最新商品清單讀取失敗。請重新讀取，勿重送操作。"); }
  useEffect(() => { if (resource.data && page > pages) { changeAdminQuery({ product_page: String(pages) }, true); window.dispatchEvent(new CustomEvent("admin-navigation-notice", { detail: "資料已更新，已調整頁碼。" })); } }, [resource.data, page, pages]);
  const [bulkStatus, setBulkStatus] = useState<B2bProductStatus>("review");
  const [selected, setSelected] = useState<string[]>([]);
  const [localBusy, setLocalBusy] = useState("");
  const [message, setMessage] = useState("");

  async function updateStatus(product: Product, nextStatus: B2bProductStatus) {
    const currentStatus = product.status ?? (product.is_active ? "published" : "offline");
    if (currentStatus === nextStatus) return;
    if (
      (nextStatus === "published" || nextStatus === "offline") &&
      !window.confirm(`確定要將「${product.name}」設為${statusLabels[nextStatus]}嗎？`)
    ) {
      return;
    }

    setLocalBusy(product.id);
    setMessage("");
    try {
      await requestJson(`/api/admin/products/b2b/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, expected_updated_at: product.updated_at }),
      });
      await onReload();
      setMessage(`「${product.name}」已更新為${statusLabels[nextStatus]}。`);
    } catch (actionError) {
      setMessage(actionError instanceof Error ? actionError.message : "商品狀態更新失敗。");
    } finally {
      setLocalBusy("");
    }
  }

  async function updateBulkStatus() {
    if (selected.length === 0) return;
    if (!window.confirm(`確定要更新選取的 ${selected.length} 筆商品嗎？`)) return;
    setLocalBusy("bulk");
    setMessage("");
    try {
      await requestJson("/api/admin/products/b2b/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: selected, status: bulkStatus }),
      });
      setSelected([]);
      await onReload();
      setMessage(`已批次更新為${statusLabels[bulkStatus]}。`);
    } catch (actionError) {
      setMessage(actionError instanceof Error ? actionError.message : "批次狀態更新失敗。");
    } finally {
      setLocalBusy("");
    }
  }

  return (
    <PanelShell
      description="管理 B2B 商品資料、工作狀態與圖片；下架商品保留資料，不提供硬刪除。"
      title="B2B 商品型錄管理"
    >
      <B2bCsvImportPanel onImported={onReload} />
      <form className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between" onSubmit={(event) => { event.preventDefault(); changeAdminQuery({ product_q: search.trim(), product_status: statusFilter, missing_images: String(missingFilter), product_page: "1" }); }}>
        <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <label className="text-sm font-semibold text-[#536168]">
            搜尋商品
            <input
              className={inputClass}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="代碼、名稱、品牌或分類"
              value={search}
            />
          </label>
          <label className="text-sm font-semibold text-[#536168]">
            狀態
            <select
              className={inputClass}
              onChange={(event) => setStatusFilter(event.target.value as "all" | B2bProductStatus)}
              value={statusFilter}
            >
              <option value="all">全部狀態</option>
              {B2B_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
        </div>
        <Link
          className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
          href="/admin/business/products/new"
        >
          新增 B2B 商品
        </Link>
        <label className={styles.muted}><input type="checkbox" checked={missingFilter} onChange={(event) => setMissingFilter(event.target.checked)} /> 尚無圖片</label>
        <button type="submit" className={styles.primary}>套用篩選</button>
        <button type="button" className={styles.button} onClick={() => changeAdminQuery({ product_q: null, product_status: null, missing_images: null, product_page: null })}>清除篩選</button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#D8E1E5] bg-[#F8FBFC] p-3">
        <span className="text-sm text-[#536168]">已選 {selected.length} 筆</span>
        <select
          aria-label="批次狀態"
          className="min-h-10 rounded-lg border border-[#D8E1E5] bg-white px-3 text-sm"
          onChange={(event) => setBulkStatus(event.target.value as B2bProductStatus)}
          value={bulkStatus}
        >
          {B2B_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{statusLabels[status]}</option>
          ))}
        </select>
        <button
          className={`${buttonClass} bg-[#17242A] text-white hover:bg-[#31434B]`}
          disabled={selected.length === 0 || localBusy === "bulk" || Boolean(busyKey)}
          onClick={() => void updateBulkStatus()}
          type="button"
        >
          {localBusy === "bulk" ? "處理中…" : "批次更新狀態"}
        </button>
        {message ? <span className="text-sm text-[#536168]" role="status">{message}</span> : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#536168]">
        <span>共 {resource.data?.total ?? "—"} 筆 · 第 {page}／{pages} 頁</span>
        <span>批次操作只允許合法狀態轉換。</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
            <tr>
              <th className="w-12 px-4 py-3"><span className="sr-only">選取</span></th>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">品牌／分類</th>
              <th className="px-4 py-3">圖片</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">更新時間</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EDF0] bg-white">
            {filteredProducts.map((product) => {
              const status = product.status ?? (product.is_active ? "published" : "offline");
              const isBusy = localBusy === product.id;
              return (
                <tr key={product.id}>
                  <td className="px-4 py-4 align-top">
                    <input
                      aria-label={`選取 ${product.name}`}
                      checked={selected.includes(product.id)}
                      onChange={(event) => setSelected((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Link className="font-bold text-[#005DAA] hover:underline" href={`/admin/business/products/${product.id}`}>
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-[#809099]">{product.product_code ?? product.id}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">
                    <p>{product.brand || "未填品牌"}</p>
                    <p className="mt-1 text-xs text-[#809099]">{product.category}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">
                    {product.image_count ? `${product.image_count} 張` : "尚無圖片"}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <select
                      aria-label={`${product.name} 狀態`}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-bold ${b2bStatusClass(status)}`}
                      disabled={isBusy || !!localBusy || resource.pending || !!resource.error}
                      onChange={(event) => void updateStatus(product, event.target.value as B2bProductStatus)}
                      value={status}
                    >
                      {B2B_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{statusLabels[option]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 align-top text-xs text-[#536168]">{formatDate(product.updated_at)}</td>
                  <td className="px-4 py-4 text-right align-top">
                    <Link className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} href={`/admin/business/products/${product.id}`}>
                      編輯
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 ? (
              <tr><td className="px-4 py-10 text-center text-[#809099]" colSpan={7}>目前沒有符合條件的商品。</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ResourceState {...resource} hasData={!!resource.data} />
      <div className={styles.actions}>
        <button className={styles.button} type="button" disabled={page <= 1 || resource.pending} onClick={() => changeAdminQuery({ product_page: String(page - 1) })}>上一頁</button>
        <button className={styles.button} type="button" disabled={page >= pages || resource.pending} onClick={() => changeAdminQuery({ product_page: String(page + 1) })}>下一頁</button>
      </div>
    </PanelShell>
  );
}

function OrderPanel({
  orders,
  products,
  busyKey,
  onUpdateStatus,
}: {
  orders: Order[];
  products: Product[];
  busyKey: string;
  onUpdateStatus: (orderId: string, status: Order["status"]) => void;
}) {
  const productById = new Map(products.map((product) => [product.id, product.name]));
  return (
    <PanelShell
      description="查看展示用 B2C 訂單的收件資訊與品項，並更新處理狀態。此模組不代表正式金流或出貨系統。"
      title="B2C 訂單管理"
    >
      <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
            <tr>
              <th className="px-4 py-3">建立時間／訂單編號</th>
              <th className="px-4 py-3">收件人</th>
              <th className="px-4 py-3">品項</th>
              <th className="px-4 py-3">金額</th>
              <th className="px-4 py-3">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EDF0] bg-white">
            {orders.map((order) => {
              const total = order.items.reduce(
                (sum, item) => sum + Number(item.unit_price) * item.quantity,
                0,
              );
              return (
                <tr key={order.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="text-[#536168]">{formatDate(order.created_at)}</p>
                    <p className="mt-1 break-all text-xs text-[#809099]">{order.id}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-[#17242A]">{order.recipient_name}</p>
                    <p className="mt-1 text-xs text-[#536168]">{order.recipient_phone}</p>
                    <p className="mt-1 text-xs text-[#536168]">{order.recipient_email}</p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-[#809099]">{order.delivery_address}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {productById.get(item.product_id) ?? item.product_id} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-4 align-top font-semibold text-[#17242A]">{formatMoney(total)}</td>
                  <td className="px-4 py-4 align-top">
                    <select
                      className="min-h-10 rounded-lg border border-[#D8E1E5] bg-white px-3 text-sm text-[#17242A] outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
                      disabled={busyKey === `order-${order.id}`}
                      onChange={(event) =>
                        void onUpdateStatus(order.id, event.target.value as Order["status"])
                      }
                      value={order.status}
                    >
                      <option value="created">{statusLabels.created}</option>
                      <option value="processing">{statusLabels.processing}</option>
                      <option value="completed">{statusLabels.completed}</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-[#809099]" colSpan={5}>
                  目前沒有展示訂單。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

function CompanyPanel({
  companies,
  busyKey,
  form,
  onFormChange,
  onCreate,
  onToggle,
}: {
  companies: Company[];
  busyKey: string;
  form: CompanyForm;
  onFormChange: (form: CompanyForm) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onToggle: (company: Company) => void;
}) {
  return (
    <div className="space-y-6">
      <PanelShell
        description="新增動作由 admin 前端發起，但實際由伺服器建立 Supabase Auth identity 與 companies 資料；內部 Email 不會顯示給企業客戶。"
        title="新增企業會員帳號"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
          <div>
            <label className="text-sm font-semibold text-[#17242A]" htmlFor="company-name">企業名稱</label>
            <input
              className={inputClass}
              id="company-name"
              maxLength={160}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              required
              value={form.name}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#17242A]" htmlFor="company-client-code">外部客戶代碼</label>
            <input
              className={inputClass}
              id="company-client-code"
              maxLength={7}
              onChange={(event) => onFormChange({ ...form, clientCode: event.target.value.toUpperCase() })}
              pattern="[ZEW][0-9]{6}"
              placeholder="例如 Z232113"
              required
              value={form.clientCode}
            />
            <p className="mt-1 text-xs text-[#809099]">由外部公司系統提供，格式為 1 碼 Z／E／W 加 6 碼數字；建立後不可修改。</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#17242A]" htmlFor="company-password">初始密碼</label>
            <input
              autoComplete="new-password"
              className={inputClass}
              id="company-password"
              minLength={8}
              onChange={(event) => onFormChange({ ...form, password: event.target.value })}
              required
              type="password"
              value={form.password}
            />
            <p className="mt-1 text-xs text-[#809099]">8–72 個字元；此版本依既有規則使用公司共用密碼。</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#17242A]" htmlFor="company-password-again">確認初始密碼</label>
            <input
              autoComplete="new-password"
              className={inputClass}
              id="company-password-again"
              minLength={8}
              onChange={(event) => onFormChange({ ...form, passwordAgain: event.target.value })}
              required
              type="password"
              value={form.passwordAgain}
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EDF0] pt-4">
            <p className="text-sm leading-6 text-[#536168]">送出後會使用輸入的完整客戶代碼，請將代碼與初始密碼交付給企業窗口。</p>
            <button
              className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
              disabled={busyKey === "create-company"}
              type="submit"
            >
              {busyKey === "create-company" ? "建立中…" : "建立企業帳號"}
            </button>
          </div>
        </form>
      </PanelShell>

      <PanelShell
        description="停用只會阻止新的企業登入與型錄存取，不會刪除既有詢價紀錄。"
        title="企業會員清單"
      >
        <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
              <tr>
                <th className="px-4 py-3">企業</th>
                <th className="px-4 py-3">客戶代碼</th>
                <th className="px-4 py-3">級距</th>
                <th className="px-4 py-3">建立時間</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EDF0] bg-white">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-4 py-4 font-bold text-[#17242A]">{company.name}</td>
                  <td className="px-4 py-4 font-mono text-sm text-[#00457F]">{company.client_code}</td>
                  <td className="px-4 py-4 text-[#536168]">{company.prefix}｜{company.tier_label}</td>
                  <td className="px-4 py-4 text-[#536168]">{formatDate(company.created_at)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(company.is_active)}`}>
                      {company.is_active ? "啟用中" : "已停用"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      className={`${buttonClass} ${company.is_active ? "border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]" : "bg-[#005DAA] text-white hover:bg-[#00457F]"}`}
                      disabled={busyKey === `company-${company.id}`}
                      onClick={() => void onToggle(company)}
                      type="button"
                    >
                      {busyKey === `company-${company.id}` ? "處理中…" : company.is_active ? "停用" : "啟用"}
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 ? (
                <tr><td className="px-4 py-10 text-center text-[#809099]" colSpan={6}>目前沒有企業會員。</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PanelShell>
    </div>
  );
}

function StaffPanel({
  staff,
  busyKey,
  userId,
  role,
  setUserId,
  setRole,
  onAdd,
  onToggle,
  onRoleChange,
}: {
  staff: Staff[];
  busyKey: string;
  userId: string;
  role: Staff["role"];
  setUserId: (value: string) => void;
  setRole: (value: Staff["role"]) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onToggle: (member: Staff) => void;
  onRoleChange: (member: Staff, role: Staff["role"]) => void;
}) {
  return (
    <div className="space-y-6">
      <PanelShell
        description="輸入已存在的 Supabase Auth 使用者 UUID，將其加入管理成員。admin 可進入所有管理範圍；business_staff 僅能管理 B2B 商品與企業詢價。"
        title="新增管理成員"
      >
        <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={onAdd}>
          <label className="flex-1 text-sm font-semibold text-[#17242A]" htmlFor="staff-user-id">
            Auth 使用者 UUID
            <input
              className={inputClass}
              id="staff-user-id"
              onChange={(event) => setUserId(event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
              value={userId}
            />
          </label>
          <label className="text-sm font-semibold text-[#17242A]" htmlFor="staff-role">
            角色
            <select
              className={inputClass}
              id="staff-role"
              onChange={(event) => setRole(event.target.value as Staff["role"])}
              value={role}
            >
              <option value="business_staff">business_staff</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <button
            className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
            disabled={busyKey === "add-staff"}
            type="submit"
          >
            {busyKey === "add-staff" ? "加入中…" : "加入管理成員"}
          </button>
        </form>
      </PanelShell>

      <PanelShell
        description="停用會立即阻止該帳號進入管理 API；角色變更同樣由伺服器再次驗證。"
        title="管理成員清單"
      >
        <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
          <table className="min-w-[820px] w-full text-left text-sm">
            <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
              <tr>
                <th className="px-4 py-3">帳號</th>
                <th className="px-4 py-3">角色</th>
                <th className="px-4 py-3">建立時間</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EDF0] bg-white">
              {staff.map((member) => (
                <tr key={member.user_id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-[#17242A]">{member.email ?? "未設定 Email"}</p>
                    <p className="mt-1 break-all font-mono text-xs text-[#809099]">{member.user_id}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <select
                      aria-label={`${member.email ?? member.user_id} 角色`}
                      className="min-h-10 rounded-lg border border-[#D8E1E5] bg-white px-3 text-sm"
                      disabled={busyKey === `staff-${member.user_id}`}
                      onChange={(event) => onRoleChange(member, event.target.value as Staff["role"])}
                      value={member.role}
                    >
                      <option value="business_staff">business_staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">{formatDate(member.created_at)}</td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(member.is_active)}`}>
                      {member.is_active ? "啟用中" : "已停用"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <button
                      className={`${buttonClass} ${member.is_active ? "border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]" : "bg-[#005DAA] text-white hover:bg-[#00457F]"}`}
                      disabled={busyKey === `staff-${member.user_id}`}
                      onClick={() => onToggle(member)}
                      type="button"
                    >
                      {busyKey === `staff-${member.user_id}` ? "處理中…" : member.is_active ? "停用" : "啟用"}
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 ? (
                <tr><td className="px-4 py-10 text-center text-[#809099]" colSpan={5}>目前沒有管理成員。</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PanelShell>
    </div>
  );
}

function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
      <div className="mb-6 border-b border-[#E7EDF0] pb-5">
        <h2 className="text-xl font-bold text-[#17242A]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#536168]">{description}</p>
      </div>
      {children}
    </section>
  );
}
