"use client";

/* eslint-disable @next/next/no-img-element -- B2B signed URLs are dynamic and private. */

import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type B2bProductImage = {
  id: string;
  product_id: string;
  image_role: "cover" | "detail";
  alt_text: string;
  sort_order: number;
  url: string;
};

type ApiResult<T> = T & {
  error?: string;
  storage_cleanup?: "ok" | "failed";
  storage_path?: string;
};

type ApiFailure = Error & {
  storage_cleanup?: "ok" | "failed";
  storage_path?: string;
};

const imageAccept = "image/jpeg,image/png,image/webp";
const imageMaxBytes = 5 * 1024 * 1024;
const imageMaxDetails = 5;
const imageInputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition motion-reduce:transition-none placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB] disabled:cursor-not-allowed disabled:bg-[#F4F7F8]";
const imageButtonClass =
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
    const failure = new Error(payload.error ?? "操作失敗，請稍後再試。") as ApiFailure;
    failure.storage_cleanup = payload.storage_cleanup;
    failure.storage_path = payload.storage_path;
    throw failure;
  }
  return payload;
}

function sortImages(images: B2bProductImage[]) {
  return [...images].sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id));
}

function validateImageFile(file: File | null) {
  if (!file) {
    return "請選擇圖片檔案。";
  }
  if (!(imageAccept.split(",") as string[]).includes(file.type)) {
    return "圖片格式只允許 JPEG、PNG 或 WebP。";
  }
  if (file.size <= 0 || file.size > imageMaxBytes) {
    return "單張圖片大小必須在 5 MB 以內。";
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };
  if (!extension || !allowedExtensions[file.type]?.includes(extension)) {
    return "圖片副檔名與檔案格式不一致。";
  }
  return null;
}

function requestFailure(error: unknown, fallback: string) {
  const failure = error as Partial<ApiFailure>;
  return {
    message: error instanceof Error ? error.message : fallback,
    cleanupPath: failure.storage_cleanup === "failed" ? failure.storage_path ?? null : null,
  };
}

