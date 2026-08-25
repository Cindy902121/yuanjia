"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  B2B_PRODUCT_CODE_PATTERN,
  B2B_PRODUCT_FIELD_RULES,
  B2B_STATUS_LABELS,
  isB2bProductStatus,
  type B2bProductStatus,
} from "@/lib/admin-catalog";

type B2bFieldKey = (typeof B2B_PRODUCT_FIELD_RULES)[number]["key"];
type B2bForm = Record<B2bFieldKey, string>;
type FieldErrors = Partial<Record<B2bFieldKey, string>>;

type B2bProduct = B2bForm & {
  id: string;
  status: unknown;
  updated_at: string;
  tags?: unknown[];
  specification_options?: unknown[];
  images?: unknown[];
};

type ApiResult<T> = T & { error?: string };

const emptyForm: B2bForm = {
  product_code: "",
  name: "",
  brand: "",
  category: "",
  specification: "",
  packaging: "",
  origin: "",
  storage_method: "",
  description: "",
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB] disabled:cursor-not-allowed disabled:bg-[#F4F7F8] read-only:bg-[#F4F7F8]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, cache: "no-store" });
  let payload: ApiResult<T>;
  try {
    payload = (await response.json()) as ApiResult<T>;
  } catch {
    payload = {} as ApiResult<T>;
  }
  if (!response.ok) {
    throw new Error(payload.error ?? "操作失敗，請稍後再試。");
  }
  return payload;
}

