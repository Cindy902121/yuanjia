import { apiError, json } from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import { attachProductTags, findProductIdsByTags } from "@/lib/catalog";
import {
  B2C_FINDER_CONDITIONS,
  parseFinderConditions,
} from "@/lib/product-finder";
import { attachProductImages } from "@/lib/product-images";
import { createClient as createServerClient } from "@/lib/supabase/server";

const B2C_PRODUCT_FIELDS =
  "id, slug, name, brand, category, specification, price, origin, storage_method, food_safety_info, quality_info, description, image_path, mock_inventory";

export async function GET(request: Request) {
  const context = await getB2bContext();
  if (context.databaseError) {
    return apiError("目前無法確認使用者狀態。", 503);
  }
  if (context.company) {
    return apiError("企業 session 不使用 B2C 需求篩選器。", 403);
  }

  const url = new URL(request.url);
  const conditions = parseFinderConditions(
    url.searchParams.get("conditions"),
    B2C_FINDER_CONDITIONS,
  );
  if (!conditions) {
    return apiError("需求條件不在允許範圍內。", 400);
  }

  try {
    const supabase = await createServerClient();
    const tagSlugs = conditions
      .filter((condition) => condition.type === "tag")
      .map((condition) => condition.value);
    const productIds = await findProductIdsByTags(
      supabase,
      { tagTable: "b2c_tags", relationTable: "b2c_product_tags" },
      tagSlugs,
    );

    let query = supabase
      .from("b2c_products")
      .select(B2C_PRODUCT_FIELDS)
      .eq("is_active", true)
      .order("name");

    if (productIds) {
      if (productIds.length === 0) {
        return json({ conditions: conditions.map(({ key }) => key), products: [] });
      }
      query = query.in("id", productIds);
    }

    const categories = conditions
      .filter((condition) => condition.type === "category")
      .map((condition) => condition.value);
    if (categories.length > 1) {
      return json({ conditions: conditions.map(({ key }) => key), products: [] });
    }
    if (categories[0]) {
      query = query.eq("category", categories[0]);
    }

    const { data: products, error } = await query;
    if (error) {
      return apiError("目前無法執行 B2C 需求篩選。", 503);
    }

    const productsWithTags = await attachProductTags(
      supabase,
      { tagTable: "b2c_tags", relationTable: "b2c_product_tags" },
      products ?? [],
    );
    const productsWithImages = await attachProductImages(
      supabase,
      "b2c",
      productsWithTags,
    );

    return json({
      conditions: conditions.map(({ key }) => key),
      products: productsWithImages,
    });
  } catch {
    return apiError("目前無法執行 B2C 需求篩選。", 503);
  }
}
