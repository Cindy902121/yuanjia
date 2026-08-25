"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  B2B_PRODUCT_STATUSES,
  B2B_STATUS_LABELS,
  canTransitionB2bProductStatus,
  type B2bProductStatus,
} from "@/lib/admin-catalog";

type AdminTab =
  | "overview"
  | "b2c-products"
  | "b2c-orders"
  | "b2b-products"
  | "b2b-companies"
  | "b2b-rfqs";
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
  status?: B2bProductStatus;
  image_count?: number;
  thumbnail_url?: string | null;
  is_active: boolean;
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
  items: OrderItem[];
};

type Company = {
  id: string;
  client_code: string;
  name: string;
  prefix: string;
  tier_label: string;
  is_active: boolean;
  created_at: string;
};

type RfqItem = {
  id: string;
  quantity: number | string;
  unit: string;
  item_note: string | null;
  product: { product_code: string; name: string } | null;
};

type Rfq = {
  id: string;
  status: "new" | "processing" | "closed";
  customer_tier_snapshot: string;
  channel_snapshot: string;
  total_note: string | null;
  created_at: string;
  company: { client_code: string; name: string } | null;
  items: RfqItem[];
};

type CompanyForm = {
  name: string;
  prefix: "Z" | "E" | "W";
  password: string;
  passwordAgain: string;
};

type ApiPayload = { error?: string };

const tabs: Array<{ id: AdminTab; label: string; group: string }> = [
  { id: "overview", label: "總覽", group: "工作台" },
  { id: "b2c-products", label: "B2C 商品", group: "B2C" },
  { id: "b2c-orders", label: "B2C 訂單", group: "B2C" },
  { id: "b2b-products", label: "B2B 型錄", group: "B2B" },
  { id: "b2b-companies", label: "企業會員", group: "B2B" },
  { id: "b2b-rfqs", label: "企業詢價", group: "B2B" },
];

const tabsByScope: Record<AdminScope, AdminTab[]> = {
  admin: ["overview", "b2c-products", "b2c-orders", "b2b-companies"],
  business: ["b2b-products", "b2b-rfqs"],
};

const tierDescriptions = {
  Z: "月營業額 20 萬以下",
  E: "月營業額 50 萬以下",
  W: "其他",
};

const statusLabels = {
  created: "已建立",
  processing: "處理中",
  completed: "已完成",
  new: "新詢價",
  closed: "已結案",
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, cache: "no-store" });
  let payload: T & ApiPayload;
  try {
    payload = (await response.json()) as T & ApiPayload;
  } catch {
    payload = {} as T & ApiPayload;
  }
  if (!response.ok) {
    throw new Error(payload.error ?? "操作失敗，請稍後再試。");
  }
  return payload;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
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

function b2bStatusBadge(status: B2bProductStatus | undefined) {
  switch (status) {
    case "published":
      return "border-[#B8E1CB] bg-[#F0FBF4] text-[#18794E]";
    case "offline":
      return "border-[#E5D2D0] bg-[#FFF5F4] text-[#A43B34]";
    case "review":
      return "border-[#F2D7A3] bg-[#FFF9E9] text-[#8A5A00]";
    default:
      return "border-[#D8E1E5] bg-[#F4F7F8] text-[#536168]";
  }
}

