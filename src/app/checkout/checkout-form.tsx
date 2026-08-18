"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";
import type { CartItem } from "@/lib/cart/store";
import { createClient } from "@/lib/supabase/client";
import { getProductBySlug } from "@/lib/supabase/products";
import type { ProductDetailData } from "@/lib/types/product";
import { DEMO_MEMBER_PROFILE } from "@/lib/cart/demo-profile";
import { trackEvent } from "@/lib/analytics/track";
import { TrackPageView } from "@/components/analytics/TrackPageView";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; orderId: string }
  | { status: "error"; message: string };

interface PriceCheck {
  item: CartItem;
  current: ProductDetailData | null;
  priceChanged: boolean;
  nowOutOfStock: boolean;
  noLongerAvailable: boolean;
}

const PAYMENT_METHODS = [
  { value: "cod", label: "貨到付款" },
  { value: "credit_card", label: "信用卡" },
  { value: "bank_transfer", label: "銀行轉帳" },
] as const;

const DELIVERY_METHODS = [
  { value: "home_delivery", label: "宅配到府", fee: 100 },
  { value: "convenience_store", label: "超商取貨", fee: 60 },
  { value: "self_pickup", label: "門市自取", fee: 0 },
] as const;

/**
 * /checkout 的實際內容。PRD B2C-04／FDD §6.3、§7.2：
 * - H1「結帳」、必填收件人姓名／手機／Email／地址／隱私權同意，驗證、送出中、
 *   成功與錯誤狀態。
 * - 送出打 C 已經寫好的 POST /api/b2c/mock-orders（見 src/app/api/b2c/mock-orders/route.ts），
 *   這裡不重新發明驗證規則，前端驗證只是提早擋掉明顯錯誤，真正的權威驗證在伺服器。
 *
 * 2026-08-17：使用者要求「購物車保存加入時資料，但結帳時重新確認即時價格與庫存」
 * ——載入時逐一用 getProductBySlug() 重新查目前資料，跟購物車裡的快照比對；
 * 價格不同或現在缺貨會清楚提示，不會悄悄用舊資料送出。
 *
 * 2026-08-17（同日，第二次調整）：查詢來源從本機 fixture 改成正式 Supabase
 * （C 本週排程要求，見 src/lib/supabase/products.ts）。這裡是 Client Component
 * （要處理表單送出狀態），沒辦法用 src/lib/supabase/server.ts 那個伺服器端
 * client，改用 src/lib/supabase/client.ts 的瀏覽器端 client——一樣是公開唯讀
 * 查 active 商品，走同一套 RLS 政策，不需要任何權限升級。因為查詢變成非同步，
 * 原本的 useMemo 換成 useEffect + useState。
 *
 * 2026-08-17（同日）：依使用者要求擴充版面，三件事跟 b2c_orders 資料表（FDD §4.7：
 * 只存 id/status/收件人姓名/電話/Email/地址/隱私同意時間）完全對不上，已經跟
 * 使用者確認怎麼處理，不是我自己決定的：
 * - 付款方式／寄送方式／運費：資料庫沒有對應欄位，選了送出後不會被保存。做成
 *   真的可以互動的選單／按鈕（不是純文字），但表單最上方有清楚的「僅供畫面
 *   展示」提示，運費會照寄送方式即時反映在總計裡，不是純裝飾。
 * - 優惠券：PRD／FDD 完全沒有這個功能，使用者確認是要新增的視覺元素——輸入框
 *   可以打字，「套用」按鈕點下去只會提示「僅供展示，未實際套用折扣」，不會
 *   真的算折扣。
 * - 「使用展示會員資料」勾選：系統沒有真正的會員個人資料／地址儲存，用
 *   src/lib/cart/demo-profile.ts 那組寫死的示範資料帶入表單（使用者可以再自行
 *   修改），不是接一個不存在的真實資料來源。
 *
 * 版面依使用者要求分兩欄：左欄商品明細／優惠券／備註，右欄收件資訊／付款／
 * 寄送／費用小計／送出，送出按鈕在右欄最下方靠右。
 *
 * 2026-08-17（同日，第三次調整）：上面這段「已知限制」已經解除——/products
 * 系列頁面改接正式 Supabase 後，購物車裡的 productId 是真的 UUID、真的存在於
 * b2c_products，送出應該可以真的成功建立展示訂單，不會再固定拿到 400。錯誤狀態
 * 會正確顯示伺服器回傳的訊息，符合 FDD §11.5「API 錯誤有明確訊息」的驗收標準。
 */
