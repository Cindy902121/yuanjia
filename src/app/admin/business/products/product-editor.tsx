"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { B2bProductStatus } from "@/lib/admin-catalog";

type Tag = { id: string; slug: string; name: string; group_name: string | null };
type SpecOption = {
  id?: string;
  option_code: string;
  specification_text: string;
  packaging_text: string;
  is_active: boolean;
  display_order: number;
};
type ExistingImage = {
  kind: "existing";
  id: string;
  url: string;
  role: "cover" | "detail";
  altText: string;
  sortOrder: number;
  replacementFile?: File;
  replacementPreview?: string;
};
type NewImage = {
  kind: "new";
  localId: string;
  file: File;
  preview: string;
  role: "cover" | "detail";
  altText: string;
};
type MediaItem = ExistingImage | NewImage;
type CleanupWarning = { imageId: string; storagePath: string };
type ProductForm = {
  product_code: string;
  name: string;
  brand: string;
  category: string;
  specification: string;
  packaging: string;
  origin: string;
  storage_method: string;
  description: string;
  status: B2bProductStatus;
};
type ApiPayload = { error?: string };

const STATUS_OPTIONS: Array<{ value: B2bProductStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "review", label: "待審核" },
  { value: "published", label: "已發布" },
  { value: "offline", label: "已下架" },
];
const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function emptyForm(): ProductForm {
  return {
    product_code: "",
    name: "",
    brand: "",
    category: "",
    specification: "",
    packaging: "",
    origin: "",
    storage_method: "",
    description: "",
    status: "draft",
  };
}

function validateImage(file: File) {
  const allowed = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  }[file.type];
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!allowed || !extension || !allowed.includes(extension)) {
    return "圖片格式只允許副檔名與 MIME 相符的 JPEG、PNG 或 WebP。";
  }
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    return "單張圖片大小必須在 5 MB 以內。";
  }
  return null;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, cache: "no-store" });
  let payload: T & ApiPayload;
  try {
    payload = (await response.json()) as T & ApiPayload;
  } catch {
    payload = {} as T & ApiPayload;
  }
  if (!response.ok) throw new Error(payload.error ?? "操作失敗，請稍後再試。");
  return payload;
}

