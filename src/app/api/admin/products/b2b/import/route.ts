import { apiError, json } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import { parseProductInput } from "@/lib/admin-catalog";
import { parseCsvRecords } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 500;
const HEADERS = [
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

function csvFile(value: FormDataEntryValue | null | undefined): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export async function POST(request: Request) {
  const guard = await requireBusinessAdmin();
  if (guard.response) return guard.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!csvFile(file) || !file.name.toLowerCase().endsWith(".csv")) {
    return apiError("請上傳 CSV 檔案。", 400);
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return apiError("CSV 檔案大小必須在 10 MB 以內。", 400);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    return apiError("CSV 必須是 UTF-8 編碼。", 400);
  }

  const records = parseCsvRecords(text.replace(/^\uFEFF/, ""));
  if (!records || records.length < 2 || records[0].map((value) => value.trim()).join("\u0000") !== HEADERS.join("\u0000")) {
    return apiError(`CSV 欄位必須依序為：${HEADERS.join(",")}。`, 400);
  }
  const rows = records.slice(1);
  if (rows.length > MAX_ROWS) {
    return apiError(`CSV 一次最多只能新增 ${MAX_ROWS} 筆商品。`, 400);
  }

  const products: Array<Record<string, unknown>> = [];
  const productCodes = new Set<string>();
  for (const [index, row] of rows.entries()) {
    if (row.length !== HEADERS.length) {
      return apiError(`第 ${index + 2} 列欄位數量不正確。`, 400);
    }
    const input = Object.fromEntries(HEADERS.map((header, column) => [header, row[column].trim()]));
    const parsed = parseProductInput(input, "b2b", "create");
    if (!parsed.payload) {
      return apiError(`第 ${index + 2} 列：${parsed.error ?? "商品資料格式不正確。"}`, 400);
    }
    const productCode = parsed.payload.product_code;
    if (typeof productCode !== "string" || productCodes.has(productCode)) {
      return apiError(`第 ${index + 2} 列的 product_code 重複。`, 409);
    }
    productCodes.add(productCode);
    products.push(parsed.payload);
  }

  let admin;
  try {
    admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("b2b_products")
      .select("product_code")
      .in("product_code", [...productCodes]);
    if (existingError) return apiError("目前無法確認既有商品代碼。", 503);
    if ((existing ?? []).length > 0) {
      return apiError("CSV 中含有已存在的 product_code，整批未寫入。", 409);
    }

    const { data: inserted, error } = await admin.rpc("admin_insert_b2b_products_batch", {
      items: products,
    });
    if (error) {
      if (error.code === "23505") {
        return apiError("商品代碼已存在，整批未寫入。", 409);
      }
      return apiError("目前無法批量新增 B2B 商品。", 503);
    }

    return json({ created_count: inserted?.length ?? products.length, products: inserted ?? [] }, 201);
  } catch {
    return apiError("目前無法批量新增 B2B 商品。", 503);
  }
}
