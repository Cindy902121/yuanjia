import {
  apiError,
  isNonEmptyString,
  isUuid,
  json,
  parsePositiveNumber,
  readJson,
} from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import { resolveCustomerSnapshot } from "@/lib/customer-rules";
import { isAllowedRfqUnit } from "@/lib/analytics-events";
import { createAdminClient } from "@/lib/supabase/admin";

type RfqItemInput = {
  product_id?: unknown;
  specification_option_id?: unknown;
  other_specification?: unknown;
  other_packaging?: unknown;
  quantity?: unknown;
  unit?: unknown;
  item_note?: unknown;
};

type ParsedRfqItem = {
  product_id: string;
  specification_option_id: string | null;
  other_specification: string | null;
  other_packaging: string | null;
  quantity: number;
  unit: string;
  item_note: string | null;
};

type RfqBody = {
  items?: unknown;
  total_note?: unknown;
};

function getOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (!isNonEmptyString(value) || value.trim().length > maxLength) {
    return undefined;
  }
  return value.trim();
}

function getItemNote(value: unknown) {
  return getOptionalText(value, 1000);
}

export async function GET() {
  const context = await getB2bContext();

  if (!context.user) {
    return apiError("請先登入企業帳號。", 401);
  }
  if (context.databaseError) {
    return apiError("目前無法確認企業權限。", 503);
  }
  if (!context.company) {
    return apiError("此帳號沒有可用的企業權限。", 403);
  }

  const { data: rfqs, error: rfqError } = await context.supabase
    .from("b2b_rfqs")
    .select(
      "id, company_id, customer_tier_snapshot, channel_snapshot, status, total_note, created_at, updated_at",
    )
    .eq("company_id", context.company.id)
    .order("created_at", { ascending: false });

  if (rfqError) {
    return apiError("目前無法讀取詢價紀錄。", 503);
  }

  const rfqIds = (rfqs ?? []).map((rfq) => rfq.id);
  if (rfqIds.length === 0) {
    return json({ rfqs: [] });
  }

  const { data: items, error: itemError } = await context.supabase
    .from("b2b_rfq_items")
    .select(
      "id, rfq_id, product_id, specification_option_id, other_specification, other_packaging, specification_text_snapshot, packaging_text_snapshot, quantity, unit, item_note, created_at",
    )
    .in("rfq_id", rfqIds);

  if (itemError) {
    return apiError("目前無法讀取詢價品項。", 503);
  }

  const itemsByRfq = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const current = itemsByRfq.get(item.rfq_id) ?? [];
    current.push(item);
    itemsByRfq.set(item.rfq_id, current);
  }

  return json({
    rfqs: (rfqs ?? []).map((rfq) => ({
      ...rfq,
      items: itemsByRfq.get(rfq.id) ?? [],
    })),
  });
}

