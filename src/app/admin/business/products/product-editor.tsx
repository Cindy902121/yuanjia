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
import { ProductImageManager } from "./product-image-manager";

type B2bFieldKey = (typeof B2B_PRODUCT_FIELD_RULES)[number]["key"];
type B2bForm = Record<B2bFieldKey, string>;
type FieldErrors = Partial<Record<B2bFieldKey, string>>;

type B2bTag = {
  id: string;
  group_name: string;
  slug: string;
  name: string;
};

type B2bSpecOption = {
  id: string;
  product_id: string;
  option_code: string;
  specification_text: string;
  packaging_text: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

type OptionOrder = Array<{ id: string; display_order: number }>;

type B2bProduct = B2bForm & {
  id: string;
  status: unknown;
  updated_at: string;
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

type NewOption = {
  option_code: string;
  specification_text: string;
  packaging_text: string;
  is_active: boolean;
};

const emptyOption: NewOption = {
  option_code: "",
  specification_text: "",
  packaging_text: "",
  is_active: true,
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

function optionSnapshot(options: B2bSpecOption[]) {
  return options.map((option) => ({
    id: option.id,
    option_code: option.option_code,
    specification_text: option.specification_text,
    packaging_text: option.packaging_text,
    is_active: option.is_active,
    display_order: option.display_order,
  }));
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
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState(savedMessage ? "商品已建立，狀態為草稿。" : "");
  const [availableTags, setAvailableTags] = useState<B2bTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savedTagIds, setSavedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);
  const [tagMessage, setTagMessage] = useState("");
  const [tagError, setTagError] = useState("");
  const [options, setOptions] = useState<B2bSpecOption[]>([]);
  const [savedOptions, setSavedOptions] = useState<B2bSpecOption[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(Boolean(productId));
  const [optionsSavingId, setOptionsSavingId] = useState<string | null>(null);
  const [optionsMessage, setOptionsMessage] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [newOption, setNewOption] = useState(emptyOption);
  const [newOptionError, setNewOptionError] = useState("");
  const [relatedError, setRelatedError] = useState("");
  const [relatedReloadKey, setRelatedReloadKey] = useState(0);
  const [retryOrder, setRetryOrder] = useState<OptionOrder | null>(null);

  const isEditing = currentProductId !== null;
  const basicDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );
  const tagsDirty = useMemo(
    () => JSON.stringify([...selectedTagIds].sort()) !== JSON.stringify([...savedTagIds].sort()),
    [savedTagIds, selectedTagIds],
  );
  const optionsDirty = useMemo(
    () => JSON.stringify(optionSnapshot(options)) !== JSON.stringify(optionSnapshot(savedOptions)),
    [options, savedOptions],
  );
  const newOptionDirty =
    newOption.option_code.trim() !== "" ||
    newOption.specification_text.trim() !== "" ||
    newOption.packaging_text.trim() !== "";
  const dirty = basicDirty || tagsDirty || optionsDirty || newOptionDirty;
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
    if (!currentProductId) {
      return;
    }

    let cancelled = false;
    void Promise.all([
      requestJson<{ tags: B2bTag[]; tag_ids: string[] }>(
        `/api/admin/products/b2b/${currentProductId}/tags`,
      ),
      requestJson<{ options: B2bSpecOption[] }>(
        `/api/admin/products/b2b/${currentProductId}/spec-options`,
      ),
    ])
      .then(([tagResult, optionResult]) => {
        if (cancelled) {
          return;
        }
        const nextTagIds = [...new Set(tagResult.tag_ids ?? [])];
        setAvailableTags(tagResult.tags ?? []);
        setSelectedTagIds(nextTagIds);
        setSavedTagIds(nextTagIds);
        setOptions(optionResult.options ?? []);
        setSavedOptions(optionResult.options ?? []);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRelatedError(error instanceof Error ? error.message : "目前無法讀取標籤與規格選項。");
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
        `/api/admin/products/b2b/${currentProductId}/tags`,
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

  function updateNewOption(
    field: "option_code" | "specification_text" | "packaging_text",
    value: string,
  ) {
    setNewOption((current) => ({ ...current, [field]: value }));
    setRetryOrder(null);
    setNewOptionError("");
    setOptionsError("");
  }

  function updateOption(
    optionId: string,
    field: "specification_text" | "packaging_text",
    value: string,
  ) {
    setOptions((current) =>
      current.map((option) => (option.id === optionId ? { ...option, [field]: value } : option)),
    );
    setRetryOrder(null);
    setOptionsError("");
    setOptionsMessage("");
  }

  async function createOption() {
    if (!currentProductId || optionsSavingId !== null) {
      return;
    }
    const optionCode = newOption.option_code.trim();
    const specification = newOption.specification_text.trim();
    const packaging = newOption.packaging_text.trim();
    if (!new RegExp(B2B_PRODUCT_CODE_PATTERN).test(optionCode)) {
      setNewOptionError("規格選項代碼格式不正確。");
      return;
    }
    if (!specification || specification.length > 500) {
      setNewOptionError("規格文字為必填，且最多 500 字元。");
      return;
    }
    if (!packaging || packaging.length > 500) {
      setNewOptionError("包裝文字為必填，且最多 500 字元。");
      return;
    }

    setOptionsSavingId("new");
    setRetryOrder(null);
    setNewOptionError("");
    setOptionsError("");
    try {
      const result = await requestJson<{ option: B2bSpecOption }>(
        `/api/admin/products/b2b/${currentProductId}/spec-options`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            option_code: optionCode,
            specification_text: specification,
            packaging_text: packaging,
            is_active: true,
            display_order: options.length,
          }),
        },
      );
      const nextOptions = [...options, result.option];
      setOptions(nextOptions);
      setSavedOptions(nextOptions);
      setNewOption({ ...emptyOption });
      setOptionsMessage("規格選項已新增。");
    } catch (error: unknown) {
      setNewOptionError(error instanceof Error ? error.message : "規格選項新增失敗，請重試。");
    } finally {
      setOptionsSavingId(null);
    }
  }

  async function saveOption(option: B2bSpecOption) {
    if (!currentProductId || optionsSavingId !== null) {
      return;
    }
    setOptionsSavingId(option.id);
    setRetryOrder(null);
    setOptionsError("");
    setOptionsMessage("");
    try {
      const result = await requestJson<{ option: B2bSpecOption }>(
        `/api/admin/products/b2b/${currentProductId}/spec-options/${option.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            specification_text: option.specification_text,
            packaging_text: option.packaging_text,
            is_active: option.is_active,
            display_order: option.display_order,
          }),
        },
      );
      setOptions((current) => current.map((item) => (item.id === option.id ? result.option : item)));
      setSavedOptions((current) => current.map((item) => (item.id === option.id ? result.option : item)));
      setOptionsMessage(`${option.option_code} 已儲存。`);
    } catch (error: unknown) {
      setOptionsError(error instanceof Error ? error.message : "規格選項儲存失敗，請重試。");
    } finally {
      setOptionsSavingId(null);
    }
  }

  async function toggleOption(option: B2bSpecOption) {
    if (!currentProductId || optionsSavingId !== null) {
      return;
    }
    setOptionsSavingId(option.id);
    setRetryOrder(null);
    setOptionsError("");
    setOptionsMessage("");
    try {
      const result = await requestJson<{ option: Partial<B2bSpecOption> }>(
        `/api/admin/products/b2b/${currentProductId}/spec-options/${option.id}`,
        option.is_active
          ? { method: "DELETE" }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_active: true }),
            },
      );
      const nextOption = { ...option, ...result.option };
      setOptions((current) => current.map((item) => (item.id === option.id ? nextOption : item)));
      setSavedOptions((current) => current.map((item) => (item.id === option.id ? nextOption : item)));
      setOptionsMessage(`${option.option_code} 已${option.is_active ? "停用" : "啟用"}。`);
    } catch (error: unknown) {
      setOptionsError(error instanceof Error ? error.message : "規格選項狀態更新失敗，請重試。");
    } finally {
      setOptionsSavingId(null);
    }
  }

  async function persistOptionOrder(order: OptionOrder) {
    if (!currentProductId || optionsSavingId !== null) {
      return;
    }
    const normalized = order
      .map(({ id, display_order }) => {
        const option = options.find((item) => item.id === id);
        return option ? { ...option, display_order } : null;
      })
      .filter((option): option is B2bSpecOption => option !== null);
    if (normalized.length !== options.length) {
      return;
    }

    setOptions(normalized);
    setRetryOrder(order);
    setOptionsSavingId("reorder");
    setOptionsError("");
    setOptionsMessage("");
    try {
      const results = await Promise.all(
        normalized.map((option) =>
          requestJson<{ option: B2bSpecOption }>(
            `/api/admin/products/b2b/${currentProductId}/spec-options/${option.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ display_order: option.display_order }),
            },
          ),
        ),
      );
      const persistedOptions = normalized.map((option, optionIndex) => ({
        ...results[optionIndex].option,
        display_order: optionIndex,
      }));
      const nextOptions = normalized.map((option, optionIndex) => ({
        ...option,
        display_order: optionIndex,
      }));
      setOptions(nextOptions);
      setSavedOptions(persistedOptions);
      setRetryOrder(null);
      setOptionsMessage("規格選項順序已更新。");
    } catch (error: unknown) {
      setOptions(normalized);
      setOptionsError(error instanceof Error ? error.message : "規格選項排序失敗，請重試。");
    } finally {
      setOptionsSavingId(null);
    }
  }

  function moveOption(index: number, direction: -1 | 1) {
    if (!currentProductId || optionsSavingId !== null) {
      return;
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= options.length) {
      return;
    }
    const reordered = [...options];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    void persistOptionOrder(reordered.map((option, display_order) => ({ id: option.id, display_order })));
  }

  function retryOptionOrder() {
    if (retryOrder) {
      void persistOptionOrder(retryOrder);
    }
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
        setRelatedLoading(true);
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
        {relatedError ? (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318] sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span>標籤與規格選項讀取失敗：{relatedError}</span>
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
              <p className="text-sm leading-6 text-[#536168]">狀態沿用工作台的審核流程；此處只能套用已啟用的 B2B 標籤。</p>
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#17242A]">目前狀態</p>
                <p className="mt-1 text-sm text-[#536168]">{B2B_STATUS_LABELS[status]} · 已套用 {selectedTagIds.length} 個標籤</p>
              </div>
              {isEditing ? (
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
              ) : null}
            </div>
            {!isEditing ? (
              <p className="mt-5 rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168]">
                先儲存基本資料，才能管理 B2B 標籤。
              </p>
            ) : relatedError ? (
              <p className="mt-5 rounded-lg bg-[#FFF5F4] px-4 py-3 text-sm text-[#B42318]">請先重試讀取標籤資料。</p>
            ) : (
              <div className="mt-5 space-y-4">
                <h3 className="text-sm font-bold text-[#17242A]">管理標籤</h3>
                <label className="block max-w-xl" htmlFor="b2b-tag-search">
                  <span className="text-sm font-semibold text-[#17242A]">搜尋 B2B 標籤</span>
                  <input
                    aria-label="搜尋 B2B 標籤"
                    className={inputClass}
                    id="b2b-tag-search"
                    onChange={(event) => setTagSearch(event.target.value)}
                    placeholder="輸入標籤名稱、群組或代碼"
                    type="search"
                    value={tagSearch}
                  />
                </label>
                <div aria-label="B2B 標籤選擇" className="grid gap-2 sm:grid-cols-2" role="group">
                  {relatedLoading ? (
                    <div aria-busy="true" className="h-24 animate-pulse rounded-lg bg-[#F4F7F8] sm:col-span-2" />
                  ) : visibleTags.length > 0 ? (
                    visibleTags.map((tag) => (
                      <label
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-[#D8E1E5] px-3 py-2 hover:border-[#005DAA]"
                        key={tag.id}
                      >
                        <input
                          checked={selectedTagIds.includes(tag.id)}
                          className="h-4 w-4 accent-[#005DAA]"
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
                      {availableTags.length > 0 ? "找不到符合搜尋條件的 B2B 標籤。" : "目前沒有可用的 B2B 標籤。"}
                    </p>
                  )}
                </div>
                {tagError ? <p className="text-sm font-semibold text-[#B42318]" role="alert">{tagError}</p> : null}
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

          <section aria-labelledby="options-title" className="mt-5 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
              <h2 className="text-lg font-bold text-[#17242A]" id="options-title">規格選項</h2>
              <p className="text-sm leading-6 text-[#536168]">商品主規格已在基本資料維護；詢價可用的規格與包裝選項在此管理。</p>
            </div>
            {!isEditing ? (
              <p className="mt-5 rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168]">
                先儲存基本資料，才能管理規格選項。
              </p>
            ) : relatedError ? (
              <p className="mt-5 rounded-lg bg-[#FFF5F4] px-4 py-3 text-sm text-[#B42318]">請先重試讀取規格選項。</p>
            ) : (
              <div className="mt-5 space-y-4">
                {relatedLoading ? (
                  <div aria-busy="true" className="h-32 animate-pulse rounded-lg bg-[#F4F7F8]" />
                ) : options.length > 0 ? (
                  <div className="space-y-3">
                    {options.map((option, index) => {
                      const rowSaving = optionsSavingId === option.id || optionsSavingId === "reorder";
                      return (
                        <div className="rounded-lg border border-[#D8E1E5] p-4" key={option.id}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#17242A]">規格選項 {index + 1}</p>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${option.is_active ? "border-[#B8E1CB] bg-[#F0FBF4] text-[#18794E]" : "border-[#D8E1E5] bg-[#F4F7F8] text-[#536168]"}`}>
                              {option.is_active ? "啟用" : "停用"}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <label>
                              <span className="text-sm font-semibold text-[#17242A]">option_code</span>
                              <input className={inputClass} readOnly value={option.option_code} />
                            </label>
                            <label>
                              <span className="text-sm font-semibold text-[#17242A]">規格文字</span>
                              <input
                                className={inputClass}
                                disabled={rowSaving}
                                maxLength={500}
                                onChange={(event) => updateOption(option.id, "specification_text", event.target.value)}
                                value={option.specification_text}
                              />
                            </label>
                            <label>
                              <span className="text-sm font-semibold text-[#17242A]">包裝文字</span>
                              <input
                                className={inputClass}
                                disabled={rowSaving}
                                maxLength={500}
                                onChange={(event) => updateOption(option.id, "packaging_text", event.target.value)}
                                value={option.packaging_text}
                              />
                            </label>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              aria-label={`將 ${option.option_code} 上移`}
                              className={`${buttonClass} border border-[#D8E1E5] bg-white text-[#536168] hover:bg-[#EAF5FB]`}
                              disabled={rowSaving || index === 0}
                              onClick={() => void moveOption(index, -1)}
                              type="button"
                            >
                              ↑ 上移
                            </button>
                            <button
                              aria-label={`將 ${option.option_code} 下移`}
                              className={`${buttonClass} border border-[#D8E1E5] bg-white text-[#536168] hover:bg-[#EAF5FB]`}
                              disabled={rowSaving || index === options.length - 1}
                              onClick={() => void moveOption(index, 1)}
                              type="button"
                            >
                              ↓ 下移
                            </button>
                            <button
                              className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
                              disabled={rowSaving}
                              onClick={() => void saveOption(option)}
                              type="button"
                            >
                              {optionsSavingId === option.id ? "儲存中…" : "儲存列"}
                            </button>
                            <button
                              className={`${buttonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168] hover:bg-[#EAF5FB]`}
                              disabled={rowSaving}
                              onClick={() => void toggleOption(option)}
                              type="button"
                            >
                              {option.is_active ? "停用" : "啟用"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168]">
                    目前沒有規格選項；可從下方新增第一列。
                  </p>
                )}
                <div className="rounded-lg border border-dashed border-[#B8C8CF] p-4">
                  <h3 className="text-sm font-bold text-[#17242A]">新增規格選項</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label>
                      <span className="text-sm font-semibold text-[#17242A]">option_code</span>
                      <input
                        className={inputClass}
                        disabled={optionsSavingId !== null}
                        maxLength={80}
                        onChange={(event) => updateNewOption("option_code", event.target.value)}
                        pattern={B2B_PRODUCT_CODE_PATTERN}
                        placeholder="例如 BOX-10"
                        value={newOption.option_code}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold text-[#17242A]">規格文字</span>
                      <input
                        className={inputClass}
                        disabled={optionsSavingId !== null}
                        maxLength={500}
                        onChange={(event) => updateNewOption("specification_text", event.target.value)}
                        value={newOption.specification_text}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold text-[#17242A]">包裝文字</span>
                      <input
                        className={inputClass}
                        disabled={optionsSavingId !== null}
                        maxLength={500}
                        onChange={(event) => updateNewOption("packaging_text", event.target.value)}
                        value={newOption.packaging_text}
                      />
                    </label>
                  </div>
                  {newOptionError ? <p className="mt-3 text-sm font-semibold text-[#B42318]" role="alert">{newOptionError}</p> : null}
                  <button
                    className={`${buttonClass} mt-4 bg-[#005DAA] text-white hover:bg-[#00457F]`}
                    disabled={optionsSavingId !== null}
                    onClick={() => void createOption()}
                    type="button"
                  >
                    {optionsSavingId === "new" ? "新增中…" : "新增規格選項"}
                  </button>
                </div>
                {optionsError ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-[#B42318]" role="alert">{optionsError}</p>
                    {retryOrder ? (
                      <button
                        className={`${buttonClass} border border-[#F4C7C3] bg-white text-[#B42318] hover:bg-[#FFF5F4]`}
                        disabled={optionsSavingId !== null}
                        onClick={retryOptionOrder}
                        type="button"
                      >
                        重試排序
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {optionsMessage ? <p className="text-sm font-semibold text-[#18794E]" role="status">{optionsMessage}</p> : null}
              </div>
            )}
          </section>

          <ProductImageManager key={currentProductId ?? "new-product"} productId={currentProductId} />

          <div className="sticky bottom-4 z-10 mt-6 flex flex-col gap-3 rounded-xl border border-[#D8E1E5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className={`text-sm ${dirty ? "font-semibold text-[#C84B31]" : "text-[#536168]"}`}>
              {basicDirty ? "有尚未儲存的基本資料" : tagsDirty ? "有尚未套用的標籤變更" : optionsDirty || newOptionDirty ? "有尚未儲存的規格選項變更" : "目前沒有尚未儲存的變更"}
            </p>
            <button
              className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
              disabled={saving || loading || !basicDirty}
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
