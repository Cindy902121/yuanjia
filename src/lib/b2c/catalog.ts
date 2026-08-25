import { attachProductTags, findProductIdsByTags } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import type {
  ProductDetailData,
} from "@/lib/types/product";

type ProductCategoryOption = { slug: string; name: string; sortOrder: number };

const B2C_PRODUCT_FIELDS =
  "id, slug, name, brand, category, specification, price, origin, storage_method, description, food_safety_info, quality_info, mock_inventory, image_path, is_active";

const CATEGORY_OPTIONS: ProductCategoryOption[] = [
  { slug: "shrimp-and-crab", name: "蝦蟹類", sortOrder: 10 },
  { slug: "fish", name: "魚類", sortOrder: 20 },
  { slug: "shellfish", name: "貝類", sortOrder: 30 },
  { slug: "cephalopods", name: "軟體類", sortOrder: 40 },
  { slug: "meat", name: "肉類", sortOrder: 50 },
  { slug: "prepared-food", name: "調理食品", sortOrder: 60 },
];

type B2CProductRow = {
  brand: string;
  category: string;
  description: string;
  food_safety_info: string | null;
  id: string;
  image_path: string | null;
  is_active: boolean;
  mock_inventory: number;
  name: string;
  origin: string;
  price: number;
  quality_info: string | null;
  slug: string;
  specification: string;
  storage_method: string;
};

function categoryForName(name: string) {
  return CATEGORY_OPTIONS.find((category) => category.name === name) ?? {
    slug: name,
    name,
    sortOrder: 999,
  };
}

function toProduct(row: B2CProductRow & { tags: Array<{ group_name: string; id: string; name: string; slug: string }> }): ProductDetailData {
  const category = categoryForName(row.category);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    currency: "TWD",
    shortDescription: row.description,
    inventoryStatus: row.mock_inventory > 0 ? "in_stock" : "out_of_stock",
    coverImage: row.image_path ? { url: row.image_path, alt: row.name } : null,
    tags: row.tags.map((tag) => ({ slug: tag.slug, name: tag.name, groupName: tag.group_name })),
    brand: row.brand,
    specification: row.specification,
    origin: row.origin,
    storageMethod: row.storage_method,
    description: row.description,
    foodSafetyInfo: row.food_safety_info,
    qualityInfo: row.quality_info,
    categories: [{ slug: category.slug, name: category.name, isPrimary: true }],
    images: row.image_path ? [{ url: row.image_path, alt: row.name, role: "cover", sortOrder: 0 }] : [],
    certifications: [],
  };
}

export type B2CQuery = {
  brand?: string;
  category?: string;
  search?: string;
  tagSlugs?: string[];
};

export async function getB2CCatalog(query: B2CQuery = {}) {
  const client = await createClient();
  const productIds = await findProductIdsByTags(
    client,
    { tagTable: "b2c_tags", relationTable: "b2c_product_tags" },
    query.tagSlugs ?? [],
  );

  let productsQuery = client
    .from("b2c_products")
    .select(B2C_PRODUCT_FIELDS)
    .eq("is_active", true)
    .order("name");

  if (productIds) {
    if (productIds.length === 0) return { products: [], categories: CATEGORY_OPTIONS };
    productsQuery = productsQuery.in("id", productIds);
  }
  if (query.brand) productsQuery = productsQuery.eq("brand", query.brand);
  if (query.category) {
    const category = CATEGORY_OPTIONS.find((item) => item.slug === query.category);
    productsQuery = productsQuery.eq("category", category?.name ?? query.category);
  }
  if (query.search) {
    const term = query.search.trim();
    productsQuery = productsQuery.or(`name.ilike.%${term}%,slug.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await productsQuery;
  if (error) throw new Error(error.message);
  const productsWithTags = await attachProductTags(
    client,
    { tagTable: "b2c_tags", relationTable: "b2c_product_tags" },
    (data ?? []) as Array<{ id: string }>,
  );
  const products = productsWithTags.map((row) => toProduct(row as B2CProductRow & { tags: Array<{ group_name: string; id: string; name: string; slug: string }> }));
  return { products, categories: CATEGORY_OPTIONS };
}

export async function getB2CProductBySlug(slug: string) {
  const result = await getB2CCatalog();
  return result.products.find((product) => product.slug === slug);
}

export async function getB2CProductsByCategorySlug(slug: string) {
  return (await getB2CCatalog({ category: slug })).products;
}
