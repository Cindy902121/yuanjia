import type { SupabaseClient } from "@supabase/supabase-js";
import { attachProductTags, findProductIdsByTags } from "@/lib/catalog";
import type { ProductDetailData, ProductTagRef } from "@/lib/types/product";

/**
 * B2C 商品查詢層，接正式 Supabase `b2c_products`／`b2c_tags`／`b2c_product_tags`，
 * 取代原本 src/lib/fixtures/products.ts 的 fixture 資料（2026-08-17，C 的本週
 * 排程要求「將 /products 系列頁面從 fixture 改接 Supabase，先以目前 5 筆 seed
 * 作 MVP 驗收資料」）。
 *
 * 三個跟 fixture／已確認欄位規格（docs/b2c-product-field-spec-v1.md）對不上的
 * 落差，這裡用以下方式處理，不是憑空決定，是正式資料庫目前的真實狀態逼出來的
 * （查證見這次 session 的討論，不是猜的）：
 *
 * 1. **分類**：正式 schema 目前沒有 `b2c_categories`／`b2c_product_categories`
 *    這兩張多對多關聯表（查詢直接回「表不存在」），`b2c_products` 只有單一
 *    `category` 文字欄位（例如「魚類」）。這裡把它包成單一元素的 `categories`
 *    陣列（`{slug: category, name: category, isPrimary: true}`），直接拿中文
 *    文字當 slug——沒有另外做一份英文 slug 對照表，因為那張表不存在、值域也
 *    還在變動（C 這週會擴充商品），拿文字本身當 slug 最不會過時，之後真的有
 *    分類表了再換掉這裡就好，元件不用改。
 * 2. **shortDescription**：`b2c_products` 沒有 `short_description` 欄位（擴充
 *    欄位的 migration 還沒套用到正式資料庫），改用 `description` 截斷產生。
 * 3. **inventoryStatus**：沒有現成的 `inventory_status` 欄位，用
 *    `mock_inventory > 0` 現場算，邏輯跟原本規劃的資料庫 generated column
 *    一致，只是算在查詢層而不是資料庫層。
 *
 * `images`／`certifications` 維持空陣列——正式資料庫也沒有對應的表，跟 fixture
 * 時期的處理方式一致（不是這次新增的落差）。
 */

const B2C_PRODUCT_FIELDS =
  "id, slug, name, brand, category, specification, price, origin, storage_method, food_safety_info, quality_info, description, image_path, mock_inventory";

interface RawProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  specification: string;
  price: number | string;
  origin: string;
  storage_method: string;
  food_safety_info: string | null;
  quality_info: string | null;
  description: string;
  image_path: string | null;
  mock_inventory: number;
  tags?: Array<{ slug: string; name: string; group_name: string }>;
}

const TAG_TABLES = { tagTable: "b2c_tags", relationTable: "b2c_product_tags" } as const;

function toShortDescription(description: string): string {
  const trimmed = description.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

function mapRow(row: RawProductRow): ProductDetailData {
  const tags: ProductTagRef[] = (row.tags ?? []).map((tag) => ({
    slug: tag.slug,
    name: tag.name,
    groupName: tag.group_name,
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    currency: "TWD",
    shortDescription: toShortDescription(row.description),
    inventoryStatus: row.mock_inventory > 0 ? "in_stock" : "out_of_stock",
    coverImage: null,
    tags,
    brand: row.brand ?? "",
    specification: row.specification,
    origin: row.origin,
    storageMethod: row.storage_method,
    description: row.description,
    foodSafetyInfo: row.food_safety_info,
    qualityInfo: row.quality_info,
    categories: [{ slug: row.category, name: row.category, isPrimary: true }],
    images: [],
    certifications: [],
  };
}

/** 對應 /products：全部啟用商品，前端（ProductListWithFilters）自己做搜尋／篩選。 */
export async function getAllActiveProducts(
  client: SupabaseClient,
): Promise<ProductDetailData[]> {
  const { data, error } = await client
    .from("b2c_products")
    .select(B2C_PRODUCT_FIELDS)
    .eq("is_active", true)
    .order("name");

  if (error || !data) {
    return [];
  }

  const withTags = await attachProductTags(client, TAG_TABLES, data);
  return (withTags as RawProductRow[]).map(mapRow);
}

/** 對應 /products/[slug]。找不到或已下架回傳 null，頁面呼叫 notFound()。 */
export async function getProductBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<ProductDetailData | null> {
  const { data, error } = await client
    .from("b2c_products")
    .select(B2C_PRODUCT_FIELDS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const [withTags] = await attachProductTags(client, TAG_TABLES, [data]);
  return mapRow(withTags as RawProductRow);
}

/** 對應 /products/tags/[slug]。標籤不存在或沒有商品掛該標籤時回傳空陣列。 */
export async function getProductsByTagSlug(
  client: SupabaseClient,
  tagSlug: string,
): Promise<ProductDetailData[]> {
  const productIds = await findProductIdsByTags(client, TAG_TABLES, [tagSlug]);
  if (!productIds || productIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("b2c_products")
    .select(B2C_PRODUCT_FIELDS)
    .in("id", productIds)
    .eq("is_active", true)
    .order("name");

  if (error || !data) {
    return [];
  }

  const withTags = await attachProductTags(client, TAG_TABLES, data);
  return (withTags as RawProductRow[]).map(mapRow);
}

/** 對應 /products/categories/[slug]。slug 就是 category 文字本身，見檔頭說明。 */
export async function getProductsByCategory(
  client: SupabaseClient,
  category: string,
): Promise<ProductDetailData[]> {
  const { data, error } = await client
    .from("b2c_products")
    .select(B2C_PRODUCT_FIELDS)
    .eq("category", category)
    .eq("is_active", true)
    .order("name");

  if (error || !data) {
    return [];
  }

  const withTags = await attachProductTags(client, TAG_TABLES, data);
  return (withTags as RawProductRow[]).map(mapRow);
}

/**
 * 依 slug 查標籤名稱（給 /products/tags/[slug] 的頁面標題／metadata 用）。直接查
 * `b2c_tags`，不是像 fixture 時期那樣「找第一個有這個標籤的商品、從商品的標籤
 * 陣列裡撈名稱」——那種做法在標籤底下剛好 0 筆商品時會失效（撈不到名稱，退回顯示
 * slug 本身），直接查標籤表就沒有這個問題。
 */
export async function getTagBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<{ slug: string; name: string } | null> {
  const { data, error } = await client
    .from("b2c_tags")
    .select("slug, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/** 目前啟用商品裡出現過的所有分類值（依名稱排序），給分類篩選面板／快速分類卡用。 */
export async function getDistinctCategories(
  client: SupabaseClient,
): Promise<{ slug: string; name: string }[]> {
  const { data, error } = await client
    .from("b2c_products")
    .select("category")
    .eq("is_active", true);

  if (error || !data) {
    return [];
  }

  const seen = new Set<string>();
  for (const row of data as { category: string }[]) {
    seen.add(row.category);
  }

  return [...seen].sort().map((category) => ({ slug: category, name: category }));
}
