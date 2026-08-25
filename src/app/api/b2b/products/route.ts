import { apiError, json, parseCsv } from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import {
  attachB2bProductSpecOptions,
  attachProductTags,
  findProductIdsByTags,
} from "@/lib/catalog";
import { attachProductImages } from "@/lib/product-images";

const B2B_PRODUCT_FIELDS =
  "id, product_code, name, brand, category, specification, packaging, origin, storage_method, description, image_path";

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

  try {
    const url = new URL(request.url);
    const tagSlugs = parseCsv(
      url.searchParams.get("tags") ?? url.searchParams.get("tag"),
    );
    const productIds = await findProductIdsByTags(
      context.supabase,
      { tagTable: "b2b_tags", relationTable: "b2b_product_tags" },
      tagSlugs,
    );

    let query = context.supabase
      .from("b2b_products")
      .select(B2B_PRODUCT_FIELDS)
      .eq("is_active", true)
      .order("name");

    const search = url.searchParams.get("q")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const brand = url.searchParams.get("brand")?.trim();
    const productCode = url.searchParams.get("product_code")?.trim();

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
    if (productCode) {
      query = query.eq("product_code", productCode);
    }

    const { data: products, error } = await query;
    if (error) {
      return apiError("目前無法讀取 B2B 型錄。", 503);
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

    return json({ products: productsWithImages });
  } catch {
    return apiError("目前無法讀取 B2B 型錄。", 503);
  }
}
