"use client";

import { useState } from "react";
import Link from "next/link";
import { editorialButtonSolid } from "@/lib/editorial/styles";

type SubmitState = { status: "idle" } | { status: "success" };

const inputClass =
  "min-h-11 border border-[#0B1620]/25 bg-transparent px-3 text-sm text-[#0B1620] outline-none transition-colors placeholder:text-[#5C7383] focus:border-[#0B1620]";
const sectionLabelClass = "text-sm text-[#0B1620]";

/**
 * 企業合作表單的實際內容。FDD 6.10：「MVP 不建立公開寫入 API。前端只做欄位
 * 驗證與成功畫面，不保存姓名、電話或 Email。」
 *
 * 所以這裡**沒有** fetch 任何 API——跟 /checkout 的 CheckoutForm 不一樣，
 * 送出只是本地驗證通過後把 state 切到 "success"，資料本身不會離開瀏覽器，
 * 重新整理頁面就會清空。這是刻意的行為，不是還沒接 API 的半成品。
 *
 * 也因此這個表單沒有對應的分析事件——FDD 6.7 的 B2C 事件白名單裡沒有列
 * 「企業合作表單送出」這個事件名稱（見 src/lib/analytics/events.ts 的完整
 * 列表），前端不能自己發明白名單外的事件名稱，所以這裡不呼叫 trackEvent。
 *
 * 欄位依 PRD 6.7：公司名稱、聯絡人、Email、電話、產業／合作類型、產品需求、
 * 個資同意，全部必填——PRD 沒有特別標示哪個欄位可選，比照 /checkout 的作法，
 * 保守地全部要求填寫。
 */
export function LeadForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const companyName = String(formData.get("company_name") ?? "").trim();
    const contactName = String(formData.get("contact_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const cooperationType = String(formData.get("cooperation_type") ?? "").trim();
    const productNeeds = String(formData.get("product_needs") ?? "").trim();
    const privacyConsent = formData.get("privacy_consent") === "on";

    const errors: Record<string, string> = {};
    if (!companyName) errors.company_name = "請填寫公司名稱。";
    if (!contactName) errors.contact_name = "請填寫聯絡人姓名。";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "請填寫正確的 Email 格式。";
    }
    if (!phone) errors.phone = "請填寫聯絡電話。";
    if (!cooperationType) errors.cooperation_type = "請填寫產業／合作類型。";
    if (!productNeeds) errors.product_needs = "請簡述您的產品需求。";
    if (!privacyConsent) errors.privacy_consent = "請詳閱並同意個人資料蒐集聲明。";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitState({ status: "success" });
  }

  if (submitState.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 border border-[#0B1620]/15 px-12 py-20 text-center">
        <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-light tracking-[0.03em] text-[#0B1620]">
          需求已送出
        </h2>
        <p className="text-sm font-light text-[#5C7383]">
          感謝您留下合作需求，我們的業務團隊將盡快與您聯繫。
        </p>
        <p className="text-xs font-light text-[#5C7383]">
          本網站為 MVP 展示，此表單僅展示前端驗證與成功流程，不會實際保存或寄出您填寫的資料。
        </p>
        <Link href="/" className={`mt-2 ${editorialButtonSolid}`}>
          回首頁
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <p className="border-l-2 border-[#FF5A36] py-1 pl-4 text-xs font-light leading-6 text-[#5C7383]">
        本網站為 MVP 展示，此表單僅展示前端驗證與成功流程，不會實際保存或寄出您填寫的資料。
      </p>

      <Field
        id="company_name"
        name="company_name"
        label="公司名稱"
        autoComplete="organization"
        error={fieldErrors.company_name}
      />
      <Field
        id="contact_name"
        name="contact_name"
        label="聯絡人"
        autoComplete="name"
        error={fieldErrors.contact_name}
      />
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <Field
        id="phone"
        name="phone"
        label="聯絡電話"
        type="tel"
        autoComplete="tel"
        error={fieldErrors.phone}
      />
      <Field
        id="cooperation_type"
        name="cooperation_type"
        label="產業／合作類型"
        placeholder="例如：餐飲通路、零售經銷、電商平台"
        error={fieldErrors.cooperation_type}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="product_needs" className={sectionLabelClass}>
          產品需求
        </label>
        <textarea
          id="product_needs"
          name="product_needs"
          rows={4}
          placeholder="例如：需要的品項、預估數量、合作頻率"
          aria-invalid={Boolean(fieldErrors.product_needs)}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-sm text-[#0B1620] outline-none transition-colors placeholder:text-[#5C7383] focus:border-[#0B1620]"
        />
        {fieldErrors.product_needs ? (
          <p role="alert" className="text-xs text-[#B42318]">
            {fieldErrors.product_needs}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 border-t border-[#0B1620]/15 pt-6">
        <label className="flex items-center gap-2 text-sm text-[#0B1620]">
          <input type="checkbox" name="privacy_consent" className="h-4 w-4 accent-[#FF5A36]" />
          我已閱讀並同意元家蒐集以上資料以進行合作聯繫（展示用途，不會用於真實行銷）。
        </label>
        {fieldErrors.privacy_consent ? (
          <p role="alert" className="text-xs text-[#B42318]">
            {fieldErrors.privacy_consent}
          </p>
        ) : null}
      </div>

      <button type="submit" className={`self-start ${editorialButtonSolid}`}>
        送出需求
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={sectionLabelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={inputClass}
      />
      {error ? (
        <p role="alert" className="text-xs text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
