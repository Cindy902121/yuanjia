import { createAdminClient } from "@/lib/supabase/admin";
import { attachB2bProductSpecOptions, type B2BProductSpecOptionRow } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export type B2BTag = {
  groupName: string;
  id: string;
  name: string;
  slug: string;
};

export type B2BSpecOption = {
  displayOrder: number;
  id: string;
  isActive: boolean;
  optionCode: string;
  packagingText: string;
  productId: string;
  specificationText: string;
};

export type B2BProduct = {
  brand: string;
  category: string;
  description: string;
  id: string;
  imagePath: string | null;
  name: string;
  origin: string;
  packaging: string | null;
  productCode: string;
  specification: string;
  specificationOptions: B2BSpecOption[];
  storageMethod: string;
  tags: B2BTag[];
};

type ProductRow = {
  brand: string;
  b2b_product_tags: Array<{
    b2b_tags: Array<{
      group_name: string;
      id: string;
      is_active: boolean;
      name: string;
      slug: string;
    }>;
  }>;
  category: string;
  description: string;
  id: string;
  image_path: string | null;
  name: string;
  origin: string;
  packaging: string | null;
  product_code: string;
  specification: string;
  storage_method: string;
};

export type B2BCatalogData = {
  brands: string[];
  categories: string[];
  products: B2BProduct[];
  tags: B2BTag[];
};

function toProduct(row: ProductRow): B2BProduct {
  return {
    brand: row.brand,
    category: row.category,
    description: row.description,
    id: row.id,
    imagePath: row.image_path,
    name: row.name,
    origin: row.origin,
    packaging: row.packaging,
    productCode: row.product_code,
    specification: row.specification,
    specificationOptions: [],
    storageMethod: row.storage_method,
    tags: row.b2b_product_tags
      .flatMap((relation) => relation.b2b_tags)
      .filter((tag) => tag.is_active)
      .map((tag) => ({
        groupName: tag.group_name,
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
  };
}

function toSpecOption(row: B2BProductSpecOptionRow): B2BSpecOption {
  return {
    displayOrder: row.display_order,
    id: row.id,
    isActive: row.is_active,
    optionCode: row.option_code,
    packagingText: row.packaging_text,
    productId: row.product_id,
    specificationText: row.specification_text,
  };
}

export async function getB2BCatalogData(): Promise<B2BCatalogData> {
  const sessionClient = await createClient();
  const { data: claimsResult } = await sessionClient.auth.getClaims();
  const userId = claimsResult?.claims?.sub;

  if (!userId) {
    return { brands: [], categories: [], products: [], tags: [] };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("b2b_products")
    .select(
      "id, product_code, name, brand, category, specification, packaging, origin, storage_method, description, image_path, b2b_product_tags(b2b_tags(id, group_name, slug, name, is_active))",
    )
    .eq("is_active", true)
    .order("product_code");

  if (error) {
    throw new Error("Unable to load B2B catalog.");
  }

  const baseProducts = (data as unknown as ProductRow[]).map(toProduct);
  const productsWithOptions = await attachB2bProductSpecOptions(adminClient, baseProducts);
  const products = productsWithOptions.map(({ specification_options, ...product }) => ({
    ...product,
    specificationOptions: specification_options.map(toSpecOption),
  }));
  const tags = [...new Map(products.flatMap((product) => product.tags).map((tag) => [tag.slug, tag])).values()]
    .sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name));

  return {
    brands: [...new Set(products.map((product) => product.brand))].sort(),
    categories: [...new Set(products.map((product) => product.category))].sort(),
    products,
    tags,
  };
}

export async function getB2BAccess() {
  const sessionClient = await createClient();
  const { data: claimsResult } = await sessionClient.auth.getClaims();
  const userId = claimsResult?.claims?.sub;

  if (!userId) {
    return { role: "anonymous" as const };
  }

  const adminClient = createAdminClient();
  const [{ data: admin, error: adminError }, { data: company, error: companyError }] = await Promise.all([
    adminClient.from("app_admins").select("is_active").eq("user_id", userId).maybeSingle(),
    adminClient
      .from("companies")
      .select("id, is_active, name")
      .eq("auth_user_id", userId)
      .maybeSingle(),
  ]);

  if (adminError || companyError) {
    throw new Error("Unable to verify B2B access.");
  }

  if (admin?.is_active) {
    return { role: "admin" as const };
  }

  if (!company?.is_active) {
    return { role: "b2c" as const };
  }

  return { companyName: company.name, role: "b2b" as const };
}
