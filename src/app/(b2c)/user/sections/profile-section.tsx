"use client";

import { useState, type FormEvent } from "react";
import { editorialButtonLight, editorialButtonSolid } from "@/lib/editorial/styles";
import type { DemoAddress } from "../member-demo-data";

export interface DemoProfileFields {
  name: string;
  phone: string;
}

/**
 * 02 會員資訊——Email 是真正登入 session 的 email（跟 Header／舊版 /user
 * 頁面同一份真實資料，不可編輯，因為這是真的帳號身分，不是展示資料）；
 * 姓名／電話跟收件地址是 Demo Data，編輯／新增／刪除／設為預設全部只在
 * `member-center.tsx` 的 Front-end State 運作，不寫入 Supabase，重新整理
 * 會恢復成 `member-demo-data.ts` 的預設值。
 */
export function ProfileSection({
  email,
  profile,
  onProfileChange,
  addresses,
  onAddressesChange,
}: {
  email: string;
  profile: DemoProfileFields;
  onProfileChange: (next: DemoProfileFields) => void;
  addresses: DemoAddress[];
  onAddressesChange: (next: DemoAddress[]) => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          02 · PROFILE
        </span>
        <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620]">
          會員資訊
        </h2>
      </div>

      <ProfileFields email={email} profile={profile} onProfileChange={onProfileChange} />
      <AddressBook addresses={addresses} onAddressesChange={onAddressesChange} />
    </div>
  );
}

