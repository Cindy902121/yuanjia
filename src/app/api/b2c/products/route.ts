import { apiError, json, parseCsv } from "@/lib/api";
import { attachProductTags, findProductIdsByTags } from "@/lib/catalog";
import { createClient as createServerClient } from "@/lib/supabase/server";

const B2C_PRODUCT_FIELDS =
  "id, slug, name, brand, category, specification, price, origin, storage_method, food_safety_info, quality_info, description, image_path, mock_inventory";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const supabase = await createServerClient();
    const tagSlugs = parseCsv(
      url.searchParams.get("tags") ?? url.searchParams.get("tag"),
    );
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

    const search = url.searchParams.get("q")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const brand = url.searchParams.get("brand")?.trim();

    if (productIds) {
      if (productIds.length === 0) {
        return json({ products: [] });
      }
      query = query.in("id", productIds);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (brand) {
      query = query.eq("brand", brand);
    }

    const { data: products, error } = await query;
    if (error) {
      return apiError("目前無法讀取 B2C 商品。", 503);
    }

    const productsWithTags = await attachProductTags(
      supabase,
      { tagTable: "b2c_tags", relationTable: "b2c_product_tags" },
      products ?? [],
    );

    return json({ products: productsWithTags });
  } catch {
    return apiError("目前無法讀取 B2C 商品。", 503);
  }
}