export function ProductImageManager({ productId }: { productId: string | null }) {
  const [images, setImages] = useState<B2bProductImage[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<{ file: File; altText: string } | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);
  const actionErrorRef = useRef<HTMLParagraphElement>(null);
  const cleanupWarningRef = useRef<HTMLDivElement>(null);

  const orderedImages = useMemo(() => sortImages(images), [images]);
  const coverImage = useMemo(
    () => orderedImages.find((image) => image.image_role === "cover") ?? null,
    [orderedImages],
  );
  const detailImages = useMemo(
    () => orderedImages.filter((image) => image.image_role === "detail"),
    [orderedImages],
  );

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;
    void requestJson<{ images: B2bProductImage[] }>(`/api/admin/products/b2b/${productId}/images`)
      .then((result) => {
        if (!cancelled) {
          setLoadError("");
          setImages(sortImages(result.images ?? []));
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setLoadError(requestFailure(requestError, "目前無法讀取商品圖片。").message);
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
  }, [productId, reloadKey]);

  useEffect(() => {
    if (loadError) {
      loadErrorRef.current?.focus();
    }
  }, [loadError]);

  useEffect(() => {
    if (error) {
      actionErrorRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (cleanupWarning) {
      cleanupWarningRef.current?.focus();
    }
  }, [cleanupWarning]);

  function selectUploadFile(file: File | null) {
    const fileError = validateImageFile(file);
    if (fileError || !file) {
      setError(fileError ?? "請選擇圖片檔案。");
      return;
    }
    setDraft({ file, altText: "" });
    setError("");
    setMessage("");
  }

  function retryLoad() {
    setLoadError("");
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  function updateLocalImage(imageId: string, update: Partial<B2bProductImage>) {
    setImages((current) => current.map((image) => (image.id === imageId ? { ...image, ...update } : image)));
  }

  function showRequestError(requestError: unknown, fallback: string) {
    const failure = requestFailure(requestError, fallback);
    setError(failure.message);
    if (failure.cleanupPath) {
      setCleanupWarning(failure.cleanupPath);
    }
  }

  async function uploadImage() {
    if (!productId || loading || loadError || !draft || busy) {
      return;
    }
    const altText = draft.altText.trim();
    if (!altText || altText.length > 200) {
      setError("圖片替代文字必須是 200 字以內的非空白文字。");
      return;
    }
    if (detailImages.length >= imageMaxDetails) {
      setError("每個商品最多只能有 5 張細節圖。");
      return;
    }

    setBusy("upload");
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("file", draft.file);
    form.set("image_role", "detail");
    form.set("alt_text", altText);
    try {
      const result = await requestJson<{ image: B2bProductImage }>(
        `/api/admin/products/b2b/${productId}/images`,
        { method: "POST", body: form },
      );
      if (result.image) {
        setImages((current) => sortImages([...current, result.image]));
      }
      setDraft(null);
      setMessage("圖片已上傳；新圖片預設為細節圖。若要設為封面，請明確操作。");
    } catch (requestError: unknown) {
      showRequestError(requestError, "圖片上傳失敗，請重試。");
    } finally {
      setBusy(null);
    }
  }

  async function saveAltText(image: B2bProductImage) {
    if (!productId || busy) {
      return;
    }
    const altText = image.alt_text.trim();
    if (!altText || altText.length > 200) {
      setError("圖片替代文字必須是 200 字以內的非空白文字。");
      return;
    }

    setBusy(`alt-${image.id}`);
    setError("");
    try {
      const result = await requestJson<{ image: B2bProductImage }>(
        `/api/admin/products/b2b/${productId}/images/${image.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alt_text: altText }),
        },
      );
      if (result.image) {
        updateLocalImage(image.id, result.image);
      }
      setMessage("替代文字已更新。");
    } catch (requestError: unknown) {
      showRequestError(requestError, "替代文字更新失敗，請重試。");
    } finally {
      setBusy(null);
    }
  }

  async function setCover(image: B2bProductImage) {
    if (!productId || busy || image.image_role === "cover") {
      return;
    }
    setBusy(`cover-${image.id}`);
    setError("");
    try {
      const result = await requestJson<{ image: B2bProductImage }>(
        `/api/admin/products/b2b/${productId}/images/${image.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_role: "cover" }),
        },
      );
      if (result.image) {
        setImages((current) =>
          current.map((item) => (item.id === image.id ? result.image : item)),
        );
      }
      setMessage("封面圖已更新。");
    } catch (requestError: unknown) {
      showRequestError(requestError, "封面圖更新失敗，請確認目前沒有其他封面圖。");
    } finally {
      setBusy(null);
    }
  }

  function openReplace(imageId: string) {
    replaceTargetRef.current = imageId;
    replaceInputRef.current?.click();
  }

  async function replaceImage(imageId: string, file: File) {
    if (!productId || busy) {
      return;
    }
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setBusy(`replace-${image.id}`);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("image_role", image.image_role);
    form.set("alt_text", image.alt_text);
    form.set("sort_order", String(image.sort_order));
    try {
      const result = await requestJson<{
        image: B2bProductImage;
        storage_cleanup?: "ok" | "failed";
        storage_path?: string;
      }>(`/api/admin/products/b2b/${productId}/images/${image.id}`, { method: "PUT", body: form });
      if (result.image) {
        updateLocalImage(image.id, result.image);
      }
      if (result.storage_cleanup === "failed" && result.storage_path) {
        setCleanupWarning(result.storage_path);
        setMessage("圖片已替換，但舊檔案清理失敗，請重試清理。");
      } else {
        setMessage("圖片已替換。");
      }
    } catch (requestError: unknown) {
      showRequestError(requestError, "圖片替換失敗，請重試。");
    } finally {
      setBusy(null);
    }
  }

  async function deleteImage(image: B2bProductImage) {
    if (!productId || busy || !window.confirm(`確定要刪除「${image.alt_text}」這張圖片嗎？`)) {
      return;
    }
    setBusy(`delete-${image.id}`);
    setError("");
    try {
      await requestJson<{ deleted: boolean }>(
        `/api/admin/products/b2b/${productId}/images/${image.id}`,
        { method: "DELETE" },
      );
      setImages((current) => current.filter((item) => item.id !== image.id));
      setMessage("圖片已刪除。");
    } catch (requestError: unknown) {
      const failure = requestFailure(requestError, "圖片刪除失敗，請重試。");
      showRequestError(requestError, "圖片刪除失敗，請重試。");
      if (failure.cleanupPath) {
        setImages((current) => current.filter((item) => item.id !== image.id));
        setMessage("圖片資料已刪除，但檔案清理失敗，請重試清理。");
      }
    } finally {
      setBusy(null);
    }
  }

  async function persistDetailOrder(nextDetails: B2bProductImage[]) {
    if (!productId || busy) {
      return;
    }
    const nextOrder = [coverImage, ...nextDetails].filter(
      (image): image is B2bProductImage => image !== null,
    );
    setBusy("reorder");
    setError("");
    try {
      const result = await requestJson<{ images: B2bProductImage[] }>(
        `/api/admin/products/b2b/${productId}/images`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: nextOrder.map((image) => image.id) }),
        },
      );
      setImages(sortImages(result.images ?? nextOrder));
      setMessage("圖片順序已更新。");
    } catch (requestError: unknown) {
      showRequestError(requestError, "圖片排序失敗，請重試。");
    } finally {
      setBusy(null);
    }
  }

  async function moveDetail(index: number, direction: -1 | 1) {
    if (!productId || busy) {
      return;
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= detailImages.length) {
      return;
    }
    const nextDetails = [...detailImages];
    [nextDetails[index], nextDetails[targetIndex]] = [nextDetails[targetIndex], nextDetails[index]];
    await persistDetailOrder(nextDetails);
  }

  async function dropDetail(event: DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();
    if (busy) {
      return;
    }
    const sourceId = event.dataTransfer.getData("text/plain");
    const sourceIndex = detailImages.findIndex((image) => image.id === sourceId);
    if (sourceIndex < 0 || sourceIndex === targetIndex) {
      return;
    }
    const nextDetails = [...detailImages];
    const [moved] = nextDetails.splice(sourceIndex, 1);
    nextDetails.splice(targetIndex, 0, moved);
    await persistDetailOrder(nextDetails);
  }

  async function retryStorageCleanup() {
    if (!productId || !cleanupWarning || busy) {
      return;
    }
    setBusy("cleanup");
    setError("");
    try {
      await requestJson<{ storage_cleanup: "ok" }>(
        `/api/admin/products/b2b/${productId}/images`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storage_path: cleanupWarning }),
        },
      );
      setCleanupWarning(null);
      setMessage("舊圖片檔案已清理。");
    } catch (requestError: unknown) {
      showRequestError(requestError, "圖片檔案清理失敗，請稍後重試。");
    } finally {
      setBusy(null);
    }
  }

  function renderImageCard(image: B2bProductImage, isCover: boolean, detailIndex?: number) {
    const savingAlt = busy === `alt-${image.id}`;
    const replacing = busy === `replace-${image.id}`;
    const deleting = busy === `delete-${image.id}`;
    const disabled = busy !== null;
    return (
      <article
        className="min-w-0 rounded-lg border border-[#D8E1E5] bg-white p-3"
        draggable={!isCover && !disabled}
        key={image.id}
        onDragOver={(event) => {
          if (!isCover) event.preventDefault();
        }}
        onDragStart={(event) => {
          if (!isCover) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", image.id);
          }
        }}
        onDrop={(event) => {
          if (!isCover && detailIndex !== undefined) void dropDetail(event, detailIndex);
        }}
      >
        <div className={`${isCover ? "aspect-[4/3]" : "aspect-square"} overflow-hidden rounded-lg bg-[#F4F7F8]`}>
          <img
            alt={image.alt_text}
            className="h-full w-full object-cover"
            loading={isCover ? "eager" : "lazy"}
            src={image.url}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-[#17242A]">{isCover ? "封面圖" : `細節圖 ${Number(detailIndex) + 1}`}</span>
          {isCover ? (
            <span className="rounded-full border border-[#B8E1CB] bg-[#F0FBF4] px-2.5 py-1 text-xs font-semibold text-[#18794E]">目前封面</span>
          ) : null}
        </div>
        <label className="mt-3 block" htmlFor={`image-alt-${image.id}`}>
          <span className="text-sm font-semibold text-[#17242A]">替代文字</span>
          <input
            aria-label={`${isCover ? "封面圖" : "細節圖"}替代文字`}
            aria-required="true"
            className={imageInputClass}
            disabled={disabled}
            id={`image-alt-${image.id}`}
            maxLength={200}
            onChange={(event) => updateLocalImage(image.id, { alt_text: event.target.value })}
            value={image.alt_text}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`${imageButtonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
            disabled={disabled}
            onClick={() => void saveAltText(image)}
            type="button"
          >
            {savingAlt ? "儲存中…" : "儲存替代文字"}
          </button>
          <button
            className={`${imageButtonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168] hover:bg-[#EAF5FB]`}
            disabled={disabled}
            onClick={() => openReplace(image.id)}
            type="button"
          >
            {replacing ? "替換中…" : "替換圖片"}
          </button>
          {!isCover ? (
            <button
              className={`${imageButtonClass} border border-[#D8E1E5] bg-[#F4F7F8] text-[#536168] hover:bg-[#EAF5FB]`}
              disabled={disabled}
              onClick={() => void setCover(image)}
              type="button"
            >
              設為封面
            </button>
          ) : null}
          <button
            className={`${imageButtonClass} border border-[#F4C7C3] bg-white text-[#B42318] hover:bg-[#FFF5F4]`}
            disabled={disabled}
            onClick={() => void deleteImage(image)}
            type="button"
          >
            {deleting ? "刪除中…" : "刪除圖片"}
          </button>
        </div>
        {!isCover && detailIndex !== undefined ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E7EDF0] pt-3">
            <button
              aria-label={`將細節圖 ${detailIndex + 1} 上移`}
              className={`${imageButtonClass} border border-[#D8E1E5] bg-white text-[#536168] hover:bg-[#EAF5FB]`}
              disabled={disabled || detailIndex === 0}
              onClick={() => void moveDetail(detailIndex, -1)}
              type="button"
            >
              ↑ 上移
            </button>
            <button
              aria-label={`將細節圖 ${detailIndex + 1} 下移`}
              className={`${imageButtonClass} border border-[#D8E1E5] bg-white text-[#536168] hover:bg-[#EAF5FB]`}
              disabled={disabled || detailIndex === detailImages.length - 1}
              onClick={() => void moveDetail(detailIndex, 1)}
              type="button"
            >
              ↓ 下移
            </button>
          </div>
        ) : null}
      </article>
    );
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (loading || loadError || busy) {
      return;
    }
    selectUploadFile(event.dataTransfer.files[0] ?? null);
  };

  return (
    <section aria-busy={loading} aria-labelledby="images-title" className="mt-5 min-w-0 rounded-xl border border-[#D8E1E5] bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-1 border-b border-[#E7EDF0] pb-4">
        <h2 className="text-lg font-bold text-[#17242A]" id="images-title">圖片管理</h2>
        <p className="text-sm leading-6 text-[#536168]">封面與細節圖片會立即寫入；不需要按下商品欄位的主儲存按鈕。</p>
      </div>

      {!productId ? (
        <p className="mt-5 rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168]">先儲存基本資料，才能管理商品圖片。</p>
      ) : (
        <>
          {loadError ? (
            <div
              className="mt-5 flex flex-col gap-3 rounded-lg border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318] sm:flex-row sm:items-center sm:justify-between"
              ref={loadErrorRef}
              role="alert"
              tabIndex={-1}
            >
              <span>商品圖片讀取失敗：{loadError}</span>
              <button
                className={`${imageButtonClass} shrink-0 border border-[#F4C7C3] bg-white text-[#B42318] hover:bg-[#FFF5F4]`}
                disabled={loading}
                onClick={retryLoad}
                type="button"
              >
                {loading ? "讀取中…" : "重試讀取"}
              </button>
            </div>
          ) : null}
          <div
            aria-label="拖曳或選擇圖片上傳"
            className="mt-5 rounded-lg border border-dashed border-[#8AA8B6] bg-[#F8FBFC] p-5 text-center focus-within:border-[#005DAA]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <input
              aria-label="選擇要上傳的商品圖片"
              accept={imageAccept}
              className="sr-only"
              disabled={busy !== null || loading || Boolean(loadError)}
              onChange={(event) => {
                selectUploadFile(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              ref={uploadInputRef}
              type="file"
            />
            <p className="text-sm font-bold text-[#17242A]">拖曳圖片到這裡，或選擇檔案</p>
            <p className="mt-1 text-xs leading-5 text-[#536168]">JPEG／PNG／WebP，單張 5 MB；新上傳預設為細節圖，最多 5 張。</p>
            <button
              className={`${imageButtonClass} mt-3 bg-[#005DAA] text-white hover:bg-[#00457F]`}
              disabled={busy !== null || loading || Boolean(loadError)}
              onClick={(event) => {
                event.stopPropagation();
                uploadInputRef.current?.click();
              }}
              type="button"
            >
              選擇圖片
            </button>
          </div>

          <input
            aria-label="選擇要替換的商品圖片"
            accept={imageAccept}
            className="sr-only"
            disabled={busy !== null || loading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              const targetId = replaceTargetRef.current;
              replaceTargetRef.current = null;
              event.currentTarget.value = "";
              const fileError = validateImageFile(file);
              if (fileError || !file || !targetId) {
                if (fileError) setError(fileError);
                return;
              }
              void replaceImage(targetId, file);
            }}
            ref={replaceInputRef}
            type="file"
          />

          {draft ? (
            <div className="mt-4 rounded-lg border border-[#D8E1E5] bg-[#F4F7F8] p-4">
              <p className="text-sm font-semibold text-[#17242A]">已選擇：{draft.file.name}</p>
              <label className="mt-3 block max-w-xl" htmlFor="new-image-alt">
                <span className="text-sm font-semibold text-[#17242A]">替代文字</span>
                <input
                  aria-describedby="new-image-alt-hint"
                  aria-required="true"
                  className={imageInputClass}
                  disabled={busy !== null}
                  id="new-image-alt"
                  maxLength={200}
                  onChange={(event) => setDraft((current) => current ? { ...current, altText: event.target.value } : current)}
                  placeholder="請描述圖片內容"
                  value={draft.altText}
                />
                <span className="mt-1 block text-xs text-[#536168]" id="new-image-alt-hint">必填，最多 200 字元。</span>
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={`${imageButtonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
                  disabled={busy !== null}
                  onClick={() => void uploadImage()}
                  type="button"
                >
                  {busy === "upload" ? "上傳中…" : "上傳圖片"}
                </button>
                <button
                  className={`${imageButtonClass} border border-[#D8E1E5] bg-white text-[#536168] hover:bg-[#EAF5FB]`}
                  disabled={busy !== null}
                  onClick={() => setDraft(null)}
                  type="button"
                >
                  取消
                </button>
              </div>
            </div>
          ) : null}

          {!loadError ? <p className="mt-5 text-sm text-[#536168]">目前有 {images.length} 張圖片（封面 1 張、細節最多 {imageMaxDetails} 張）。</p> : null}
          {loading ? <div aria-busy="true" className="mt-4 h-40 animate-pulse rounded-lg bg-[#F4F7F8] motion-reduce:animate-none" /> : null}
          {!loading && !loadError && images.length === 0 ? (
            <p className="mt-4 rounded-lg bg-[#F4F7F8] px-4 py-3 text-sm text-[#536168]">目前沒有圖片；可直接拖曳或選擇檔案開始上傳。</p>
          ) : null}

          {!loadError && coverImage ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              {renderImageCard(coverImage, true)}
              <div className="grid gap-3 grid-cols-2">
                {detailImages.map((image, index) => renderImageCard(image, false, index))}
              </div>
            </div>
          ) : !loadError && detailImages.length > 0 ? (
            <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-3">
              {detailImages.map((image, index) => renderImageCard(image, false, index))}
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm font-semibold text-[#B42318]" ref={actionErrorRef} role="alert" tabIndex={-1}>{error}</p> : null}
          {message ? <p aria-live="polite" className="mt-4 text-sm font-semibold text-[#18794E]" role="status">{message}</p> : null}
          {cleanupWarning ? (
            <div
              className="mt-4 flex flex-col gap-3 rounded-lg border border-[#F2D7A3] bg-[#FFF9E9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              ref={cleanupWarningRef}
              role="alert"
              tabIndex={-1}
            >
              <p className="text-sm font-semibold text-[#8A5A00]">舊圖片檔案清理失敗，可能暫時保留。</p>
              <button
                className={`${imageButtonClass} border border-[#E8C36A] bg-white text-[#8A5A00] hover:bg-[#FFF4D6]`}
                disabled={busy !== null}
                onClick={() => void retryStorageCleanup()}
                type="button"
              >
                {busy === "cleanup" ? "清理中…" : "重試清理"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