export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]["value"]>(
    "cod",
  );
  const [deliveryMethod, setDeliveryMethod] = useState<
    (typeof DELIVERY_METHODS)[number]["value"]
  >("home_delivery");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [note, setNote] = useState("");
  const [useMemberProfile, setUseMemberProfile] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const shippingFee = DELIVERY_METHODS.find((m) => m.value === deliveryMethod)?.fee ?? 0;
  const grandTotal = totalPrice + shippingFee;

  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPriceChecks() {
      const supabase = createClient();
      const results = await Promise.all(
        items.map(async (item) => {
          const current = await getProductBySlug(supabase, item.slug);
          return {
            item,
            current,
            priceChanged: current ? current.price !== item.price : false,
            nowOutOfStock: current ? current.inventoryStatus === "out_of_stock" : false,
            noLongerAvailable: !current,
          };
        }),
      );
      if (!cancelled) {
        setPriceChecks(results);
      }
    }

    loadPriceChecks();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const hasBlockingIssue = priceChecks.some(
    (check) => check.nowOutOfStock || check.noLongerAvailable,
  );

  function handleUseMemberProfileChange(checked: boolean) {
    setUseMemberProfile(checked);
    if (!checked) {
      return;
    }
    if (nameRef.current) nameRef.current.value = DEMO_MEMBER_PROFILE.recipientName;
    if (phoneRef.current) phoneRef.current.value = DEMO_MEMBER_PROFILE.recipientPhone;
    if (emailRef.current) emailRef.current.value = DEMO_MEMBER_PROFILE.recipientEmail;
    if (addressRef.current) addressRef.current.value = DEMO_MEMBER_PROFILE.deliveryAddress;
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) {
      setCouponMessage("請先輸入優惠券代碼。");
      return;
    }
    setCouponMessage("此功能僅供畫面展示，尚未串接真實折扣邏輯。");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const recipientName = String(formData.get("recipient_name") ?? "").trim();
    const recipientPhone = String(formData.get("recipient_phone") ?? "").trim();
    const recipientEmail = String(formData.get("recipient_email") ?? "").trim();
    const deliveryAddress = String(formData.get("delivery_address") ?? "").trim();
    const privacyConsent = formData.get("privacy_consent") === "on";

    const errors: Record<string, string> = {};
    if (!recipientName) errors.recipient_name = "請填寫收件人姓名。";
    if (!recipientPhone) errors.recipient_phone = "請填寫聯絡電話。";
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      errors.recipient_email = "請填寫正確的 Email 格式。";
    }
    if (!deliveryAddress) errors.delivery_address = "請填寫配送地址。";
    if (!privacyConsent) errors.privacy_consent = "請詳閱並同意隱私權政策。";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/b2c/mock-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_email: recipientEmail,
          delivery_address: deliveryAddress,
          privacy_consent_at: new Date().toISOString(),
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
          // 以下欄位資料庫沒有對應欄位可存，伺服器目前會忽略；先送出是為了
          // 之後如果真的加了對應欄位，前端不用重寫，見檔頭註解。
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
          shipping_fee: shippingFee,
          coupon_code: couponCode || null,
          note: note || null,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitState({
          status: "error",
          message: result?.error ?? "送出訂單時發生問題，請稍後再試一次。",
        });
        return;
      }

      trackEvent({ event_name: "b2c_mock_order_created" });
      clearCart();
      setSubmitState({ status: "success", orderId: result.orderId });
    } catch {
      setSubmitState({ status: "error", message: "網路異常，請稍後再試一次。" });
    }
  }

  if (submitState.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface-white p-12 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">訂單已建立</h1>
        <p className="text-sm text-ink-600">
          展示訂單編號：<span className="font-mono text-ink-900">{submitState.orderId}</span>
        </p>
        <p className="text-xs text-ink-600">
          本網站為 MVP 展示，未串接真實金流與物流，這是一筆展示用模擬訂單。
        </p>
        <Link
          href="/products"
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
        >
          繼續逛逛
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-subtle p-12 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">結帳</h1>
        <p className="text-sm text-ink-600">購物車是空的，先去挑幾樣商品吧。</p>
        <Link
          href="/products"
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
        >
          瀏覽商品
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <TrackPageView eventName="b2c_checkout_start" />
      <h1 className="text-2xl font-semibold text-ink-900">結帳</h1>

      {priceChecks.some((c) => c.priceChanged || c.nowOutOfStock || c.noLongerAvailable) ? (
        <ul className="flex flex-col gap-2 rounded-lg border border-error-border bg-error-050 p-4 text-sm text-error-700">
          {priceChecks
            .filter((c) => c.priceChanged || c.nowOutOfStock || c.noLongerAvailable)
            .map((c) => (
              <li key={c.item.productId}>
                {c.noLongerAvailable
                  ? `「${c.item.name}」已下架，請回到購物車移除。`
                  : c.nowOutOfStock
                    ? `「${c.item.name}」目前缺貨，請回到購物車調整。`
                    : `「${c.item.name}」價格已更新為 NT$ ${c.current?.price}（購物車顯示 NT$ ${c.item.price}），送出時將以最新價格計算。`}
              </li>
            ))}
        </ul>
      ) : null}

      <p className="rounded-lg border border-brand-ocean-050 bg-brand-ocean-050 px-4 py-3 text-xs text-brand-ocean-800">
        本頁的付款方式、寄送方式、優惠券與備註僅供畫面展示——MVP 未串接真實金流與物流，這些選擇不會被保存，送出訂單只會記錄收件資訊與商品品項。
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
        {/* 左欄：商品明細、優惠券、備註（使用者 2026-08-17 指定的分欄方式）。 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-white p-4">
            <h2 className="text-sm font-semibold text-ink-900">商品明細</h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-warm text-[10px] text-ink-600"
                  >
                    無商品圖片
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm text-ink-900">{item.name}</span>
                    <span className="text-xs text-ink-600">
                      NT$ {item.price} × {item.quantity}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    NT$ {item.price * item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-white p-4">
            <label htmlFor="coupon" className="text-sm font-semibold text-ink-900">
              優惠券
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setCouponMessage("");
                }}
                placeholder="輸入優惠券代碼"
                className="min-h-11 flex-1 rounded-lg border border-border-subtle bg-surface-white px-3 text-sm text-ink-900 outline-none focus:border-brand-ocean-700 focus:ring-4 focus:ring-brand-ocean-050"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="min-h-11 rounded-lg border border-brand-ocean-700 px-4 text-sm font-semibold text-brand-ocean-700 transition hover:bg-brand-ocean-050 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              >
                套用
              </button>
            </div>
            {couponMessage ? <p className="text-xs text-ink-600">{couponMessage}</p> : null}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-white p-4">
            <label htmlFor="note" className="text-sm font-semibold text-ink-900">
              訂單備註（選填）
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="例如：配送時間偏好、特殊需求"
              className="rounded-lg border border-border-subtle bg-surface-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-ocean-700 focus:ring-4 focus:ring-brand-ocean-050"
            />
          </div>
        </div>

        {/* 右欄：收件資訊、付款、寄送、費用小計、送出（送出按鈕靠右下）。 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-white p-4">
            <label className="flex items-center gap-2 text-sm text-ink-900">
              <input
                type="checkbox"
                checked={useMemberProfile}
                onChange={(event) => handleUseMemberProfileChange(event.target.checked)}
                className="h-4 w-4 rounded border-border-subtle text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              />
              使用展示會員資料
            </label>

            <Field
              id="recipient_name"
              name="recipient_name"
              label="收件人姓名"
              autoComplete="name"
              inputRef={nameRef}
              error={fieldErrors.recipient_name}
            />
            <Field
              id="recipient_phone"
              name="recipient_phone"
              label="聯絡電話"
              type="tel"
              autoComplete="tel"
              inputRef={phoneRef}
              error={fieldErrors.recipient_phone}
            />
            <Field
              id="recipient_email"
              name="recipient_email"
              label="Email"
              type="email"
              autoComplete="email"
              inputRef={emailRef}
              error={fieldErrors.recipient_email}
            />
            <Field
              id="delivery_address"
              name="delivery_address"
              label="配送地址"
              autoComplete="street-address"
              inputRef={addressRef}
              error={fieldErrors.delivery_address}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-white p-4">
            <span className="text-sm font-semibold text-ink-900">付款方式</span>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => (
                <label key={method.value} className="flex items-center gap-2 text-sm text-ink-900">
                  <input
                    type="radio"
                    name="payment_method_ui"
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="h-4 w-4 border-border-subtle text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-white p-4">
            <span className="text-sm font-semibold text-ink-900">寄送方式</span>
            <div className="flex flex-col gap-2">
              {DELIVERY_METHODS.map((method) => (
                <label
                  key={method.value}
                  className="flex items-center justify-between gap-2 text-sm text-ink-900"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delivery_method_ui"
                      checked={deliveryMethod === method.value}
                      onChange={() => setDeliveryMethod(method.value)}
                      className="h-4 w-4 border-border-subtle text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                    />
                    {method.label}
                  </span>
                  <span className="text-ink-600">
                    {method.fee === 0 ? "免運" : `NT$ ${method.fee}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-white p-4 text-sm">
            <div className="flex items-center justify-between text-ink-600">
              <span>商品小計</span>
              <span>NT$ {totalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-ink-600">
              <span>運費</span>
              <span>{shippingFee === 0 ? "免運" : `NT$ ${shippingFee}`}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-base font-semibold text-ink-900">
              <span>總計</span>
              <span>NT$ {grandTotal}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm text-ink-900">
              <input
                type="checkbox"
                name="privacy_consent"
                className="h-4 w-4 rounded border-border-subtle text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              />
              我已閱讀並同意隱私權政策（展示用途，不會用於真實行銷）。
            </label>
            {fieldErrors.privacy_consent ? (
              <p role="alert" className="text-xs text-error-700">
                {fieldErrors.privacy_consent}
              </p>
            ) : null}
          </div>

          {submitState.status === "error" ? (
            <p
              role="alert"
              className="rounded-lg border border-error-border bg-error-050 px-4 py-3 text-sm text-error-700"
            >
              {submitState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitState.status === "submitting" || hasBlockingIssue}
            className="inline-flex min-h-12 items-center justify-center self-end rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700 disabled:cursor-not-allowed disabled:bg-border-subtle disabled:text-ink-600"
          >
            {submitState.status === "submitting" ? "送出中…" : "送出訂單"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  error,
  inputRef,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-ink-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        ref={inputRef}
        className="min-h-11 rounded-lg border border-border-subtle bg-surface-white px-3 text-sm text-ink-900 outline-none focus:border-brand-ocean-700 focus:ring-4 focus:ring-brand-ocean-050"
      />
      {error ? (
        <p role="alert" className="text-xs text-error-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
