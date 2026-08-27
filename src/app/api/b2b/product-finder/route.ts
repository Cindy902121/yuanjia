import { apiError, json } from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import {
  attachB2bProductSpecOptions,
  attachProductTags,
  findProductIdsByTags,
} from "@/lib/catalog";
import {
  B2B_FINDER_CONDITIONS,
  parseFinderConditions,
} from "@/lib/product-finder";
import { attachProductImages } from "@/lib/product-images";

const B2B_PRODUCT_FIELDS =
  "id, product_code, name, brand, category, specification, packaging, origin, storage_method, description";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const conditions = parseFinderConditions(
    url.searchParams.get("conditions"),
    B2B_FINDER_CONDITIONS,
  );
  if (!conditions) {
    return apiError("需求條件不在允許範圍內。", 400);
  }

  try {
    const tagSlugs = conditions
      .filter((condition) => condition.type === "tag")
      .map((condition) => condition.value);
    const productIds = await findProductIdsByTags(
      context.supabase,
      { tagTable: "b2b_tags", relationTable: "b2b_product_tags" },
      tagSlugs,
    );

    let query = context.supabase
      .from("b2b_products")
      .select(B2B_PRODUCT_FIELDS)
      .eq("status", "published")
      .order("name");

    if (productIds) {
      if (productIds.length === 0) {
        return json({ conditions: conditions.map(({ key }) => key), products: [] });
      }
      query = query.in("id", productIds);
    }

    const specification = conditions.find(
      (condition) => condition.type === "specification",
    );
    if (specification) {
      query = query.or(
        `specification.ilike.%${specification.value}%,packaging.ilike.%${specification.value}%`,
      );
    }

    const { data: products, error } = await query;
    if (error) {
      return apiError("目前無法執行 B2B 需求篩選。", 503);
    }

    const productsWithTags = await attachProductTags(
      context.supabase,
      { tagTable: "b2b_tags", relationTable: "b2b_product_tags" },
      products ?? [],
    );
    const productsWithTagsAndOptions = await attachB2bProductSpecOptions(
      context.supabase,
      productsWithTags,
    );
    const productsWithImages = await attachProductImages(
      context.supabase,
      "b2b",
      productsWithTagsAndOptions,
    );

    return json({
      conditions: conditions.map(({ key }) => key),
      products: productsWithImages,
    });
  } catch {
    return apiError("目前無法執行 B2B 需求篩選。", 503);
  }
}