export function ProductEditor({ productId }: { productId: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [options, setOptions] = useState<SpecOption[]>([]);
  const [removedOptionIds, setRemovedOptionIds] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [savedProductId, setSavedProductId] = useState(productId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cleanupWarnings, setCleanupWarnings] = useState<CleanupWarning[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      requestJson<{ tags: Tag[] }>("/api/admin/tags/b2b"),
      productId
        ? requestJson<{
            product: {
              product_code: string;
              name: string;
              brand: string;
              category: string;
              specification: string;
              packaging: string | null;
              origin: string;
              storage_method: string;
              description: string;
              status?: B2bProductStatus;
              is_active: boolean;
              tags?: Tag[];
              specification_options?: SpecOption[];
              images?: Array<{
                id: string;
                url: string;
                image_role: "cover" | "detail";
                alt_text: string;
                sort_order: number;
              }>;
            };
          }>(`/api/admin/products/b2b/${productId}`)
        : Promise.resolve(null),
    ])
      .then(([tagPayload, productPayload]) => {
        if (cancelled) return;
        setTags(tagPayload.tags ?? []);
        if (productPayload) {
          const product = productPayload.product;
          setForm({
            product_code: product.product_code,
            name: product.name,
            brand: product.brand,
            category: product.category,
            specification: product.specification,
            packaging: product.packaging ?? "",
            origin: product.origin,
            storage_method: product.storage_method,
            description: product.description,
            status: product.status ?? (product.is_active ? "published" : "offline"),
          });
          setSelectedTagIds((product.tags ?? []).map((tag) => tag.id));
          setOptions(product.specification_options ?? []);
          setMedia(
            (product.images ?? []).map((image) => ({
              kind: "existing" as const,
              id: image.id,
              url: image.url,
              role: image.image_role,
              altText: image.alt_text,
              sortOrder: image.sort_order,
            })),
          );
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "目前無法讀取商品。");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const activeMedia = useMemo(
    () => media.filter((item) => item.kind === "new" || !removedImageIds.includes(item.id)),
    [media, removedImageIds],
  );

  function updateField(field: keyof ProductForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next: NewImage[] = [];
    for (const file of Array.from(fileList)) {
      const fileError = validateImage(file);
      if (fileError) {
        setError(fileError);
        continue;
      }
      const hasCover = activeMedia.some((item) => item.role === "cover") || next.some((item) => item.role === "cover");
      next.push({
        kind: "new",
        localId: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        role: hasCover ? "detail" : "cover",
        altText: "",
      });
    }
    setMedia((current) => [...current, ...next]);
  }

  function updateRole(item: MediaItem, role: "cover" | "detail") {
    if (role === "cover" && activeMedia.some((candidate) => candidate !== item && candidate.role === "cover")) {
      setError("每個商品只能有一張封面圖；既有封面請使用替換功能。");
      return;
    }
    setMedia((current) => current.map((candidate) => candidate === item ? { ...candidate, role } : candidate));
  }

  function removeMedia(item: MediaItem) {
    if (item.kind === "new") {
      URL.revokeObjectURL(item.preview);
      setMedia((current) => current.filter((candidate) => candidate !== item));
      return;
    }
    if (!window.confirm("確定要刪除這張圖片嗎？儲存後才會真正刪除。")) return;
    setRemovedImageIds((current) => [...new Set([...current, item.id])]);
  }

  function restoreMedia(item: ExistingImage) {
    setRemovedImageIds((current) => current.filter((id) => id !== item.id));
  }

  function replaceMedia(item: ExistingImage, file: File | undefined) {
    if (!file) return;
    const fileError = validateImage(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    if (item.replacementPreview) URL.revokeObjectURL(item.replacementPreview);
    setMedia((current) => current.map((candidate) => candidate === item
      ? { ...candidate, replacementFile: file, replacementPreview: URL.createObjectURL(file) }
      : candidate));
  }

  function reorderMedia(from: number, to: number) {
    if (from === to) return;
    setMedia((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function saveTags(id: string) {
    await requestJson(`/api/admin/products/b2b/${id}/tags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_ids: selectedTagIds }),
    });
  }

  async function saveOptions(id: string) {
    const savedOptions: SpecOption[] = [];
    for (const optionId of removedOptionIds) {
      await requestJson(`/api/admin/products/b2b/${id}/spec-options/${optionId}`, { method: "DELETE" });
    }
    for (const [index, option] of options.entries()) {
      const body = {
        specification_text: option.specification_text,
        packaging_text: option.packaging_text,
        is_active: option.is_active,
        display_order: index,
      };
      if (option.id) {
        const payload = await requestJson<{ option: SpecOption }>(`/api/admin/products/b2b/${id}/spec-options/${option.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        savedOptions.push(payload.option);
      } else {
        const payload = await requestJson<{ option: SpecOption }>(`/api/admin/products/b2b/${id}/spec-options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, option_code: option.option_code }),
        });
        savedOptions.push(payload.option);
      }
    }
    return savedOptions;
  }

  async function saveImages(id: string) {
    const active = media.filter((item) => item.kind === "new" || !removedImageIds.includes(item.id));
    const coverCount = active.filter((item) => item.role === "cover").length;
    const detailCount = active.filter((item) => item.role === "detail").length;
    if (coverCount > 1 || detailCount > 5) throw new Error("圖片數量或封面設定不正確。");
    for (const item of active) {
      if (!item.altText.trim()) throw new Error("每張圖片都必須填寫替代文字。");
    }

    const uploadedIds: string[] = [];
    const uploadedIdByLocalId = new Map<string, string>();
    const warnings: CleanupWarning[] = [];
    try {
      const existing = active
        .filter((item): item is ExistingImage => item.kind === "existing")
        .sort((left, right) => Number(left.role === "cover") - Number(right.role === "cover"));
      for (const item of existing) {
        if (item.replacementFile) {
          const body = new FormData();
          body.append("file", item.replacementFile);
          body.append("image_role", item.role);
          body.append("alt_text", item.altText.trim());
          const payload = await requestJson<{
            storage_cleanup?: "failed" | "ok";
            storage_cleanup_path?: string | null;
          }>(`/api/admin/products/b2b/${id}/images/${item.id}`, {
            method: "PUT",
            body,
          });
          if (payload.storage_cleanup === "failed" && payload.storage_cleanup_path) {
            warnings.push({ imageId: item.id, storagePath: payload.storage_cleanup_path });
          }
        } else {
          await requestJson(`/api/admin/products/b2b/${id}/images/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_role: item.role, alt_text: item.altText.trim() }),
          });
        }
      }

      for (const item of active) {
        if (item.kind !== "new") continue;
        const body = new FormData();
        body.append("file", item.file);
        body.append("image_role", item.role);
        body.append("alt_text", item.altText.trim());
        const payload = await requestJson<{ image: { id: string } }>(`/api/admin/products/b2b/${id}/images`, {
          method: "POST",
          body,
        });
        uploadedIds.push(payload.image.id);
        uploadedIdByLocalId.set(item.localId, payload.image.id);
      }

      for (const imageId of removedImageIds) {
        await requestJson(`/api/admin/products/b2b/${id}/images/${imageId}`, { method: "DELETE" });
      }

      let refreshed = await requestJson<{ images: Array<{ id: string; url: string; image_role: "cover" | "detail"; alt_text: string; sort_order: number }> }>(`/api/admin/products/b2b/${id}/images`);
      const orderedIds = active
        .map((item) => item.kind === "existing" ? item.id : uploadedIdByLocalId.get(item.localId))
        .filter((imageId): imageId is string => Boolean(imageId));
      if (orderedIds.length > 0 && refreshed.images.length === orderedIds.length) {
        refreshed = await requestJson<{ images: Array<{ id: string; url: string; image_role: "cover" | "detail"; alt_text: string; sort_order: number }> }>(`/api/admin/products/b2b/${id}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: orderedIds }),
        });
      }
      return { warnings, images: refreshed.images };
    } catch (saveError) {
      for (const imageId of uploadedIds) {
        await requestJson(`/api/admin/products/b2b/${id}/images/${imageId}`, { method: "DELETE" }).catch(() => undefined);
      }
      throw saveError;
    }
  }

  async function retryCleanup(warning: CleanupWarning) {
    try {
      await requestJson(`/api/admin/products/b2b/${savedProductId}/images/${warning.imageId}/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storage_path: warning.storagePath }),
      });
      setCleanupWarnings((current) => current.filter((item) => item !== warning));
      setNotice("舊圖片檔案已清理。");
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "舊圖片檔案清理失敗，請稍後再試。");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    let id = savedProductId;
    try {
      const productBody = { ...form };
      if (!id) {
        const payload = await requestJson<{ product: { id: string } }>("/api/admin/products/b2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productBody),
        });
        id = payload.product.id;
        setSavedProductId(id);
      } else {
        const updateBody: Record<string, unknown> = { ...productBody };
        delete updateBody.product_code;
        await requestJson(`/api/admin/products/b2b/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
        });
      }

      await saveTags(id);
      const savedOptions = await saveOptions(id);
      const imageResult = await saveImages(id);
      setOptions(savedOptions);
      setRemovedOptionIds([]);
      setMedia(imageResult.images.map((image) => ({
        kind: "existing" as const,
        id: image.id,
        url: image.url,
        role: image.image_role,
        altText: image.alt_text,
        sortOrder: image.sort_order,
      })));
      const warnings = imageResult.warnings;
      setCleanupWarnings(warnings);
      setNotice(warnings.length > 0
        ? "商品資料已保存；部分舊圖片檔案清理失敗，請重試清理。"
        : "商品資料、標籤、規格與圖片已保存。重新整理後仍會保留。");
      setRemovedImageIds([]);
      if (!productId) router.replace(`/admin/business/products/${id}`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "商品保存失敗；舊圖片仍會保留。" );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="rounded-2xl border border-[#D8E1E5] bg-white p-8 text-center text-sm text-[#536168]">正在讀取商品資料…</div>;
  }

  return (
    <main className="min-h-screen flex-1 bg-[#F4F7F8] text-[#17242A]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#D8E1E5] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-semibold text-[#005DAA] hover:underline" href="/admin/business">← 回到 B2B 商品</Link>
            <h1 className="mt-3 text-3xl font-bold">{productId ? "編輯 B2B 商品" : "新增 B2B 商品"}</h1>
            <p className="mt-2 text-sm text-[#536168]">商品先保存為草稿；圖片可在同一個保存動作中新增或替換。</p>
          </div>
          {savedProductId ? <span className="font-mono text-xs text-[#809099]">{savedProductId}</span> : null}
        </header>

        {error ? <div className="mb-4 rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert">{error}</div> : null}
        {notice ? <div className="mb-4 rounded-xl border border-[#B8E1CB] bg-[#F0FBF4] px-4 py-3 text-sm text-[#18794E]" role="status">{notice}</div> : null}
        {cleanupWarnings.length > 0 ? (
          <div className="mb-4 rounded-xl border border-[#F1D8A5] bg-[#FFF9E9] px-4 py-3 text-sm text-[#8A5A00]" role="status">
            <p className="font-semibold">以下舊圖片檔案尚未清理：</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cleanupWarnings.map((warning) => (
                <button
                  className={`${buttonClass} border border-[#D9B76E] bg-white text-[#8A5A00] hover:bg-[#FFF3D1]`}
                  key={`${warning.imageId}:${warning.storagePath}`}
                  onClick={() => void retryCleanup(warning)}
                  type="button"
                >
                  重試清理 {warning.imageId.slice(0, 8)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={save}>
          <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
            <h2 className="text-xl font-bold">基本資料</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">商品代碼<input className={inputClass} disabled={Boolean(productId)} onChange={(event) => updateField("product_code", event.target.value)} required value={form.product_code} /></label>
              <label className="text-sm font-semibold">商品名稱<input className={inputClass} onChange={(event) => updateField("name", event.target.value)} required value={form.name} /></label>
              <label className="text-sm font-semibold">品牌<input className={inputClass} onChange={(event) => updateField("brand", event.target.value)} required value={form.brand} /></label>
              <label className="text-sm font-semibold">分類<input className={inputClass} onChange={(event) => updateField("category", event.target.value)} required value={form.category} /></label>
              <label className="text-sm font-semibold">規格<input className={inputClass} onChange={(event) => updateField("specification", event.target.value)} required value={form.specification} /></label>
              <label className="text-sm font-semibold">包裝<input className={inputClass} onChange={(event) => updateField("packaging", event.target.value)} value={form.packaging} /></label>
              <label className="text-sm font-semibold">產地<input className={inputClass} onChange={(event) => updateField("origin", event.target.value)} required value={form.origin} /></label>
              <label className="text-sm font-semibold">保存方式<input className={inputClass} onChange={(event) => updateField("storage_method", event.target.value)} required value={form.storage_method} /></label>
              <label className="text-sm font-semibold md:col-span-2">商品描述<textarea className={`${inputClass} min-h-32`} onChange={(event) => updateField("description", event.target.value)} required value={form.description} /></label>
              <label className="text-sm font-semibold">商品狀態<select className={inputClass} onChange={(event) => updateField("status", event.target.value)} value={form.status}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
            <h2 className="text-xl font-bold">標籤</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <label className="flex items-center gap-2 rounded-lg border border-[#E7EDF0] p-3 text-sm" key={tag.id}>
                  <input checked={selectedTagIds.includes(tag.id)} onChange={(event) => setSelectedTagIds((current) => event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))} type="checkbox" />
                  <span>{tag.name}</span><span className="text-xs text-[#809099]">{tag.group_name ?? tag.slug}</span>
                </label>
              ))}
              {tags.length === 0 ? <p className="text-sm text-[#809099]">目前沒有可用的 B2B 標籤。</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">規格選項</h2><p className="mt-1 text-sm text-[#536168]">規格代碼建立後不可修改。</p></div><button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} onClick={() => setOptions((current) => [...current, { option_code: "", specification_text: "", packaging_text: "", is_active: true, display_order: current.length }])} type="button">新增選項</button></div>
            <div className="mt-4 space-y-3">
              {options.map((option, index) => (
                <div className="grid gap-3 rounded-xl border border-[#E7EDF0] p-4 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_80px_auto]" key={option.id ?? `new-${index}`}>
                  <label className="text-xs font-bold text-[#536168]">代碼<input className={inputClass} disabled={Boolean(option.id)} onChange={(event) => setOptions((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, option_code: event.target.value.toUpperCase() } : candidate))} required value={option.option_code} /></label>
                  <label className="text-xs font-bold text-[#536168]">規格<input className={inputClass} onChange={(event) => setOptions((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, specification_text: event.target.value } : candidate))} required value={option.specification_text} /></label>
                  <label className="text-xs font-bold text-[#536168]">包裝<input className={inputClass} onChange={(event) => setOptions((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, packaging_text: event.target.value } : candidate))} required value={option.packaging_text} /></label>
                  <label className="flex items-center gap-2 pt-7 text-xs font-semibold"><input checked={option.is_active} onChange={(event) => setOptions((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, is_active: event.target.checked } : candidate))} type="checkbox" />啟用</label>
                  <button className={`${buttonClass} mt-5 border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]`} onClick={() => { if (option.id) setRemovedOptionIds((current) => [...new Set([...current, option.id!])]); setOptions((current) => current.filter((_, candidateIndex) => candidateIndex !== index)); }} type="button">移除</button>
                </div>
              ))}
              {options.length === 0 ? <p className="text-sm text-[#809099]">尚未建立規格選項。</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">圖片</h2><p className="mt-1 text-sm text-[#536168]">JPEG、PNG、WebP；單張最多 5 MB。每張圖片都必須填寫替代文字。</p></div><label className={`${buttonClass} cursor-pointer bg-[#005DAA] text-white hover:bg-[#00457F]`}>選擇圖片<input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ""; }} type="file" /></label></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item, index) => {
                const removed = item.kind === "existing" && removedImageIds.includes(item.id);
                const preview = item.kind === "new" ? item.preview : item.replacementPreview ?? item.url;
                const hasOtherCover = activeMedia.some((candidate) => candidate !== item && candidate.role === "cover");
                return (
                  <article className={`rounded-xl border p-3 ${removed ? "border-[#E5D2D0] bg-[#FFF5F4] opacity-70" : "border-[#D8E1E5] bg-white"}`} draggable={!removed} key={item.kind === "new" ? item.localId : item.id} onDragOver={(event) => event.preventDefault()} onDragStart={() => setDragIndex(index)} onDrop={() => { if (dragIndex !== null) reorderMedia(dragIndex, index); setDragIndex(null); }}>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#F4F7F8]"><img alt={item.altText || "圖片預覽"} className="h-full w-full object-cover" src={preview} /></div>
                    <div className="mt-3 flex items-center justify-between gap-2"><select aria-label="圖片角色" className="rounded-lg border border-[#D8E1E5] px-2 py-2 text-xs" disabled={removed} onChange={(event) => updateRole(item, event.target.value as "cover" | "detail")} value={item.role}><option disabled={hasOtherCover && item.role !== "cover"} value="cover">封面</option><option value="detail">細節</option></select><span className="text-xs text-[#809099]">拖曳排序</span></div>
                    <input aria-label="圖片替代文字" className={inputClass} disabled={removed} maxLength={200} onChange={(event) => setMedia((current) => current.map((candidate) => candidate === item ? { ...candidate, altText: event.target.value } : candidate))} placeholder="圖片替代文字" required value={item.altText} />
                    <div className="mt-3 flex flex-wrap gap-2"><label className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB] ${removed || item.kind === "new" ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>替換<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={removed || item.kind === "new"} onChange={(event) => { if (item.kind === "existing") replaceMedia(item, event.target.files?.[0]); }} type="file" /></label>{removed ? <button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F]`} onClick={() => { if (item.kind === "existing") restoreMedia(item); }} type="button">復原</button> : <button className={`${buttonClass} border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]`} onClick={() => removeMedia(item)} type="button">刪除</button>}</div>
                    {removed ? <p className="mt-2 text-xs text-[#A43B34]">儲存後刪除</p> : null}
                  </article>
                );
              })}
            </div>
            {media.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-[#B8CBD4] p-8 text-center text-sm text-[#809099]">尚無圖片</div> : null}
          </section>

          <div className="flex flex-wrap justify-end gap-3"><Link className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} href="/admin/business">取消</Link><button className={`${buttonClass} bg-[#005DAA] px-6 text-white hover:bg-[#00457F]`} disabled={isSaving} type="submit">{isSaving ? "保存中…" : "保存商品"}</button></div>
        </form>
      </div>
    </main>
  );
}