export async function POST(request: Request) {
  const context = await getB2bContext();

  if (!context.user) {
    return apiError("請先登入企業帳號。", 401);
  }
  if (context.databaseError) {
    return apiError("目前無法確認企業權限。", 503);
  }
  if (!context.company) {
    return apiError("此帳號沒有可用的企業權限。", 403);
  }

  const body = (await readJson(request)) as RfqBody | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return apiError("詢價至少需要一項商品。", 400);
  }
  if (body.items.length > 100) {
    return apiError("單次詢價品項不可超過 100 項。", 400);
  }

  const seenSelectionKeys = new Set<string>();
  const parsedItems: ParsedRfqItem[] = [];

  for (const rawItem of body.items as RfqItemInput[]) {
    if (!isUuid(rawItem.product_id)) {
      return apiError("詢價商品資料不正確。", 400);
    }
    if (!isAllowedRfqUnit(rawItem.unit)) {
      return apiError("詢價單位不在允許範圍內。", 400);
    }

    let specificationOptionId: string | null = null;
    if (
      rawItem.specification_option_id !== undefined &&
      rawItem.specification_option_id !== null &&
      rawItem.specification_option_id !== ""
    ) {
      if (!isUuid(rawItem.specification_option_id)) {
        return apiError("詢價規格選項不正確。", 400);
      }
      specificationOptionId = rawItem.specification_option_id;
    }

    const quantity = parsePositiveNumber(rawItem.quantity);
    const itemNote = getItemNote(rawItem.item_note);
    const otherSpecification = getOptionalText(
      rawItem.other_specification,
      500,
    );
    const otherPackaging = getOptionalText(rawItem.other_packaging, 500);

    if (
      quantity === null ||
      itemNote === undefined ||
      otherSpecification === undefined ||
      otherPackaging === undefined
    ) {
      return apiError("詢價品項資料不正確。", 400);
    }

    const hasOtherText =
      otherSpecification !== null || otherPackaging !== null;
    if (specificationOptionId === null && !hasOtherText) {
      return apiError("請選擇規格，或填寫其他規格／其他包裝。", 400);
    }
    if (specificationOptionId !== null && hasOtherText) {
      return apiError("標準規格與其他規格不可同時填寫。", 400);
    }

    const selectionKey = specificationOptionId
      ? `option:${specificationOptionId}`
      : `other:${otherSpecification ?? ""}:${otherPackaging ?? ""}`;
    const duplicateKey = `${rawItem.product_id}:${selectionKey}`;
    if (seenSelectionKeys.has(duplicateKey)) {
      return apiError("同一商品不可重複送出相同規格。", 400);
    }
    seenSelectionKeys.add(duplicateKey);

    parsedItems.push({
      product_id: rawItem.product_id,
      specification_option_id: specificationOptionId,
      other_specification: otherSpecification,
      other_packaging: otherPackaging,
      quantity,
      unit: rawItem.unit,
      item_note: itemNote,
    });
  }

  const { data: products, error: productError } = await context.supabase
    .from("b2b_products")
    .select("id")
    .in("id", parsedItems.map((item) => item.product_id))
    .eq("is_active", true);

  if (productError) {
    return apiError("目前無法驗證詢價商品。", 503);
  }
  if ((products ?? []).length !== new Set(parsedItems.map((item) => item.product_id)).size) {
    return apiError("詢價只能包含目前啟用的 B2B 商品。", 400);
  }

  const optionIds = [
    ...new Set(
      parsedItems
        .map((item) => item.specification_option_id)
        .filter((optionId): optionId is string => optionId !== null),
    ),
  ];
  const { data: options, error: optionError } =
    optionIds.length > 0
      ? await context.supabase
          .from("b2b_product_spec_options")
          .select("id, product_id, specification_text, packaging_text")
          .in("id", optionIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (optionError) {
    return apiError("目前無法驗證詢價規格。", 503);
  }
  if ((options ?? []).length !== optionIds.length) {
    return apiError("詢價只能包含目前啟用的規格選項。", 400);
  }

  const optionById = new Map((options ?? []).map((option) => [option.id, option]));
  for (const item of parsedItems) {
    if (item.specification_option_id === null) {
      continue;
    }
    const option = optionById.get(item.specification_option_id);
    if (!option || option.product_id !== item.product_id) {
      return apiError("規格選項與商品不相符。", 400);
    }
  }

  const items = parsedItems.map((item) => {
    const option = item.specification_option_id
      ? optionById.get(item.specification_option_id)
      : null;
    return {
      ...item,
      specification_text_snapshot:
        option?.specification_text ?? item.other_specification,
      packaging_text_snapshot: option?.packaging_text ?? item.other_packaging,
    };
  });

  let snapshot;
  try {
    snapshot = await resolveCustomerSnapshot(context.company.client_code);
  } catch {
    return apiError("目前無法建立客戶級距快照。", 503);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: rfq, error: rfqError } = await admin
    .from("b2b_rfqs")
    .insert({
      company_id: context.company.id,
      customer_tier_snapshot: snapshot.customerTierSnapshot,
      channel_snapshot: snapshot.channelSnapshot,
      total_note:
        body.total_note === undefined || body.total_note === null
          ? null
          : isNonEmptyString(body.total_note) && body.total_note.trim().length <= 2000
            ? body.total_note.trim()
            : null,
    })
    .select("id, status")
    .single();

  if (rfqError || !rfq) {
    return apiError("目前無法建立詢價單。", 503);
  }

  const { error: itemError } = await admin
    .from("b2b_rfq_items")
    .insert(items.map((item) => ({ ...item, rfq_id: rfq.id })));

  if (itemError) {
    await admin.from("b2b_rfqs").delete().eq("id", rfq.id);
    return apiError("目前無法建立詢價品項。", 503);
  }

  return json({ rfqId: rfq.id, status: rfq.status }, 201);
}
