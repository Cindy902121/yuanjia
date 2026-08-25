import type { SupabaseClient } from "@supabase/supabase-js";

import { isNonEmptyString, parsePositiveInteger } from "@/lib/api";

export type AdminChannel = "b2c" | "b2b";

export const B2B_PRODUCT_STATUSES = ["draft", "review", "published", "offline"] as const;
export type B2bProductStatus = (typeof B2B_PRODUCT_STATUSES)[number];

export const B2B_STATUS_LABELS: Record<B2bProductStatus, string> = {
  draft: "草稿",
  review: "待審核",
  published: "已發布",
  offline: "已下架",
};

export const B2B_PRODUCT_CODE_PATTERN = "^[A-Z0-9][A-Z0-9._-]{0,79}$";

export const B2B_PRODUCT_FIELD_RULES = [
  {
    key: "product_code",
    label: "商品編號",
    maxLength: 80,
    required: true,
    pattern: B2B_PRODUCT_CODE_PATTERN,
    hint: "限大寫英數、句點、底線或連字號，最多 80 字元；建立後不可修改。",
  },
  { key: "name", label: "商品名稱", maxLength: 160, required: true, hint: "最多 160 字元。" },
  { key: "brand", label: "品牌", maxLength: 160, required: true, hint: "最多 160 字元。" },
  { key: "category", label: "分類", maxLength: 120, required: true, hint: "最多 120 字元。" },
  { key: "specification", label: "規格", maxLength: 500, required: true, hint: "最多 500 字元。" },
  { key: "packaging", label: "包裝", maxLength: 500, required: false, hint: "選填，最多 500 字元。" },
  { key: "origin", label: "產地", maxLength: 160, required: true, hint: "最多 160 字元。" },
  {
    key: "storage_method",
    label: "保存方式",
    maxLength: 240,
    required: true,
    hint: "最多 240 字元。",
  },
  { key: "description", label: "商品描述", maxLength: 5000, required: true, hint: "最多 5,000 字元。" },
] as const;

const B2B_STATUS_TRANSITIONS: Record<B2bProductStatus, readonly B2bProductStatus[]> = {
  draft: ["review"],
  review: ["draft", "published"],
  published: ["offline"],
  offline: ["published"],
};

export function isB2bProductStatus(value: unknown): value is B2bProductStatus {
  return typeof value === "string" && B2B_PRODUCT_STATUSES.includes(value as B2bProductStatus);
}

export function canTransitionB2bProductStatus(
  current: unknown,
  next: unknown,
) {
  return (
    isB2bProductStatus(current) &&
    isB2bProductStatus(next) &&
    B2B_STATUS_TRANSITIONS[current].includes(next)
  );
}

export const ADMIN_PRODUCT_FIELDS: Record<AdminChannel, string> = {
  b2c: "id, slug, name, brand, category, specification, price, currency, short_description, origin, storage_method, description, food_safety_info, quality_info, mock_inventory, image_path, is_active, created_at, updated_at",
  b2b: "id, product_code, name, brand, category, specification, packaging, origin, storage_method, description, image_path, status, is_active, created_at, updated_at",
};

export const PRODUCT_TABLES: Record<AdminChannel, "b2c_products" | "b2b_products"> = {
  b2c: "b2c_products",
  b2b: "b2b_products",
};

export const TAG_TABLES: Record<AdminChannel, "b2c_tags" | "b2b_tags"> = {
  b2c: "b2c_tags",
  b2b: "b2b_tags",
};

export const PRODUCT_TAG_TABLES: Record<
  AdminChannel,
  "b2c_product_tags" | "b2b_product_tags"
> = {
  b2c: "b2c_product_tags",
  b2b: "b2b_product_tags",
};

export function isAdminChannel(value: string): value is AdminChannel {
  return value === "b2c" || value === "b2b";
}

function parseText(
  value: unknown,
  label: string,
  maxLength: number,
  required: boolean,
) {
  if (value === undefined || value === null || value === "") {
    return required ? { error: `${label}為必填欄位。` } : { value: null };
  }
  if (!isNonEmptyString(value) || value.trim().length > maxLength) {
    return { error: `${label}格式不正確。` };
  }
  return { value: value.trim() };
}

function parseMoney(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0 || Math.round(amount * 100) !== amount * 100) {
    return null;
  }
  return amount;
}

function parseProductCode(value: unknown) {
  if (!isNonEmptyString(value) || !new RegExp(B2B_PRODUCT_CODE_PATTERN).test(value.trim())) {
    return null;
  }
  return value.trim();
}

function parseSlug(value: unknown) {
  if (!isNonEmptyString(value) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) {
    return null;
  }
  return value.trim();
}