export function AdminDashboard({
  initialTab,
  scope = "admin",
}: {
  initialTab?: AdminTab;
  scope?: AdminScope;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialTab ?? (scope === "business" ? "b2b-products" : "overview"),
  );
  const visibleTabs = tabs.filter((tab) => tabsByScope[scope].includes(tab.id));
  const [b2cProducts, setB2cProducts] = useState<Product[]>([]);
  const [b2bProducts, setB2bProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [credentialNotice, setCredentialNotice] = useState("");
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    name: "",
    prefix: "Z",
    password: "",
    passwordAgain: "",
  });

  const loadProducts = useCallback(async (channel: Channel) => {
    const payload = await requestJson<{ products: Product[] }>(
      `/api/admin/products/${channel}?include_inactive=true`,
    );
    if (channel === "b2c") {
      setB2cProducts(payload.products ?? []);
    } else {
      setB2bProducts(payload.products ?? []);
    }
  }, []);

  const refreshB2bProducts = useCallback(() => loadProducts("b2b"), [loadProducts]);

  const loadOrders = useCallback(async () => {
    const payload = await requestJson<{ orders: Order[] }>("/api/b2c/mock-orders");
    setOrders(payload.orders ?? []);
  }, []);

  const loadCompanies = useCallback(async () => {
    const payload = await requestJson<{ companies: Company[] }>("/api/admin/companies");
    setCompanies(payload.companies ?? []);
  }, []);

  const loadRfqs = useCallback(async () => {
    const payload = await requestJson<{ rfqs: Rfq[] }>("/api/admin/rfqs");
    setRfqs(payload.rfqs ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      await Promise.all(
        scope === "business"
          ? [loadProducts("b2b"), loadRfqs()]
          : [
              loadProducts("b2c"),
              loadOrders(),
              loadCompanies(),
            ],
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "目前無法讀取後台資料。");
    } finally {
      setIsLoading(false);
    }
  }, [loadCompanies, loadOrders, loadProducts, loadRfqs, scope]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  const activeB2cCount = useMemo(
    () => b2cProducts.filter((product) => product.is_active).length,
    [b2cProducts],
  );
  const openOrderCount = useMemo(
    () => orders.filter((order) => order.status !== "completed").length,
    [orders],
  );

  function selectTab(tab: AdminTab) {
    setActiveTab(tab);
    setError("");
    setNotice("");
  }

  async function toggleProduct(product: Product) {
    if (
      product.is_active &&
      !window.confirm(`確定要下架「${product.name}」嗎？下架後前台將不再顯示。`)
    ) {
      return;
    }

    const key = `b2c-product-${product.id}`;
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      await requestJson(`/api/admin/products/b2c/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      await loadProducts("b2c");
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
        body: JSON.stringify({ order_id: orderId, status }),
      });
      await loadOrders();
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
        body: JSON.stringify({ is_active: !company.is_active }),
      });
      await loadCompanies();
      setNotice(`企業會員已${action}。`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "企業會員狀態更新失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function updateRfqStatus(rfqId: string, status: Rfq["status"]) {
    setBusyKey(`rfq-${rfqId}`);
    setError("");
    try {
      await requestJson("/api/admin/rfqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfq_id: rfqId, status }),
      });
      await loadRfqs();
      setNotice("企業詢價狀態已更新。");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "詢價狀態更新失敗。");
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
          prefix: companyForm.prefix,
          password: companyForm.password,
        }),
      });
      await loadCompanies();
      setCompanyForm({
        name: "",
        prefix: "Z",
        password: "",
        passwordAgain: "",
      });
      setCredentialNotice(
        `企業「${payload.company.name}」已建立。客戶代碼：${payload.credential.client_code}；${payload.credential.note}`,
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "企業會員建立失敗。");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main className="min-h-screen flex-1 bg-[#F4F7F8] text-[#17242A]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-[#D8E1E5] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#005DAA]">YUANJIA ADMIN</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17242A]">管理後台</h1>
            <p className="mt-2 text-sm leading-6 text-[#536168]">
              集中管理 B2C 商品、展示訂單、B2B 型錄與企業會員權限。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {scope !== "business" ? (
              <Link
                className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`}
                href="/admin/business"
              >
                B2B 管理
              </Link>
            ) : null}
            <Link
              className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`}
              href="/"
            >
              回到前台
            </Link>
            <button
              className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
              disabled={isLoading}
              onClick={() => void loadAll()}
              type="button"
            >
              {isLoading ? "讀取中…" : "重新整理"}
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[#D8E1E5] bg-white p-3 shadow-[0_8px_24px_rgba(23,36,42,0.04)]">
            <p className="px-3 pb-2 pt-1 text-xs font-bold tracking-[0.16em] text-[#809099]">管理模組</p>
            <nav aria-label="管理後台模組" className="space-y-1">
              {visibleTabs.map((tab, index) => {
                const isFirstInGroup =
                  index === 0 || visibleTabs[index - 1].group !== tab.group;
                return (
                  <div key={tab.id}>
                    {isFirstInGroup && index !== 0 ? (
                      <p className="px-3 pb-1 pt-4 text-[11px] font-bold tracking-[0.14em] text-[#9AA8AE]">
                        {tab.group}
                      </p>
                    ) : null}
                    <button
                      aria-current={activeTab === tab.id ? "page" : undefined}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                        activeTab === tab.id
                          ? "bg-[#EAF5FB] text-[#005DAA]"
                          : "text-[#536168] hover:bg-[#F4F7F8] hover:text-[#17242A]"
                      }`}
                      onClick={() => selectTab(tab.id)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  </div>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
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

            {isLoading && activeTab !== "b2b-products" ? (
              <div className="rounded-2xl border border-[#D8E1E5] bg-white p-8 text-center text-sm text-[#536168]">
                正在讀取管理資料…
              </div>
            ) : (
              <>
                {activeTab === "overview" ? (
                  <Overview
                    activeB2cCount={activeB2cCount}
                    companyCount={companies.filter((company) => company.is_active).length}
                    openOrderCount={openOrderCount}
                    onSelectTab={selectTab}
                  />
                ) : null}
                {activeTab === "b2c-products" ? (
                  <ProductPanel
                    busyKey={busyKey}
                    onToggle={toggleProduct}
                    products={b2cProducts}
                  />
                ) : null}
                {activeTab === "b2b-products" ? (
                  <B2bProductPanel
                    loading={isLoading}
                    onRefresh={refreshB2bProducts}
                    products={b2bProducts}
                  />
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
                  <RfqPanel
                    busyKey={busyKey}
                    onUpdateStatus={updateRfqStatus}
                    rfqs={rfqs}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Overview({
  activeB2cCount,
  companyCount,
  openOrderCount,
  onSelectTab,
}: {
  activeB2cCount: number;
  companyCount: number;
  openOrderCount: number;
  onSelectTab: (tab: AdminTab) => void;
}) {
  const metrics = [
    { label: "B2C 上架商品", value: activeB2cCount, tab: "b2c-products" as AdminTab },
    { label: "啟用企業會員", value: companyCount, tab: "b2b-companies" as AdminTab },
    { label: "待處理 B2C 訂單", value: openOrderCount, tab: "b2c-orders" as AdminTab },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <button
            className="rounded-2xl border border-[#D8E1E5] bg-white p-5 text-left shadow-[0_8px_24px_rgba(23,36,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#9CC6E1]"
            key={metric.label}
            onClick={() => onSelectTab(metric.tab)}
            type="button"
          >
            <p className="text-sm text-[#536168]">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold text-[#17242A]">{metric.value}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-[#C5D8E9] bg-[#EEF7FD] p-6">
        <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">操作原則</p>
        <h2 className="mt-2 text-xl font-bold text-[#17242A]">上架狀態會立即影響前台型錄</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#536168]">
          商品上下架與企業停用都由伺服器驗證管理者權限後寫入資料庫。B2B 客戶代碼由後端產生，登入頁只接受 Z、E、W 加 6 碼數字，避免管理人員手動輸入造成重複或格式不一致。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <QuickAction
          description="查看啟用與停用商品，快速調整前台可見性。"
          label="管理商品上架狀態"
          onClick={() => onSelectTab("b2c-products")}
        />
        <QuickAction
          description="建立企業登入帳號並在同一頁取得新客戶代碼。"
          label="新增企業會員"
          onClick={() => onSelectTab("b2b-companies")}
        />
      </section>
    </div>
  );
}

function QuickAction({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-2xl border border-[#D8E1E5] bg-white p-5 text-left transition hover:border-[#9CC6E1] hover:bg-[#FBFDFE]"
      onClick={onClick}
      type="button"
    >
      <p className="font-bold text-[#17242A]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#536168]">{description}</p>
      <span className="mt-4 inline-block text-sm font-bold text-[#005DAA]">前往管理 →</span>
    </button>
  );
}

function B2bProductPanel({
  loading,
  onRefresh,
  products,
}: {
  loading: boolean;
  onRefresh: () => Promise<void>;
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | B2bProductStatus>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<B2bProductStatus | "">("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesSearch =
        !query ||
        [product.product_code, product.name, product.brand, product.category]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [products, search, statusFilter]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(product.id)),
    [products, selectedIds],
  );
  const availableBulkStatuses = useMemo(
    () =>
      B2B_PRODUCT_STATUSES.filter(
        (nextStatus) =>
          selectedProducts.length > 0 &&
          selectedProducts.every((product) =>
            canTransitionB2bProductStatus(product.status, nextStatus),
          ),
      ),
    [selectedProducts],
  );
  const allVisibleSelected =
    visibleProducts.length > 0 && visibleProducts.every((product) => selectedIds.includes(product.id));
  const selectedBulkStatus =
    bulkStatus !== "" && availableBulkStatuses.includes(bulkStatus) ? bulkStatus : "";

  async function refresh() {
    setRefreshing(true);
    setActionError("");
    try {
      await onRefresh();
      setMessage("商品清單已重新整理。");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "商品清單重新整理失敗。");
    } finally {
      setRefreshing(false);
    }
  }

  async function updateSelectedStatus() {
    if (
      !bulkStatus ||
      selectedProducts.length === 0 ||
      !availableBulkStatuses.includes(bulkStatus)
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    setActionError("");
    try {
      await requestJson("/api/admin/products/b2b/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: selectedProducts.map((product) => product.id),
          status: bulkStatus,
        }),
      });
      await onRefresh();
      setSelectedIds([]);
      setBulkStatus("");
      setMessage(`已更新 ${selectedProducts.length} 筆商品的狀態。`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "商品狀態更新失敗。");
    } finally {
      setBusy(false);
    }
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return [...new Set([...current, ...visibleProducts.map((product) => product.id)])];
      }
      const visibleIds = new Set(visibleProducts.map((product) => product.id));
      return current.filter((id) => !visibleIds.has(id));
    });
  }

  if (loading) {
    return (
      <PanelShell description="讀取 B2B 商品工作台資料。" title="B2B 商品工作台">
        <div aria-busy="true" className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="h-14 animate-pulse rounded-lg bg-[#F4F7F8]" key={index} />
          ))}
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      description="搜尋、篩選並批次管理 B2B 型錄商品；下架使用 offline 保留資料。"
      title="B2B 商品工作台"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold text-[#536168]">
          搜尋商品
          <input
            aria-label="搜尋 B2B 商品"
            className={inputClass}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="商品編號、名稱、品牌或分類"
            type="search"
            value={search}
          />
        </label>
        <label className="w-full text-sm font-semibold text-[#536168] md:w-44">
          狀態
          <select
            aria-label="依商品狀態篩選"
            className={inputClass}
            onChange={(event) => setStatusFilter(event.target.value as "all" | B2bProductStatus)}
            value={statusFilter}
          >
            <option value="all">所有狀態</option>
            {B2B_PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {B2B_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <Link
          className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
          href="/admin/business/products/new"
        >
          新增商品
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#536168]">
        <span>
          顯示 {visibleProducts.length} / {products.length} 筆
          {selectedProducts.length > 0 ? `，已選 ${selectedProducts.length} 筆` : ""}
        </span>
        <button
          className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`}
          disabled={refreshing}
          onClick={() => void refresh()}
          type="button"
        >
          {refreshing ? "整理中…" : "重新整理清單"}
        </button>
      </div>

      {actionError ? (
        <div className="mt-4 rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert">
          {actionError}
        </div>
      ) : null}
      {message ? (
        <div className="mt-4 rounded-xl border border-[#B8E1CB] bg-[#F0FBF4] px-4 py-3 text-sm text-[#18794E]" role="status">
          {message}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#D8E1E5] bg-[#F8FBFC] p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#536168]" aria-live="polite">
          批次操作：已選 {selectedProducts.length} 筆
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="批次更新商品狀態"
            className="min-h-10 rounded-lg border border-[#D8E1E5] bg-white px-3 text-sm text-[#17242A] focus:border-[#005DAA] focus:outline-none"
            disabled={selectedProducts.length === 0 || availableBulkStatuses.length === 0 || busy}
            onChange={(event) => setBulkStatus(event.target.value as B2bProductStatus | "")}
            value={selectedBulkStatus}
          >
            <option value="">選擇下一狀態</option>
            {availableBulkStatuses.map((status) => (
              <option key={status} value={status}>
                {B2B_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <button
            className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
            disabled={
              selectedProducts.length === 0 ||
              !bulkStatus ||
              !availableBulkStatuses.includes(bulkStatus) ||
              busy
            }
            onClick={() => void updateSelectedStatus()}
            type="button"
          >
            {busy ? "更新中…" : "套用狀態"}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#D8E1E5]">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
            <tr>
              <th className="w-12 px-4 py-3" scope="col">
                <input
                  aria-label="全選目前顯示商品"
                  checked={allVisibleSelected}
                  disabled={visibleProducts.length === 0}
                  onChange={(event) => toggleAllVisible(event.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-4 py-3" scope="col">縮圖</th>
              <th className="px-4 py-3" scope="col">商品編號／名稱</th>
              <th className="px-4 py-3" scope="col">品牌／分類</th>
              <th className="px-4 py-3" scope="col">狀態</th>
              <th className="px-4 py-3" scope="col">圖片數</th>
              <th className="px-4 py-3" scope="col">更新時間</th>
              <th className="px-4 py-3 text-right" scope="col">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EDF0] bg-white">
            {visibleProducts.map((product) => {
              const status = product.status;
              return (
                <tr key={product.id}>
                  <td className="px-4 py-4 align-top">
                    <input
                      aria-label={`選取 ${product.name}`}
                      checked={selectedIds.includes(product.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, product.id]
                            : current.filter((id) => id !== product.id),
                        )
                      }
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[#D8E1E5] bg-[#F4F7F8] text-xs text-[#809099]">
                      {product.thumbnail_url ? (
                        <Image
                          alt=""
                          className="h-full w-full object-cover"
                          height={48}
                          src={product.thumbnail_url}
                          unoptimized
                          width={48}
                        />
                      ) : (
                        <span aria-hidden="true">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Link
                      className="font-bold text-[#005DAA] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                      href={`/admin/business/products/${product.id}`}
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-[#809099]">{product.product_code ?? product.id}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">
                    <p>{product.brand || "未填品牌"}</p>
                    <p className="mt-1 text-xs text-[#809099]">{product.category}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${b2bStatusBadge(status)}`}>
                      {status ? B2B_STATUS_LABELS[status] : "未設定"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-[#536168]">{product.image_count ?? 0}</td>
                  <td className="whitespace-nowrap px-4 py-4 align-top text-[#536168]">{formatDate(product.updated_at)}</td>
                  <td className="px-4 py-4 text-right align-top">
                    <Link
                      className="font-semibold text-[#005DAA] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                      href={`/admin/business/products/${product.id}`}
                    >
                      編輯
                    </Link>
                  </td>
                </tr>
              );
            })}
            {visibleProducts.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-[#809099]" colSpan={8}>
                  {products.length === 0 ? "目前沒有 B2B 商品資料。" : "找不到符合搜尋或狀態條件的商品。"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

function ProductPanel({
  products,
  busyKey,
  onToggle,
}: {
  products: Product[];
  busyKey: string;
  onToggle: (product: Product) => void;
}) {
  return (
    <PanelShell
      description="管理 B2C 前台商品是否可見；下架不會刪除商品資料。"
      title="B2C 商品上架管理"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#536168]">
        <span>共 {products.length} 筆，已上架 {products.filter((product) => product.is_active).length} 筆</span>
        <span>狀態更新後會立即套用至前台查詢。</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">品牌／分類</th>
              <th className="px-4 py-3">規格</th>
              <th className="px-4 py-3">價格／庫存</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EDF0] bg-white">
            {products.map((product) => {
              const key = `b2c-product-${product.id}`;
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
                  <td className="px-4 py-4 align-top text-[#536168]">
                    <p>{formatMoney(product.price)}</p>
                    <p className="mt-1 text-xs text-[#809099]">模擬庫存 {product.mock_inventory ?? 0}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(product.is_active)}`}>
                      {product.is_active ? "上架中" : "已下架"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <button
                      className={`${buttonClass} ${
                        product.is_active
                          ? "border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]"
                          : "bg-[#005DAA] text-white hover:bg-[#00457F]"
                      }`}
                      disabled={busyKey === key}
                      onClick={() => void onToggle(product)}
                      type="button"
                    >
                      {busyKey === key ? "處理中…" : product.is_active ? "下架" : "上架"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-[#809099]" colSpan={6}>
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
            <label className="text-sm font-semibold text-[#17242A]" htmlFor="company-prefix">客戶代碼級距</label>
            <select
              className={inputClass}
              id="company-prefix"
              onChange={(event) => onFormChange({ ...form, prefix: event.target.value as CompanyForm["prefix"] })}
              value={form.prefix}
            >
              {Object.entries(tierDescriptions).map(([prefix, label]) => (
                <option key={prefix} value={prefix}>{prefix}｜{label}</option>
              ))}
            </select>
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
            <p className="text-sm leading-6 text-[#536168]">送出後後端會自動產生 1 碼前綴＋6 碼亂數客戶代碼，請將代碼與初始密碼交付給企業窗口。</p>
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

function RfqPanel({
  rfqs,
  busyKey,
  onUpdateStatus,
}: {
  rfqs: Rfq[];
  busyKey: string;
  onUpdateStatus: (rfqId: string, status: Rfq["status"]) => void;
}) {
  return (
    <PanelShell
      description="查看所有企業的詢價摘要與品項，並由內部人員更新處理進度。"
      title="B2B 企業詢價管理"
    >
      <div className="space-y-3">
        {rfqs.map((rfq) => (
          <article className="rounded-xl border border-[#D8E1E5] bg-white p-4" key={rfq.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-bold text-[#17242A]">{rfq.company?.name ?? "未綁定企業"}</p>
                <p className="mt-1 text-xs text-[#809099]">
                  {rfq.company?.client_code ?? "—"} · {formatDate(rfq.created_at)} · {rfq.customer_tier_snapshot}
                </p>
              </div>
              <select
                className="min-h-10 rounded-lg border border-[#D8E1E5] bg-white px-3 text-sm text-[#17242A] outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
                disabled={busyKey === `rfq-${rfq.id}`}
                onChange={(event) => void onUpdateStatus(rfq.id, event.target.value as Rfq["status"])}
                value={rfq.status}
              >
                <option value="new">{statusLabels.new}</option>
                <option value="processing">{statusLabels.processing}</option>
                <option value="closed">{statusLabels.closed}</option>
              </select>
            </div>
            <ul className="mt-4 grid gap-2 border-t border-[#E7EDF0] pt-3 text-sm text-[#536168] md:grid-cols-2">
              {rfq.items.map((item) => (
                <li key={item.id}>
                  <span className="font-semibold text-[#17242A]">{item.product?.name ?? item.product?.product_code ?? "未知商品"}</span>
                  <span> · {item.quantity} {item.unit}</span>
                  {item.item_note ? <span className="text-xs text-[#809099]">（{item.item_note}）</span> : null}
                </li>
              ))}
            </ul>
            {rfq.total_note ? <p className="mt-3 text-sm leading-6 text-[#536168]">備註：{rfq.total_note}</p> : null}
          </article>
        ))}
        {rfqs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#B8CBD4] p-10 text-center text-sm text-[#809099]">目前沒有企業詢價。</div>
        ) : null}
      </div>
    </PanelShell>
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
