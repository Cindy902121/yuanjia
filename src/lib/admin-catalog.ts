import { isNonEmptyString } from "@/lib/api";

export type AdminChannel = "b2c" | "b2b";
export const B2B_PRODUCT_STATUSES = ["draft", "review", "published", "offline"] as const;
export type B2bProductStatus = (typeof B2B_PRODUCT_STATUSES)[number];

export const ADMIN_PRODUCT_FIELDS: Record<AdminChannel, string> = {
  b2c: "id, slug, name, brand, category, specification, price, origin, storage_method, description, food_safety_info, quality_info, mock_inventory, image_path, is_active, created_at, updated_at",
  b2b: "id, product_code, name, brand, category, specification, packaging, origin, storage_method, description, image_path, status, is_active, created_at, updated_at",
};

export const PRODUCT_TABLES: Record<AdminChannel, "b2c_products" | "b2b_products"> = {
  b2c: "b2c_products",
  b2b: "b2b_products",
};

type ProductInputResult =
  | { error: string; payload?: never }
  | { payload: Record<string, unknown>; error?: never };

export function isAdminChannel(value: string): value is AdminChannel {
  return value === "b2c" || value === "b2b";
}

export function isB2bProductStatus(value: unknown): value is B2bProductStatus {
  return (
    typeof value === "string" &&
    (B2B_PRODUCT_STATUSES as readonly string[]).includes(value)
  );
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
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) {
    return null;
  }
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0 || Math.round(amount * 100) !== amount * 100) {
    return null;
  }
  return amount;
}

function parseNonNegativeInteger(value: unknown) {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) {
    return null;
  }
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function parseProductCode(value: unknown) {
  if (!isNonEmptyString(value) || !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(value.trim())) {
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
): ProductInputResult {
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

  const requiredFields = [
    ["name", "商品名稱", 160],
    ["brand", "品牌", 160],
    ["category", "分類", 120],
    ["specification", "規格", 500],
    ["origin", "產地", 160],
    ["storage_method", "保存方式", 240],
    ["description", "商品描述", 5000],
  ] as const;

  for (const [field, label, maxLength] of requiredFields) {
    if (mode === "update" && input[field] === undefined) {
      continue;
    }
    const result = parseText(input[field], label, maxLength, true);
    if (result.error) {
      return { error: result.error };
    }
    payload[field] = result.value;
  }

  if (channel === "b2b" && (mode === "create" || input.packaging !== undefined)) {
    const result = parseText(input.packaging, "包裝", 500, false);
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
        input.mock_inventory === undefined ? 0 : parseNonNegativeInteger(input.mock_inventory);
      if (inventory === null) {
        return { error: "模擬庫存必須是 0 以上的整數。" };
      }
      payload.mock_inventory = inventory;
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

  if (channel === "b2b") {
    if (input.status !== undefined) {
      if (!isB2bProductStatus(input.status)) {
        return { error: "B2B 商品狀態格式不正確。" };
      }
      payload.status = input.status;
    } else if (input.is_active !== undefined) {
      if (typeof input.is_active !== "boolean") {
        return { error: "商品啟用狀態格式不正確。" };
      }
      // 相容既有管理 API；新 UI 使用 status。
      payload.status = input.is_active ? "published" : "offline";
    } else if (mode === "create") {
      payload.status = "draft";
    }
  } else if (input.is_active !== undefined) {
    if (typeof input.is_active !== "boolean") {
      return { error: "商品啟用狀態格式不正確。" };
    }
    payload.is_active = input.is_active;
  } else if (mode === "create") {
    payload.is_active = true;
  }

  return { payload };
}
