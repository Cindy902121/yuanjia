"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ORDER_FILTER_TABS,
  ORDER_STATUS_LABEL,
  getOrderTotal,
  type DemoOrder,
  type OrderFilterTab,
} from "../member-demo-data";
import { OrderTimeline } from "./order-timeline";

/**
 * 03 訂單查詢——Filter Tabs（全部訂單／待付款／待出貨／待收貨／已完成）＋
 * 訂單清單；點一筆訂單，右側／下方換成該筆的完整 Order Detail＋Progress
 * Timeline。所有訂單都是 `member-demo-data.ts` 裡的 DEMO 資料，見該檔案
 * 檔頭說明。
 */
export function OrdersSection({ orders }: { orders: DemoOrder[] }) {
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filtered = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrderId(null)} />;
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          03 · ORDERS
        </span>
        <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620]">
          訂單查詢
        </h2>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-[#0B1620]/10 pb-1">
        {ORDER_FILTER_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm tracking-[0.05em] transition-colors ${
                isActive ? "text-[#0B1620]" : "text-[#536168] hover:text-[#0B1620]"
              }`}
            >
              {tab.label}
              {isActive ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[2px] bg-[#C2401D]" /> : null}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm font-light text-[#536168]">這個分類目前沒有訂單。</p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((order) => (
            <li key={order.id} className="border-t border-[#0B1620]/10 py-6 last:border-b">
              <button
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className="group flex w-full flex-col gap-4 text-left sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
                      {order.placedAtLabel}
                    </span>
                    <span className="font-[family-name:var(--ep-font-en)] text-sm text-[#0B1620]">{order.id}</span>
                  </div>

                  <div className="flex -space-x-3">
                    {order.items.map((item) => (
                      <div
                        key={item.productId}
                        className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#EAF4F8] bg-[#F6FBFC]"
                      >
                        {item.image ? (
                          <Image src={item.image.url} alt={item.image.alt} fill sizes="56px" className="object-cover" />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <p className="max-w-xs text-sm font-light leading-[1.7] text-[#536168]">
                    {order.items.map((item) => `${item.name} × ${item.quantity}`).join("、")}
                  </p>
                </div>

                <div className="flex items-center gap-8">
                  <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">
                    NT$ {getOrderTotal(order).toLocaleString()}
                  </span>
                  <span
                    className={`text-xs tracking-[0.1em] ${
                      order.status === "pending_payment" ? "text-[#C2401D]" : "text-[#536168]"
                    }`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <span className="text-xs tracking-[0.1em] text-[#0B1620] underline underline-offset-2 group-hover:text-[#FF5A36]">
                    查看詳情 →
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: DemoOrder; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-fit text-xs tracking-[0.1em] text-[#536168] underline underline-offset-2 hover:text-[#0B1620]"
        >
          ← 回訂單列表
        </button>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[#0B1620]/10 pb-6">
          <div className="flex flex-col gap-1">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
              ORDER DETAIL
            </span>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-light tracking-[0.03em] text-[#0B1620]">
              {order.id}
            </h2>
          </div>
          <span className="text-sm text-[#536168]">訂購日期：{order.placedAtLabel}</span>
        </div>
      </div>

      <div className="border border-[#0B1620]/10 px-6 py-10 sm:px-10">
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-5 border-t border-[#0B1620]/10 py-5 last:border-b">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#F6FBFC]">
                {item.image ? (
                  <Image src={item.image.url} alt={item.image.alt} fill sizes="80px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">{item.name}</span>
                <span className="text-sm font-light text-[#536168]">數量 × {item.quantity}</span>
              </div>
              <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">
                NT$ {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex justify-end border-t border-[#0B1620]/15 pt-5">
            <span className="font-[family-name:var(--ep-font-en)] text-lg tracking-widest text-[#0B1620]">
              合計 NT$ {getOrderTotal(order).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#0B1620]/10 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">收件資訊</span>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-[#536168]">收件人</dt>
              <dd className="text-[#0B1620]">{order.recipientName}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-[#536168]">電話</dt>
              <dd className="text-[#0B1620]">{order.recipientPhone}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-[#536168]">地址</dt>
              <dd className="text-[#0B1620]">{order.deliveryAddress}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
