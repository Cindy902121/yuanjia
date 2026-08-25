"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type { B2bProductStatus } from "@/lib/admin-catalog";

type AdminTab =
  | "overview"
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

type Staff = {
  user_id: string;
  email: string | null;
  role: "admin" | "business_staff";
  is_active: boolean;
  created_at: string;
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
  { id: "admin-staff", label: "管理帳號", group: "管理" },
];

const tabsByScope: Record<AdminScope, AdminTab[]> = {
  admin: ["overview", "b2c-products", "b2c-orders", "b2b-products", "b2b-companies", "b2b-rfqs", "admin-staff"],
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
  draft: "草稿",
  review: "待審核",
  published: "已發布",
  offline: "已下架",
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

  const loadStaff = useCallback(async () => {
    const payload = await requestJson<{ staff: Staff[] }>("/api/admin/staff");
    setStaff(payload.staff ?? []);
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
              loadProducts("b2b"),
              loadRfqs(),
              loadStaff(),
            ],
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "目前無法讀取後台資料。");
    } finally {
      setIsLoading(false);
    }
  }, [loadCompanies, loadOrders, loadProducts, loadRfqs, loadStaff, scope]);

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
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      await loadProducts(channel);
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
      await loadStaff();
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
      await loadStaff();
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
            <Link
              className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`}
              href={scope === "business" ? "/admin" : "/admin/business"}
            >
              {scope === "business" ? "管理總覽" : "B2B 管理"}
            </Link>
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

            {isLoading ? (
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
                    channel="b2c"
                    busyKey={busyKey}
                    onToggle={toggleProduct}
                    products={b2cProducts}
                  />
                ) : null}
                {activeTab === "b2b-products" ? (
                  <B2bProductPanel
                    busyKey={busyKey}
                    onReload={() => loadProducts("b2b")}
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
        <span>狀態更新後會立即套用至前台查詢。</span>
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

function B2bProductPanel({
  products,
  busyKey,
  onReload,
}: {
  products: Product[];
  busyKey: string;
  onReload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | B2bProductStatus>("all");
  const [bulkStatus, setBulkStatus] = useState<B2bProductStatus>("review");
  const [selected, setSelected] = useState<string[]>([]);
  const [localBusy, setLocalBusy] = useState("");
  const [message, setMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const status = product.status ?? (product.is_active ? "published" : "offline");
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const searchable = [
        product.product_code,
        product.name,
        product.brand,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [products, search, statusFilter]);

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
        body: JSON.stringify({ status: nextStatus }),
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
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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
      </div>

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
        <span>共 {filteredProducts.length} 筆，已發布 {products.filter((product) => (product.status ?? (product.is_active ? "published" : "offline")) === "published").length} 筆</span>
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
                      disabled={isBusy}
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