function ProfileFields({
  email,
  profile,
  onProfileChange,
}: {
  email: string;
  profile: DemoProfileFields;
  onProfileChange: (next: DemoProfileFields) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  function startEdit() {
    setDraft(profile);
    setEditing(true);
  }

  function save() {
    onProfileChange(draft);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-5 border-t border-[#0B1620]/10 pt-8">
        <dl className="flex flex-col gap-4 text-sm sm:max-w-md">
          <div className="flex gap-4">
            <dt className="w-16 shrink-0 text-[#536168]">姓名</dt>
            <dd className="text-[#0B1620]">{profile.name}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-16 shrink-0 text-[#536168]">Email</dt>
            <dd className="text-[#0B1620]">{email}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-16 shrink-0 text-[#536168]">電話</dt>
            <dd className="text-[#0B1620]">{profile.phone}</dd>
          </div>
        </dl>
        <button type="button" onClick={startEdit} className={`${editorialButtonLight} w-fit`}>
          編輯會員資料
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="flex flex-col gap-5 border-t border-[#0B1620]/10 pt-8 sm:max-w-md"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">姓名</span>
        <input
          type="text"
          required
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-[#0B1620] outline-none focus:border-[#0B1620]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">Email</span>
        <input
          type="email"
          value={email}
          disabled
          className="border border-[#0B1620]/15 bg-[#F6FBFC] px-3 py-2 text-[#536168] outline-none"
        />
        <span className="text-xs font-light text-[#536168]">登入帳號 Email 不可修改。</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">電話</span>
        <input
          type="tel"
          required
          value={draft.phone}
          onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-[#0B1620] outline-none focus:border-[#0B1620]"
        />
      </label>
      <div className="flex gap-3">
        <button type="submit" className={editorialButtonSolid}>
          儲存
        </button>
        <button type="button" onClick={() => setEditing(false)} className={editorialButtonLight}>
          取消
        </button>
      </div>
    </form>
  );
}

const EMPTY_DRAFT: Omit<DemoAddress, "id" | "isDefault"> = {
  label: "",
  recipientName: "",
  recipientPhone: "",
  address: "",
};

function AddressBook({
  addresses,
  onAddressesChange,
}: {
  addresses: DemoAddress[];
  onAddressesChange: (next: DemoAddress[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  function startAdd() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(address: DemoAddress) {
    setDraft({ label: address.label, recipientName: address.recipientName, recipientPhone: address.recipientPhone, address: address.address });
    setAdding(false);
    setEditingId(address.id);
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (adding) {
      const newAddress: DemoAddress = {
        id: `addr-${Date.now()}`,
        isDefault: addresses.length === 0,
        ...draft,
      };
      onAddressesChange([...addresses, newAddress]);
    } else if (editingId) {
      onAddressesChange(addresses.map((address) => (address.id === editingId ? { ...address, ...draft } : address)));
    }
    cancel();
  }

  function remove(id: string) {
    const target = addresses.find((address) => address.id === id);
    const remaining = addresses.filter((address) => address.id !== id);
    if (target?.isDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    onAddressesChange(remaining);
  }

  function setDefault(id: string) {
    onAddressesChange(addresses.map((address) => ({ ...address, isDefault: address.id === id })));
  }

  const formOpen = adding || editingId !== null;

  return (
    <div className="flex flex-col gap-5 border-t border-[#0B1620]/10 pt-8">
      <div className="flex items-center justify-between">
        <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
          常用收件地址
        </span>
        {!formOpen ? (
          <button
            type="button"
            onClick={startAdd}
            className="text-xs tracking-[0.1em] text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]"
          >
            ＋ 新增地址
          </button>
        ) : null}
      </div>

      <ul className="flex flex-col">
        {addresses.map((addressItem) =>
          editingId === addressItem.id ? (
            <li key={addressItem.id} className="border-t border-[#0B1620]/10 py-6 first:border-t-0">
              <AddressForm draft={draft} setDraft={setDraft} onSubmit={submit} onCancel={cancel} submitLabel="儲存變更" />
            </li>
          ) : (
            <li
              key={addressItem.id}
              className="flex flex-col gap-3 border-t border-[#0B1620]/10 py-6 first:border-t-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">
                    {addressItem.label}
                  </span>
                  {addressItem.isDefault ? (
                    <span className="text-xs tracking-[0.1em] text-[#C2401D]">預設地址</span>
                  ) : null}
                </div>
                <span className="text-[#536168]">
                  {addressItem.recipientName}．{addressItem.recipientPhone}
                </span>
                <span className="text-[#536168]">{addressItem.address}</span>
              </div>
              <div className="flex shrink-0 gap-4 text-xs tracking-[0.05em]">
                {!addressItem.isDefault ? (
                  <button
                    type="button"
                    onClick={() => setDefault(addressItem.id)}
                    className="text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]"
                  >
                    設為預設
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => startEdit(addressItem)}
                  className="text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]"
                >
                  編輯
                </button>
                <button
                  type="button"
                  onClick={() => remove(addressItem.id)}
                  className="text-[#536168] underline underline-offset-2 hover:text-[#C2401D]"
                >
                  刪除
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <div className="border-t border-[#0B1620]/10 pt-6">
          <AddressForm draft={draft} setDraft={setDraft} onSubmit={submit} onCancel={cancel} submitLabel="新增地址" />
        </div>
      ) : null}
    </div>
  );
}

function AddressForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  draft: Omit<DemoAddress, "id" | "isDefault">;
  setDraft: (next: Omit<DemoAddress, "id" | "isDefault">) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:max-w-md">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">地址標籤（例如住家／公司）</span>
        <input
          type="text"
          required
          value={draft.label}
          onChange={(event) => setDraft({ ...draft, label: event.target.value })}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-[#0B1620] outline-none focus:border-[#0B1620]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">收件人</span>
        <input
          type="text"
          required
          value={draft.recipientName}
          onChange={(event) => setDraft({ ...draft, recipientName: event.target.value })}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-[#0B1620] outline-none focus:border-[#0B1620]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">聯絡電話</span>
        <input
          type="tel"
          required
          value={draft.recipientPhone}
          onChange={(event) => setDraft({ ...draft, recipientPhone: event.target.value })}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-[#0B1620] outline-none focus:border-[#0B1620]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#536168]">地址</span>
        <input
          type="text"
          required
          value={draft.address}
          onChange={(event) => setDraft({ ...draft, address: event.target.value })}
          className="border border-[#0B1620]/25 bg-transparent px-3 py-2 text-[#0B1620] outline-none focus:border-[#0B1620]"
        />
      </label>
      <div className="flex gap-3">
        <button type="submit" className={editorialButtonSolid}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={editorialButtonLight}>
          取消
        </button>
      </div>
    </form>
  );
}
