"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProductCardData } from "@/lib/types/product";
import { DEMO_MEMBER_PROFILE } from "@/lib/cart/demo-profile";
import { logout } from "@/lib/actions/auth";
import { DEMO_ADDRESSES, type DemoOrder } from "./member-demo-data";
import { OverviewSection } from "./sections/overview-section";
import { ProfileSection, type DemoProfileFields } from "./sections/profile-section";
import { OrdersSection } from "./sections/orders-section";
import { OffersSection } from "./sections/offers-section";
import { FavoritesSection } from "./sections/favorites-section";

export type MemberTab = "overview" | "profile" | "orders" | "offers" | "favorites";

const NAV_ITEMS: { key: MemberTab; num: string; en: string; cn: string }[] = [
  { key: "overview", num: "01", en: "OVERVIEW", cn: "會員總覽" },
  { key: "profile", num: "02", en: "PROFILE", cn: "會員資訊" },
  { key: "orders", num: "03", en: "ORDERS", cn: "訂單查詢" },
  { key: "offers", num: "04", en: "OFFERS", cn: "專屬優惠" },
  { key: "favorites", num: "05", en: "FAVORITES", cn: "收藏清單" },
];

/**
 * 會員中心主體（Client Component）——`/user` 頁面（page.tsx，Server
 * Component）先做完 Auth／B2B 守門，已登入的 B2C 使用者才會渲染到這裡。
 *
 * 2026-09-11（會員中心改版，使用者要求「課堂展示用 MVP」，前端 Demo UI/UX
 * 優先，不要求所有新增功能都接 Supabase）：
 * - 左側 Member Navigation（01-05）＋右側內容區，取代原本單欄骨架版面。
 * - `activeTab` 決定顯示哪個 Section，純前端 `useState`，不是路由，重新整理
 *   會回到 Overview——這頁本來就整組是 Demo State，跟下面 profile／
 *   addresses／favoriteIds 一致，不特別把分頁狀態留在網址上。
 * - `profile`（姓名／電話）、`addresses`（收件地址）、`favoriteIds`（收藏
 *   商品 id 清單）三組狀態都是**這個 Component 內的 Demo State**，初始值
 *   來自 `member-demo-data.ts`／既有的 `DEMO_MEMBER_PROFILE`，使用者在
 *   Profile／Favorites 頁籤做的編輯／新增／刪除只會改到這裡的 React
 *   state，不會呼叫任何 API、不會寫入 Supabase，重新整理頁面會恢復成
 *   這裡設定的初始值——這是使用者明確要求可接受的行為，不是遺漏。
 * - `email` 是真正的登入 session email（從 page.tsx 傳進來，來源是
 *   Supabase Auth，不是 Demo Data）；`products`／`orders` 也是從
 *   page.tsx 用真實 `getAllActiveProducts()` 查出來、組好的資料
 *   （`orders` 裡的商品名稱／價格／照片是真的，訂單編號／日期／狀態是
 *   Demo，見 `member-demo-data.ts` 檔頭）。
 * - 登出：直接沿用既有 `logout()` Server Action（`src/lib/actions/auth.ts`），
 *   不是重做一份——這是「目前已經可以運作的功能，不要破壞」的範圍。
 */
export function MemberCenter({
  email,
  products,
  orders,
}: {
  email: string;
  products: ProductCardData[];
  orders: DemoOrder[];
}) {
  const [activeTab, setActiveTab] = useState<MemberTab>("overview");
  const [profile, setProfile] = useState<DemoProfileFields>({
    name: DEMO_MEMBER_PROFILE.recipientName,
    phone: DEMO_MEMBER_PROFILE.recipientPhone,
  });
  const [addresses, setAddresses] = useState(DEMO_ADDRESSES);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => products.slice(0, 4).map((product) => product.id));

  const favorites = useMemo(
    () => products.filter((product) => favoriteIds.includes(product.id)),
    [products, favoriteIds],
  );
  const defaultAddress = addresses.find((address) => address.isDefault);

  function removeFavorite(productId: string) {
    setFavoriteIds((current) => current.filter((id) => id !== productId));
  }

  return (
    <div className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-20 lg:px-10 lg:py-24">
      {/* Member Navigation */}
      <nav className="flex gap-6 overflow-x-auto pb-2 lg:sticky lg:top-28 lg:flex-col lg:gap-1.5 lg:self-start lg:overflow-visible lg:pb-0">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeTab;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex shrink-0 items-baseline gap-3 whitespace-nowrap border-b-2 py-2.5 text-left transition-colors lg:border-b-0 lg:border-l-2 lg:py-3 lg:pl-4 ${
                isActive ? "border-[#C2401D]" : "border-transparent"
              }`}
            >
              <span
                className={`font-[family-name:var(--ep-font-en)] text-sm ${
                  isActive ? "text-[#C2401D]" : "text-[#536168]"
                }`}
              >
                {item.num}
              </span>
              <span
                className={`text-base ${isActive ? "font-medium text-[#0B1620]" : "text-[#536168] hover:text-[#0B1620]"}`}
              >
                {item.cn}
              </span>
            </button>
          );
        })}

        <div className="mt-4 hidden flex-col gap-3 border-t border-[#0B1620]/10 pt-5 lg:flex">
          <form action={logout}>
            <button
              type="submit"
              className="w-full border border-[#C2401D]/50 px-4 py-2 text-sm tracking-[0.1em] text-[#C2401D] transition-colors hover:border-[#C2401D] hover:bg-[#C2401D] hover:text-white"
            >
              登出
            </button>
          </form>
          <Link
            href="/faq"
            className="text-sm tracking-[0.05em] text-[#536168] underline underline-offset-2 hover:text-[#0B1620]"
          >
            聯絡我們
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="min-w-0">
        {activeTab === "overview" ? (
          <OverviewSection
            memberName={profile.name}
            orders={orders}
            favoritesCount={favoriteIds.length}
            defaultAddress={defaultAddress}
            onNavigate={setActiveTab}
          />
        ) : null}
        {activeTab === "profile" ? (
          <ProfileSection
            email={email}
            profile={profile}
            onProfileChange={setProfile}
            addresses={addresses}
            onAddressesChange={setAddresses}
          />
        ) : null}
        {activeTab === "orders" ? <OrdersSection orders={orders} /> : null}
        {activeTab === "offers" ? <OffersSection /> : null}
        {activeTab === "favorites" ? <FavoritesSection favorites={favorites} onRemove={removeFavorite} /> : null}

        <div className="mt-16 flex flex-col gap-3 border-t border-[#0B1620]/10 pt-6 lg:hidden">
          <form action={logout}>
            <button
              type="submit"
              className="w-fit border border-[#C2401D]/50 px-4 py-2 text-sm tracking-[0.1em] text-[#C2401D] transition-colors hover:border-[#C2401D] hover:bg-[#C2401D] hover:text-white"
            >
              登出
            </button>
          </form>
          <Link
            href="/faq"
            className="w-fit text-sm tracking-[0.05em] text-[#536168] underline underline-offset-2 hover:text-[#0B1620]"
          >
            聯絡我們
          </Link>
        </div>
      </div>
    </div>
  );
}