export function parseProductInput(
  body: unknown,
  channel: AdminChannel,
  mode: "create" | "update",
) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "商品資料格式不正確。" };
  }

  const input = body as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  if (input.price !== undefined && channel === "b2b") {
    return { error: "B2B 商品不可包含價格欄位。" };
  }
  if (mode === "update" && (input.slug !== undefined || input.product_code !== undefined)) {
    return { error: "商品識別碼建立後不可修改。" };
  }

  if (mode === "create") {
    if (channel === "b2c") {
      const slug = parseSlug(input.slug);
      if (!slug) {
        return { error: "B2C slug 格式不正確。" };
      }
      payload.slug = slug;
    } else {
      const productCode = parseProductCode(input.product_code);
      if (!productCode) {
        return { error: "B2B product_code 格式不正確。" };
      }
      payload.product_code = productCode;
    }
  }

  for (const fieldRule of B2B_PRODUCT_FIELD_RULES.filter(
    (field) => field.key !== "product_code" && field.required,
  )) {
    if (mode === "update" && input[fieldRule.key] === undefined) {
      continue;
    }
    const result = parseText(
      input[fieldRule.key],
      fieldRule.label,
      fieldRule.maxLength,
      fieldRule.required,
    );
    if (result.error) {
      return { error: result.error };
    }
    payload[fieldRule.key] = result.value;
  }

  if (channel === "b2c" && (mode === "create" || input.short_description !== undefined)) {
    const result = parseText(input.short_description, "商品摘要", 160, true);
    if (result.error) {
      return { error: result.error };
    }
    payload.short_description = result.value;
  }

  const packagingRule = B2B_PRODUCT_FIELD_RULES.find((field) => field.key === "packaging");
  if (channel === "b2b" && packagingRule && (mode === "create" || input.packaging !== undefined)) {
    const result = parseText(
      input.packaging,
      packagingRule.label,
      packagingRule.maxLength,
      packagingRule.required,
    );
    if (result.error) {
      return { error: result.error };
    }
    payload.packaging = result.value;
  }

  if (channel === "b2c") {
    if (mode === "create" || input.price !== undefined) {
      const price = parseMoney(input.price);
      if (price === null) {
        return { error: "價格格式不正確。" };
      }
      payload.price = price;
    }

    if (mode === "create" || input.mock_inventory !== undefined) {
      const inventory =
        input.mock_inventory === undefined ? 0 : parsePositiveInteger(input.mock_inventory);
      if (inventory === null && Number(input.mock_inventory) !== 0) {
        return { error: "模擬庫存必須是 0 以上的整數。" };
      }
      payload.mock_inventory = inventory ?? 0;
    }

    for (const [field, label, maxLength] of [
      ["food_safety_info", "食品安全資訊", 5000],
      ["quality_info", "品質／認證資訊", 5000],
    ] as const) {
      if (mode === "create" || input[field] !== undefined) {
        const result = parseText(input[field], label, maxLength, false);
        if (result.error) {
          return { error: result.error };
        }
        payload[field] = result.value;
      }
    }
  }

  if (input.is_active !== undefined && channel === "b2b") {
    return { error: "B2B 商品請使用 status 管理工作狀態。" };
  }

  if (input.is_active !== undefined) {
    if (typeof input.is_active !== "boolean") {
      return { error: "商品啟用狀態格式不正確。" };
    }
    payload.is_active = input.is_active;
  } else if (mode === "create" && channel === "b2c") {
    payload.is_active = true;
  }

  return { payload };
}

export function parseTagIds(value: unknown) {
  if (value === undefined) {
    return { value: undefined as string[] | undefined };
  }
  if (!Array.isArray(value)) {
    return { error: "tag_ids 必須是陣列。" };
  }

  const tagIds = [...new Set(value)];
  if (tagIds.some((tagId) => typeof tagId !== "string" || !/^[0-9a-f-]{36}$/i.test(tagId)) || tagIds.length > 100) {
    return { error: "標籤資料不正確。" };
  }
  return { value: tagIds as string[] };
}

export async function replaceProductTags(
  admin: SupabaseClient,
  channel: AdminChannel,
  productId: string,
  tagIds: string[],
) {
  const tagTable = TAG_TABLES[channel];
  const relationTable = PRODUCT_TAG_TABLES[channel];
  const { data: tags, error: tagError } =
    tagIds.length > 0
      ? await admin
          .from(tagTable)
          .select("id")
          .in("id", tagIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (tagError) {
    return "目前無法確認產品標籤。";
  }
  if ((tags ?? []).length !== tagIds.length) {
    return "只能套用同一產品線中已啟用的既有標籤。";
  }

  const { error: deleteError } = await admin
    .from(relationTable)
    .delete()
    .eq("product_id", productId);
  if (deleteError) {
    return "目前無法更新產品標籤。";
  }

  if (tagIds.length > 0) {
    const { error: insertError } = await admin
      .from(relationTable)
      .insert(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));
    if (insertError) {
      return "目前無法套用產品標籤。";
    }
  }

  return null;
}
