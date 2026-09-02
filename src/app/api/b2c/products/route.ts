import { apiError, json, parseCsv } from "@/lib/api";
import { attachProductTags, findProductIdsByTags } from "@/lib/catalog";
import { attachProductImages } from "@/lib/product-images";
import { getB2bContext } from "@/lib/auth-context";

const B2C_PRODUCT_FIELDS =
  "id, slug, name, brand, category, specification, price, origin, storage_method, food_safety_info, quality_info, description, image_path, mock_inventory";

export async function GET(request: Request) {
  try {
    const context = await getB2bContext();
    if (context.databaseError) {
      return apiError("目前無法確認使用者權限。", 503);
    }
    if (context.company) {
      return apiError("企業 session 不可讀取 B2C 商品。", 403);
    }

    const url = new URL(request.url);
    const supabase = context.supabase;
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
    const productsWithImages = await attachProductImages(
      supabase,
      "b2c",
      productsWithTags,
    );

    return json({ products: productsWithImages });
  } catch {
    return apiError("目前無法讀取 B2C 商品。", 503);
  }
}
