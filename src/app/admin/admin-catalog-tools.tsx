"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

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

type CustomerPrefixRule = {
  id: string;
  prefix: string;
  tier_label: string;
  channel_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PrefixRuleForm = {
  prefix: string;
  tier_label: string;
  channel_label: string;
};

const emptyPrefixRuleForm: PrefixRuleForm = {
  prefix: "",
  tier_label: "",
  channel_label: "",
};

function ruleStatusClass(isActive: boolean) {
  return isActive
    ? "border-[#B8E1CB] bg-[#F0FBF4] text-[#18794E]"
    : "border-[#E5D2D0] bg-[#FFF5F4] text-[#A43B34]";
}

export function CustomerPrefixRulePanel() {
  const [rules, setRules] = useState<CustomerPrefixRule[]>([]);
  const [form, setForm] = useState<PrefixRuleForm>(emptyPrefixRuleForm);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const payload = await requestJson<{ rules: CustomerPrefixRule[] }>("/api/admin/customer-prefix-rules");
      setRules(payload.rules ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "目前無法讀取前綴規則。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRules();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRules]);

  async function createRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("create");
    setError("");
    setNotice("");
    try {
      await requestJson("/api/admin/customer-prefix-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: form.prefix.trim().toUpperCase(),
          tier_label: form.tier_label,
          channel_label: form.channel_label,
          is_active: true,
        }),
      });
      setForm(emptyPrefixRuleForm);
      await loadRules();
      setNotice("前綴規則已建立。");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "前綴規則建立失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function saveRule(rule: CustomerPrefixRule) {
    setBusyKey(rule.id);
    setError("");
    setNotice("");
    try {
      await requestJson(`/api/admin/customer-prefix-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier_label: rule.tier_label,
          channel_label: rule.channel_label,
          is_active: rule.is_active,
        }),
      });
      await loadRules();
      setNotice(`前綴「${rule.prefix}」已更新。`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "前綴規則更新失敗。");
    } finally {
      setBusyKey("");
    }
  }

  async function deactivateRule(rule: CustomerPrefixRule) {
    if (!window.confirm(`確定要停用前綴「${rule.prefix}」嗎？既有資料不會被刪除。`)) return;
    setBusyKey(rule.id);
    setError("");
    setNotice("");
    try {
      await requestJson(`/api/admin/customer-prefix-rules/${rule.id}`, { method: "DELETE" });
      await loadRules();
      setNotice(`前綴「${rule.prefix}」已停用。`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "前綴規則停用失敗。");
    } finally {
      setBusyKey("");
    }
  }

  function updateRule(id: string, field: "tier_label" | "channel_label" | "is_active", value: string | boolean) {
    setRules((current) => current.map((rule) => rule.id === id ? { ...rule, [field]: value } : rule));
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-[#B8E1CB] bg-[#F0FBF4] px-4 py-3 text-sm text-[#18794E]" role="status">{notice}</div> : null}

      <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
        <div className="mb-6 border-b border-[#E7EDF0] pb-5">
          <h2 className="text-xl font-bold text-[#17242A]">新增客戶代碼前綴規則</h2>
          <p className="mt-2 text-sm leading-6 text-[#536168]">前綴建立後不可修改；級距、通路與啟用狀態可由 Admin 更新，停用不會刪除既有資料。</p>
        </div>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={createRule}>
          <label className="text-sm font-semibold text-[#17242A]" htmlFor="prefix-rule-prefix">
            前綴
            <input
              className={inputClass}
              id="prefix-rule-prefix"
              maxLength={16}
              onChange={(event) => setForm((current) => ({ ...current, prefix: event.target.value.toUpperCase() }))}
              pattern="[A-Za-z][A-Za-z0-9_-]{0,15}"
              placeholder="例如 Z"
              required
              value={form.prefix}
            />
          </label>
          <label className="text-sm font-semibold text-[#17242A]" htmlFor="prefix-rule-tier">
            客戶級距
            <input
              className={inputClass}
              id="prefix-rule-tier"
              maxLength={160}
              onChange={(event) => setForm((current) => ({ ...current, tier_label: event.target.value }))}
              placeholder="例如 月營業額 20 萬以下"
              required
              value={form.tier_label}
            />
          </label>
          <label className="text-sm font-semibold text-[#17242A]" htmlFor="prefix-rule-channel">
            通路
            <input
              className={inputClass}
              id="prefix-rule-channel"
              maxLength={160}
              onChange={(event) => setForm((current) => ({ ...current, channel_label: event.target.value }))}
              placeholder="例如 B2B"
              required
              value={form.channel_label}
            />
          </label>
          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EDF0] pt-4">
            <p className="text-sm text-[#536168]">只影響新登入後產生的級距／通路快照。</p>
            <button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={busyKey === "create"} type="submit">
              {busyKey === "create" ? "建立中…" : "建立規則"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
        <div className="mb-6 border-b border-[#E7EDF0] pb-5">
          <h2 className="text-xl font-bold text-[#17242A]">前綴規則清單</h2>
          <p className="mt-2 text-sm leading-6 text-[#536168]">比對採最長啟用前綴優先；停用規則會回退到其他符合的啟用規則。</p>
        </div>
        {isLoading ? <p className="py-8 text-center text-sm text-[#536168]">正在讀取前綴規則…</p> : (
          <div className="overflow-x-auto rounded-xl border border-[#D8E1E5]">
            <table className="min-w-[820px] w-full text-left text-sm">
              <thead className="bg-[#F4F7F8] text-xs font-bold text-[#536168]"><tr><th className="px-4 py-3">前綴</th><th className="px-4 py-3">客戶級距</th><th className="px-4 py-3">通路</th><th className="px-4 py-3">狀態</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
              <tbody className="divide-y divide-[#E7EDF0] bg-white">
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-4 py-4 align-top"><code className="font-bold text-[#00457F]">{rule.prefix}</code><p className="mt-1 text-xs text-[#809099]">建立後不可修改</p></td>
                    <td className="px-4 py-4 align-top"><input aria-label={`${rule.prefix} 客戶級距`} className="min-h-10 w-full rounded-lg border border-[#D8E1E5] px-3 py-2" maxLength={160} onChange={(event) => updateRule(rule.id, "tier_label", event.target.value)} required value={rule.tier_label} /></td>
                    <td className="px-4 py-4 align-top"><input aria-label={`${rule.prefix} 通路`} className="min-h-10 w-full rounded-lg border border-[#D8E1E5] px-3 py-2" maxLength={160} onChange={(event) => updateRule(rule.id, "channel_label", event.target.value)} required value={rule.channel_label} /></td>
                    <td className="px-4 py-4 align-top">
                      <label className="flex items-center gap-2">
                        <input aria-label={`${rule.prefix} 啟用`} checked={rule.is_active} onChange={(event) => updateRule(rule.id, "is_active", event.target.checked)} type="checkbox" />
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${ruleStatusClass(rule.is_active)}`}>{rule.is_active ? "啟用中" : "已停用"}</span>
                      </label>
                    </td>
                    <td className="px-4 py-4 text-right align-top"><div className="flex flex-wrap justify-end gap-2"><button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={busyKey === rule.id} onClick={() => void saveRule(rule)} type="button">{busyKey === rule.id ? "處理中…" : "儲存"}</button>{rule.is_active ? <button className={`${buttonClass} border border-[#E5D2D0] bg-white text-[#A43B34] hover:bg-[#FFF5F4]`} disabled={busyKey === rule.id} onClick={() => void deactivateRule(rule)} type="button">停用</button> : null}</div></td>
                  </tr>
                ))}
                {rules.length === 0 ? <tr><td className="px-4 py-10 text-center text-[#809099]" colSpan={5}>目前沒有前綴規則。</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
