"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  B2C_PRODUCT_FIELD_RULES,
  B2C_SLUG_PATTERN,
} from "@/lib/admin-catalog";

import { ProductImageManager } from "../business/products/product-image-manager";

type B2cTextFieldKey = (typeof B2C_PRODUCT_FIELD_RULES)[number]["key"];
type B2cFieldKey = B2cTextFieldKey | "price" | "mock_inventory";
type B2cForm = Record<B2cTextFieldKey, string> & {
  price: string;
  mock_inventory: string;
};
type FieldErrors = Partial<Record<B2cFieldKey, string>>;

type B2cTag = {
  id: string;
  group_name: string;
  slug: string;
  name: string;
};

type B2cProduct = Partial<B2cForm> & {
  id: string;
  is_active: boolean;
  updated_at: string;
};

type ApiResult<T> = T & { error?: string };

const emptyForm: B2cForm = {
  slug: "",
  name: "",
  brand: "",
  category: "",
  specification: "",
  short_description: "",
  origin: "",
  storage_method: "",
  description: "",
  food_safety_info: "",
  quality_info: "",
  price: "",
  mock_inventory: "0",
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition motion-reduce:transition-none placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB] disabled:cursor-not-allowed disabled:bg-[#F4F7F8] read-only:bg-[#F4F7F8]";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:opacity-50";

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

function formFromProduct(product: B2cProduct): B2cForm {
  return {
    slug: product.slug ?? "",
    name: product.name ?? "",
    brand: product.brand ?? "",
    category: product.category ?? "",
    specification: product.specification ?? "",
    short_description: product.short_description ?? "",
    origin: product.origin ?? "",
    storage_method: product.storage_method ?? "",
    description: product.description ?? "",
    food_safety_info: product.food_safety_info ?? "",
    quality_info: product.quality_info ?? "",
    price: product.price === undefined || product.price === null ? "" : String(product.price),
    mock_inventory: product.mock_inventory === undefined || product.mock_inventory === null
      ? "0"
      : String(product.mock_inventory),
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

function statusClass(isActive: boolean) {
  return isActive
    ? "border-[#B8E1CB] bg-[#F0FBF4] text-[#18794E]"
    : "border-[#E5D2D0] bg-[#FFF5F4] text-[#A43B34]";
}

function fieldForError(message: string): B2cFieldKey | null {
  if (message.includes("slug") || message.includes("網址代稱")) {
    return "slug";
  }
  if (message.includes("價格")) {
    return "price";
  }
  if (message.includes("模擬庫存")) {
    return "mock_inventory";
  }
  return B2C_PRODUCT_FIELD_RULES.find((rule) => message.startsWith(rule.label))?.key ?? null;
}

function ProductField({
  disabled,
  error,
  isEditing,
  onChange,
  rule,
  value,
}: {
  disabled: boolean;
  error?: string;
  isEditing: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rule: (typeof B2C_PRODUCT_FIELD_RULES)[number];
  value: string;
}) {
  const fieldId = `b2c-product-${rule.key}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-hint`;
  const isLongText = rule.key === "description";
  const isTextArea = isLongText || rule.key === "short_description" || rule.key === "food_safety_info" || rule.key === "quality_info";
  const isSlug = rule.key === "slug";
  const describedBy = error ? `${descriptionId} ${errorId}` : descriptionId;

  return (
    <label className={`min-w-0 ${isLongText ? "sm:col-span-2" : ""}`} htmlFor={fieldId}>
      <span className="text-sm font-semibold text-[#17242A]">
        {rule.label}
        {rule.required ? <span aria-hidden="true" className="ml-1 text-[#B42318]">*</span> : null}
      </span>
      {isTextArea ? (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={`${inputClass} ${isLongText ? "min-h-36" : "min-h-28"} resize-y`}
          disabled={disabled}
          id={fieldId}
          maxLength={rule.maxLength}
          name={rule.key}
          onChange={onChange}
          required={rule.required}
          rows={isLongText ? 5 : 3}
          value={value}
        />
      ) : (
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={inputClass}
          disabled={disabled}
          id={fieldId}
          maxLength={rule.maxLength}
          name={rule.key}
          onChange={onChange}
          pattern={isSlug ? B2C_SLUG_PATTERN : undefined}
          readOnly={isEditing && isSlug}
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

function NumberField({
  disabled,
  error,
  hint,
  label,
  min,
  onChange,
  step,
  value,
}: {
  disabled: boolean;
  error?: string;
  hint: string;
  label: string;
  min: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  step: string;
  value: string;
}) {
  const fieldId = `b2c-product-${label === "價格" ? "price" : "mock_inventory"}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  return (
    <label className="min-w-0" htmlFor={fieldId}>
      <span className="text-sm font-semibold text-[#17242A]">
        {label}<span aria-hidden="true" className="ml-1 text-[#B42318]">*</span>
      </span>
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        className={inputClass}
        disabled={disabled}
        id={fieldId}
        inputMode={step === "1" ? "numeric" : "decimal"}
        min={min}
        name={fieldId.replace("b2c-product-", "")}
        onChange={onChange}
        required
        step={step}
        type="number"
        value={value}
      />
      <span className="mt-1 block text-xs leading-5 text-[#536168]" id={hintId}>{hint}</span>
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
  const loadErrorRef = useRef<HTMLDivElement>(null);
  const saveErrorRef = useRef<HTMLDivElement>(null);
  const relatedErrorRef = useRef<HTMLDivElement>(null);
  const tagErrorRef = useRef<HTMLParagraphElement>(null);
  const ignoreNextPopRef = useRef(false);
  const [currentProductId, setCurrentProductId] = useState(productId ?? null);
  const [form, setForm] = useState<B2cForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<B2cForm>(emptyForm);
  const [isActive, setIsActive] = useState(false);
  const [savedIsActive, setSavedIsActive] = useState(false);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState(savedMessage ? "商品已建立，狀態為下架。" : "");
  const [availableTags, setAvailableTags] = useState<B2cTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savedTagIds, setSavedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);
  const [tagMessage, setTagMessage] = useState("");
  const [tagError, setTagError] = useState("");
  const [relatedLoading, setRelatedLoading] = useState(Boolean(productId));
  const [relatedError, setRelatedError] = useState("");
  const [productReloadKey, setProductReloadKey] = useState(0);
  const [relatedReloadKey, setRelatedReloadKey] = useState(0);
  const [hasCover, setHasCover] = useState(false);
  const [imagesDirty, setImagesDirty] = useState(false);

  const isEditing = currentProductId !== null;
  const basicDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );
  const statusDirty = isActive !== savedIsActive;
  const tagsDirty = useMemo(
    () => JSON.stringify([...selectedTagIds].sort()) !== JSON.stringify([...savedTagIds].sort()),
    [savedTagIds, selectedTagIds],
  );
  const dirty = basicDirty || statusDirty || tagsDirty || imagesDirty;
  const visibleTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    return availableTags.filter(
      (tag) =>
        !query ||
        [tag.name, tag.slug, tag.group_name].some((value) => value.toLowerCase().includes(query)),
    );
  }, [availableTags, tagSearch]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;
    void requestJson<{ product: B2cProduct }>(`/api/admin/products/b2c/${productId}`)
      .then(({ product }) => {
        if (cancelled) {
          return;
        }
        const nextForm = formFromProduct(product);
        setCurrentProductId(product.id);
        setForm(nextForm);
        setSavedForm(nextForm);
        setIsActive(Boolean(product.is_active));
        setSavedIsActive(Boolean(product.is_active));
        setLastModified(product.updated_at);
        setLoadError("");
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
  }, [productId, productReloadKey]);

  useEffect(() => {
    if (!currentProductId) {
      return;
    }

    let cancelled = false;
    void requestJson<{ tags: B2cTag[]; tag_ids: string[] }>(
      `/api/admin/products/b2c/${currentProductId}/tags`,
    )
      .then((result) => {
        if (cancelled) {
          return;
        }
        const nextTagIds = [...new Set(result.tag_ids ?? [])];
        setAvailableTags(result.tags ?? []);
        setSelectedTagIds(nextTagIds);
        setSavedTagIds(nextTagIds);
        setRelatedError("");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRelatedError(error instanceof Error ? error.message : "目前無法讀取 B2C 標籤。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRelatedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentProductId, relatedReloadKey]);

  useEffect(() => {
    if (loadError) {
      loadErrorRef.current?.focus();
    }
  }, [loadError]);

  useEffect(() => {
    if (saveError) {
      saveErrorRef.current?.focus();
    }
  }, [saveError]);

  useEffect(() => {
    if (relatedError) {
      relatedErrorRef.current?.focus();
    }
  }, [relatedError]);

  useEffect(() => {
    if (tagError) {
      tagErrorRef.current?.focus();
    }
  }, [tagError]);

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

  function updateField(field: B2cFieldKey, value: string) {
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

  function updateActive(nextActive: boolean) {
    if (nextActive && !hasCover) {
      setSaveError("B2C 商品上架前必須先設定封面圖。");
      return;
    }
    setSaveError("");
    setIsActive(nextActive);
  }

  function toggleTag(tagId: string, checked: boolean) {
    setSelectedTagIds((current) => {
      if (checked) {
        return [...new Set([...current, tagId])];
      }
      return current.filter((id) => id !== tagId);
    });
    setTagMessage("");
    setTagError("");
  }

  async function saveTags() {
    if (!currentProductId || tagsSaving) {
      return;
    }
    setTagsSaving(true);
    setTagError("");
    setTagMessage("");
    try {
      const result = await requestJson<{ tag_ids: string[] }>(
        `/api/admin/products/b2c/${currentProductId}/tags`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag_ids: selectedTagIds }),
        },
      );
      const nextTagIds = [...new Set(result.tag_ids ?? selectedTagIds)];
      setSelectedTagIds(nextTagIds);
      setSavedTagIds(nextTagIds);
      setTagMessage("標籤已更新。");
    } catch (error: unknown) {
      setTagError(error instanceof Error ? error.message : "標籤儲存失敗，請重試。");
    } finally {
      setTagsSaving(false);
    }
  }

  function leaveEditor() {
    if (dirty && !window.confirm("有尚未儲存的變更，確定要離開嗎？")) {
      return;
    }
    router.push("/admin");
  }

  function retryProductLoad() {
    setLoadError("");
    setLoading(true);
    setProductReloadKey((current) => current + 1);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError("");
    setFieldErrors({});
    setMessage("");
    if (!formRef.current?.reportValidity()) {
      return;
    }
    if (isActive && !savedIsActive && !hasCover) {
      setSaveError("B2C 商品上架前必須先設定封面圖。");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (isEditing) {
        delete payload.slug;
        if (statusDirty) {
          payload.is_active = isActive;
        }
      } else {
        payload.is_active = false;
      }
      const result = await requestJson<{ product: B2cProduct }>(
        isEditing
          ? `/api/admin/products/b2c/${currentProductId}`
          : "/api/admin/products/b2c",
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
      setIsActive(Boolean(result.product.is_active));
      setSavedIsActive(Boolean(result.product.is_active));
      setLastModified(result.product.updated_at);
      setMessage(isEditing ? "變更已儲存。" : "商品已建立，狀態為下架。");
      if (!isEditing) {
        setRelatedLoading(true);
        router.replace(`/admin/products/${result.product.id}?saved=1`);
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
    <main className="min-h-screen overflow-x-hidden bg-[#F4F7F8] text-[#17242A]">
      <div className="mx-auto min-w-0 w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <button
            className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#005DAA] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005DAA]"
            onClick={leaveEditor}
            type="button"
          >
            ← 返回 B2C 商品工作台
          </button>
          <div className="mt-5 flex min-w-0 flex-col gap-4 border-b border-[#D8E1E5] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#536168]">B2C 商品管理</p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-[#17242A] sm:text-3xl">
                {isEditing ? "編輯商品" : "新增商品"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#536168]">
                基本資料儲存後會留在此頁；標籤與圖片在後續管理區段完成。
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
              <span className={`rounded-full border px-3 py-1 font-semibold ${statusClass(isActive)}`}>
                {isActive ? "上架中" : "已下架"}
              </span>
              <span className="break-words text-[#536168]">最後修改：{formatDate(lastModified)}</span>
            </div>
          </div>
        </header>

        {loadError ? (
          <div
            className="mt-6 flex flex-col gap-3 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318] sm:flex-row sm:items-center sm:justify-between"
            ref={loadErrorRef}
            role="alert"
            tabIndex={-1}
          >
            <span>{loadError}</span>
            <button
              className={`${buttonClass} shrink-0 border border-[#F4C7C3] bg-white text-[#B42318] hover:bg-[#FFF5F4]`}
              disabled={loading}
              onClick={retryProductLoad}
              type="button"
            >
              {loading ? "讀取中…" : "重試讀取"}
            </button>
          </div>
        ) : null}
        {saveError ? (
          <div
            className="mt-6 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]"
            ref={saveErrorRef}
            role="alert"
            tabIndex={-1}
          >
            {saveError}
          </div>
        ) : null}
        {message ? (
          <div className="mt-6 rounded-xl border border-[#B8E1CB] bg-[#F0FBF4] px-4 py-3 text-sm text-[#18794E]" role="status">
            {message}
          </div>
        ) : null}
        {relatedError ? (
          <div
            className="mt-6 flex flex-col gap-3 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318] sm:flex-row sm:items-center sm:justify-between"
            ref={relatedErrorRef}
            role="alert"
            tabIndex={-1}
          >
            <span>B2C 標籤讀取失敗：{relatedError}</span>
            <button
              className={`${buttonClass} border border-[#F4C7C3] bg-white text-[#B42318] hover:bg-[#FFF5F4]`}
              onClick={() => {
                setRelatedError("");
                setRelatedLoading(true);
                setRelatedReloadKey((current) => current + 1);
              }}
              type="button"
            >
              重試讀取
            </button>
          </div>
        ) : null}

        <form className="mt-6 min-w-0 pb-20 sm:pb-6" onSubmit={(event) => void save(event)} ref={formRef}>
          <section aria-labelledby="b2c-basic-data-title" className="min-w-0 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="b2c-basic-data-title">基本資料</h2>
              <p className="text-sm leading-6 text-[#536168]">標示 * 的欄位為必填；網址代稱建立後不可修改。</p>
            </div>
            {loading ? (
              <div aria-busy="true" className="mt-6 space-y-3">
                <div className="h-12 animate-pulse rounded-lg bg-[#F4F7F8] motion-reduce:animate-none" />
                <div className="h-28 animate-pulse rounded-lg bg-[#F4F7F8] motion-reduce:animate-none" />
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {B2C_PRODUCT_FIELD_RULES.map((rule) => (
                  <ProductField
                    disabled={loading || saving || Boolean(loadError)}
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

          <section aria-labelledby="b2c-price-inventory-title" className="mt-5 min-w-0 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="b2c-price-inventory-title">價格／庫存</h2>
              <p className="text-sm leading-6 text-[#536168]">價格目前固定使用新台幣；庫存是展示用途的模擬數量，前台只顯示有庫存或售完。</p>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <NumberField
                disabled={loading || saving || Boolean(loadError)}
                error={fieldErrors.price}
                hint="單位：新台幣；可輸入到小數點後兩位。"
                label="價格"
                min="0"
                onChange={(event) => updateField("price", event.target.value)}
                step="0.01"
                value={form.price}
              />
              <NumberField
                disabled={loading || saving || Boolean(loadError)}
                error={fieldErrors.mock_inventory}
                hint="只能輸入 0 以上的整數。"
                label="模擬庫存"
                min="0"
                onChange={(event) => updateField("mock_inventory", event.target.value)}
                step="1"
                value={form.mock_inventory}
              />
            </div>
          </section>

          <section aria-labelledby="b2c-status-tags-title" className="mt-5 min-w-0 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="b2c-status-tags-title">上架狀態／標籤</h2>
              <p className="text-sm leading-6 text-[#536168]">商品必須有封面圖才能上架；標籤只能選用既有的啟用標籤。</p>
            </div>
            <div className="mt-5 flex flex-col gap-4 rounded-lg bg-[#F8FBFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#17242A]">目前狀態：{isActive ? "上架中" : "已下架"}</p>
                <p className="mt-1 text-sm text-[#536168]">
                  {!isEditing ? "先儲存基本資料，才能切換上架狀態。" : hasCover ? "狀態會在儲存商品時更新。" : "目前沒有封面圖，完成圖片後才能上架。"}
                </p>
              </div>
              <label className="flex min-h-11 shrink-0 items-center gap-3 text-sm font-semibold text-[#17242A]">
                <input
                  aria-label="B2C 商品上架狀態"
                  checked={isActive}
                  className="h-5 w-5 accent-[#005DAA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
                  disabled={!isEditing || loading || saving || Boolean(loadError) || (!isActive && !hasCover)}
                  onChange={(event) => updateActive(event.target.checked)}
                  type="checkbox"
                />
                上架
              </label>
            </div>

            {!isEditing ? (
              <p className="mt-5 rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168]">先儲存基本資料，才能管理 B2C 標籤。</p>
            ) : relatedError ? (
              <p className="mt-5 rounded-lg bg-[#FFF5F4] px-4 py-3 text-sm text-[#B42318]">請先重試讀取標籤資料。</p>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#17242A]">管理標籤</h3>
                  <button
                    className={`${buttonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168] hover:bg-[#EAF5FB]`}
                    disabled={tagsSaving || relatedLoading || selectedTagIds.length === 0}
                    onClick={() => {
                      setSelectedTagIds([]);
                      setTagMessage("");
                      setTagError("");
                    }}
                    type="button"
                  >
                    清除全部標籤
                  </button>
                </div>
                <label className="block max-w-xl" htmlFor="b2c-tag-search">
                  <span className="text-sm font-semibold text-[#17242A]">搜尋 B2C 標籤</span>
                  <input
                    aria-label="搜尋 B2C 標籤"
                    className={inputClass}
                    id="b2c-tag-search"
                    onChange={(event) => setTagSearch(event.target.value)}
                    placeholder="輸入標籤名稱、群組或代碼"
                    type="search"
                    value={tagSearch}
                  />
                </label>
                <div aria-label="B2C 標籤選擇" className="grid gap-2 sm:grid-cols-2" role="group">
                  {relatedLoading ? (
                    <div aria-busy="true" className="h-24 animate-pulse rounded-lg bg-[#F4F7F8] motion-reduce:animate-none sm:col-span-2" />
                  ) : visibleTags.length > 0 ? (
                    visibleTags.map((tag) => (
                      <label className="flex min-h-12 min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-[#D8E1E5] px-3 py-2 hover:border-[#005DAA]" key={tag.id}>
                        <input
                          checked={selectedTagIds.includes(tag.id)}
                          className="h-4 w-4 shrink-0 accent-[#005DAA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
                          disabled={tagsSaving}
                          onChange={(event) => toggleTag(tag.id, event.target.checked)}
                          type="checkbox"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#17242A]">{tag.name}</span>
                          <span className="block truncate text-xs text-[#536168]">{tag.group_name} · {tag.slug}</span>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168] sm:col-span-2">
                      {availableTags.length > 0 ? "找不到符合搜尋條件的 B2C 標籤。" : "目前沒有可用的 B2C 標籤。"}
                    </p>
                  )}
                </div>
                {tagError ? <p className="text-sm font-semibold text-[#B42318]" ref={tagErrorRef} role="alert" tabIndex={-1}>{tagError}</p> : null}
                {tagMessage ? <p className="text-sm font-semibold text-[#18794E]" role="status">{tagMessage}</p> : null}
                <button
                  className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
                  disabled={tagsSaving || relatedLoading || !tagsDirty}
                  onClick={() => void saveTags()}
                  type="button"
                >
                  {tagsSaving ? "儲存標籤中…" : "套用標籤"}
                </button>
              </div>
            )}
          </section>

          <ProductImageManager
            channel="b2c"
            key={currentProductId ?? "new-b2c-product"}
            onCoverChange={setHasCover}
            onDirtyChange={setImagesDirty}
            productId={currentProductId}
          />

          <div className="sticky bottom-4 z-10 mt-6 flex min-w-0 scroll-mb-24 flex-col gap-3 rounded-xl border border-[#D8E1E5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className={`break-words text-sm ${dirty ? "font-semibold text-[#C84B31]" : "text-[#536168]"}`}>
              {basicDirty ? "有尚未儲存的基本資料" : statusDirty ? "有尚未儲存的上架狀態" : tagsDirty ? "有尚未套用的標籤變更" : imagesDirty ? "有尚未完成的圖片變更" : "目前沒有尚未儲存的變更"}
            </p>
            <button
              className={`${buttonClass} w-full bg-[#005DAA] text-white hover:bg-[#00457F] sm:w-auto`}
              disabled={saving || loading || Boolean(loadError) || (!basicDirty && !statusDirty)}
              type="submit"
            >
              {saving ? "儲存中…" : isEditing ? "儲存變更" : "建立商品"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
