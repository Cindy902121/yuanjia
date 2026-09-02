"use client";

import { FormEvent, useRef, useState } from "react";

type ApiPayload = { error?: string };

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

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none transition focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const CSV_HEADERS = [
  "product_code",
  "name",
  "brand",
  "category",
  "specification",
  "packaging",
  "origin",
  "storage_method",
  "description",
] as const;
const CSV_TEMPLATE = `${CSV_HEADERS.join(",")}\n`;

export function B2bCsvImportPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!file) {
      setError("請先選擇 CSV 檔案。");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("請選擇 .csv 檔案。");
      return;
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setError("CSV 檔案大小必須在 10 MB 以內。");
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const payload = await requestJson<{ created_count: number }>("/api/admin/products/b2b/import", {
        method: "POST",
        body,
      });
      setResult(payload.created_count);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      try {
        await onImported();
      } catch {
        setError("商品已匯入，但清單重新整理失敗，請手動重新整理。");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "CSV 匯入失敗。");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-[#C5D8E9] bg-[#EEF7FD] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-bold text-[#17242A]">CSV 批量新增 B2B 商品</h3>
          <p className="mt-1 text-sm leading-6 text-[#536168]">
            UTF-8、最多 500 筆、10 MB；只匯入基本資料，任一列錯誤時整批未寫入，成功後直接以「已發布」狀態建立。
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[#536168]">欄位順序：{CSV_HEADERS.join(",")}</p>
        </div>
        <a
          className={`${buttonClass} border border-[#9CC6E1] bg-white text-[#00457F] hover:bg-[#EAF5FB]`}
          download="b2b-products-template.csv"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
        >
          下載 CSV 範本
        </a>
      </div>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={importCsv}>
        <label className="flex-1 text-sm font-semibold text-[#17242A]" htmlFor="b2b-csv-file">
          CSV 檔案
          <input
            accept=".csv,text/csv"
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#EAF5FB] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#005DAA]`}
            id="b2b-csv-file"
            onChange={(event) => {
              setError("");
              setResult(null);
              setFile(event.target.files?.[0] ?? null);
            }}
            ref={inputRef}
            type="file"
          />
        </label>
        <button
          className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`}
          disabled={!file || isUploading}
          type="submit"
        >
          {isUploading ? "匯入中…" : "開始匯入"}
        </button>
      </form>
      {file ? <p className="mt-2 text-xs text-[#536168]">已選擇：{file.name}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#A43B34]" role="alert">{error}</p> : null}
      {result !== null ? <p className="mt-3 text-sm font-semibold text-[#18794E]" role="status">已成功匯入 {result} 筆商品。</p> : null}
    </section>
  );
}