function formFromProduct(product: B2bProduct): B2bForm {
  return {
    product_code: product.product_code ?? "",
    name: product.name ?? "",
    brand: product.brand ?? "",
    category: product.category ?? "",
    specification: product.specification ?? "",
    packaging: product.packaging ?? "",
    origin: product.origin ?? "",
    storage_method: product.storage_method ?? "",
    description: product.description ?? "",
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "尚未儲存";
  }
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function fieldForError(message: string): B2bFieldKey | null {
  if (message.includes("商品識別碼") || message.includes("product_code")) {
    return "product_code";
  }
  return B2B_PRODUCT_FIELD_RULES.find((rule) => message.startsWith(rule.label))?.key ?? null;
}

function statusClass(status: B2bProductStatus) {
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

function ProductField({
  error,
  isEditing,
  onChange,
  rule,
  value,
}: {
  error?: string;
  isEditing: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rule: (typeof B2B_PRODUCT_FIELD_RULES)[number];
  value: string;
}) {
  const fieldId = `b2b-product-${rule.key}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-hint`;
  const isDescription = rule.key === "description";
  const isCode = rule.key === "product_code";
  const describedBy = error ? `${descriptionId} ${errorId}` : descriptionId;

  return (
    <label className={isDescription ? "sm:col-span-2" : ""} htmlFor={fieldId}>
      <span className="text-sm font-semibold text-[#17242A]">
        {rule.label}
        {rule.required ? <span className="ml-1 text-[#B42318]" aria-hidden="true">*</span> : null}
      </span>
      {isDescription ? (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={`${inputClass} min-h-36 resize-y`}
          id={fieldId}
          maxLength={rule.maxLength}
          name={rule.key}
          onChange={onChange}
          required={rule.required}
          rows={5}
          value={value}
        />
      ) : (
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={inputClass}
          id={fieldId}
          maxLength={rule.maxLength}
          name={rule.key}
          onChange={onChange}
          pattern={isCode ? B2B_PRODUCT_CODE_PATTERN : undefined}
          readOnly={isEditing && isCode}
          required={rule.required}
          type="text"
          value={value}
        />
      )}
      <span className="mt-1 block text-xs leading-5 text-[#536168]" id={descriptionId}>
        {rule.hint}
      </span>
      {error ? <span className="mt-1 block text-xs font-semibold text-[#B42318]" id={errorId}>{error}</span> : null}
    </label>
  );
}

export function ProductEditor({
  productId,
  savedMessage = false,
}: {
  productId?: string;
  savedMessage?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const ignoreNextPopRef = useRef(false);
  const [currentProductId, setCurrentProductId] = useState(productId ?? null);
  const [form, setForm] = useState<B2bForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<B2bForm>(emptyForm);
  const [status, setStatus] = useState<B2bProductStatus>("draft");
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [tagCount, setTagCount] = useState(0);
  const [optionCount, setOptionCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState(savedMessage ? "商品已建立，狀態為草稿。" : "");

  const isEditing = currentProductId !== null;
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;
    void requestJson<{ product: B2bProduct }>(`/api/admin/products/b2b/${productId}`)
      .then(({ product }) => {
        if (cancelled) {
          return;
        }
        const nextForm = formFromProduct(product);
        setCurrentProductId(product.id);
        setForm(nextForm);
        setSavedForm(nextForm);
        setStatus(isB2bProductStatus(product.status) ? product.status : "draft");
        setLastModified(product.updated_at);
        setTagCount(product.tags?.length ?? 0);
        setOptionCount(product.specification_options?.length ?? 0);
        setImageCount(product.images?.length ?? 0);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "目前無法讀取商品。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onPopState = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }
      if (!dirty || window.confirm("有尚未儲存的變更，確定要離開嗎？")) {
        return;
      }
      ignoreNextPopRef.current = true;
      window.history.go(1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty]);

  function updateField(field: B2bFieldKey, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function leaveEditor() {
    if (dirty && !window.confirm("有尚未儲存的變更，確定要離開嗎？")) {
      return;
    }
    router.push("/admin/business");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError("");
    setFieldErrors({});
    setMessage("");
    if (!formRef.current?.reportValidity()) {
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<B2bForm> = { ...form };
      if (isEditing) {
        delete payload.product_code;
      }
      const result = await requestJson<{ product: B2bProduct }>(
        isEditing
          ? `/api/admin/products/b2b/${currentProductId}`
          : "/api/admin/products/b2b",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const nextForm = formFromProduct(result.product);
      setCurrentProductId(result.product.id);
      setForm(nextForm);
      setSavedForm(nextForm);
      setStatus(isB2bProductStatus(result.product.status) ? result.product.status : "draft");
      setLastModified(result.product.updated_at);
      setMessage(isEditing ? "變更已儲存。" : "商品已建立，狀態為草稿。");
      if (!isEditing) {
        router.replace(`/admin/business/products/${result.product.id}?saved=1`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "儲存失敗，請稍後再試。";
      const field = fieldForError(errorMessage);
      if (field) {
        setFieldErrors({ [field]: errorMessage });
      }
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7F8] text-[#17242A]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <button
            className="text-sm font-semibold text-[#005DAA] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={leaveEditor}
            type="button"
          >
            ← 返回 B2B 商品工作台
          </button>
          <div className="mt-5 flex flex-col gap-4 border-b border-[#D8E1E5] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#536168]">B2B 商品管理</p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-[#17242A] sm:text-3xl">
                {isEditing ? "編輯商品" : "新增商品"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#536168]">
                基本資料儲存後會留在此頁；標籤、規格選項與圖片在後續管理區段完成。
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={`rounded-full border px-3 py-1 font-semibold ${statusClass(status)}`}>
                {B2B_STATUS_LABELS[status]}
              </span>
              <span className="text-[#536168]">最後修改：{formatDate(lastModified)}</span>
            </div>
          </div>
        </header>

        {loadError ? (
          <div className="mt-6 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]" role="alert">
            {loadError}
          </div>
        ) : null}
        {saveError ? (
          <div className="mt-6 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]" role="alert">
            {saveError}
          </div>
        ) : null}
        {message ? (
          <div className="mt-6 rounded-xl border border-[#B8E1CB] bg-[#F0FBF4] px-4 py-3 text-sm text-[#18794E]" role="status">
            {message}
          </div>
        ) : null}

        <form className="mt-6" onSubmit={(event) => void save(event)} ref={formRef}>
          <section aria-labelledby="basic-data-title" className="rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="basic-data-title">基本資料</h2>
              <p className="text-sm leading-6 text-[#536168]">標示 * 的欄位為必填；資料會依 B2B 商品規則檢查格式與長度。</p>
            </div>
            {loading ? (
              <div aria-busy="true" className="mt-6 space-y-3">
                <div className="h-12 animate-pulse rounded-lg bg-[#F4F7F8]" />
                <div className="h-28 animate-pulse rounded-lg bg-[#F4F7F8]" />
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {B2B_PRODUCT_FIELD_RULES.map((rule) => (
                  <ProductField
                    error={fieldErrors[rule.key]}
                    isEditing={isEditing}
                    key={rule.key}
                    onChange={(event) => updateField(rule.key, event.target.value)}
                    rule={rule}
                    value={form[rule.key]}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="status-tags-title" className="mt-5 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="status-tags-title">狀態／標籤</h2>
              <p className="text-sm leading-6 text-[#536168]">狀態沿用工作台的審核流程；標籤維護會在後續區段開放。</p>
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#17242A]">目前狀態</p>
                <p className="mt-1 text-sm text-[#536168]">{B2B_STATUS_LABELS[status]} · 已套用 {tagCount} 個標籤</p>
              </div>
              <button className={`${buttonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168]`} disabled type="button">
                管理標籤（即將開放）
              </button>
            </div>
          </section>

          <section aria-labelledby="options-title" className="mt-5 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="options-title">規格選項</h2>
              <p className="text-sm leading-6 text-[#536168]">商品主規格已在基本資料維護；可選規格將在後續區段管理。</p>
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#536168]">目前有 {optionCount} 個啟用中的規格選項。</p>
              <button className={`${buttonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168]`} disabled type="button">
                管理規格選項（即將開放）
              </button>
            </div>
          </section>

          <section aria-labelledby="images-title" className="mt-5 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="images-title">圖片管理</h2>
              <p className="text-sm leading-6 text-[#536168]">封面與詳細圖片會在圖片管理區段上傳、排序與移除。</p>
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#536168]">目前有 {imageCount} 張圖片。</p>
              <button className={`${buttonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168]`} disabled type="button">
                管理圖片（即將開放）
              </button>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 mt-6 flex flex-col gap-3 rounded-xl border border-[#D8E1E5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className={`text-sm ${dirty ? "font-semibold text-[#C84B31]" : "text-[#536168]"}`}>
              {dirty ? "有尚未儲存的變更" : "目前沒有尚未儲存的變更"}
            </p>
            <button
              className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
              disabled={saving || loading || !dirty}
              type="submit"
            >
              {saving ? "儲存中…" : "儲存變更"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
