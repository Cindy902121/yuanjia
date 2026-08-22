import type { SupabaseClient } from "@supabase/supabase-js";

type CatalogTables = {
  tagTable: "b2c_tags" | "b2b_tags";
  relationTable: "b2c_product_tags" | "b2b_product_tags";
};

const B2B_SPEC_OPTION_FIELDS =
  "id, product_id, option_code, specification_text, packaging_text, is_active, display_order";

export type B2BProductSpecOptionRow = {
  display_order: number;
  id: string;
  is_active: boolean;
  option_code: string;
  packaging_text: string;
  product_id: string;
  specification_text: string;
};

export async function findProductIdsByTags(
  client: SupabaseClient,
  tables: CatalogTables,
  tagSlugs: string[],
) {
  if (tagSlugs.length === 0) {
    return null;
  }

  const productIdsByTag = await Promise.all(
    tagSlugs.map(async (slug) => {
      const { data: tag, error: tagError } = await client
        .from(tables.tagTable)
        .select("id")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (tagError) {
        throw new Error(tagError.message);
      }

      if (!tag) {
        return [];
      }

      const { data: relations, error: relationError } = await client
        .from(tables.relationTable)
        .select("product_id")
        .eq("tag_id", tag.id);

      if (relationError) {
        throw new Error(relationError.message);
      }

      return (relations ?? []).map((relation) => relation.product_id as string);
    }),
  );

  const [first, ...rest] = productIdsByTag;
  return (first ?? []).filter((productId) =>
    rest.every((ids) => ids.includes(productId)),
  );
}

export async function attachProductTags(
  client: SupabaseClient,
  tables: CatalogTables,
  products: Array<{ id: string }>,
) {
  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const { data: relations, error: relationError } = await client
    .from(tables.relationTable)
    .select("product_id, tag_id")
    .in("product_id", productIds);

  if (relationError) {
    throw new Error(relationError.message);
  }

  const tagIds = [...new Set((relations ?? []).map((relation) => relation.tag_id))];
  const { data: tags, error: tagError } =
    tagIds.length > 0
      ? await client
          .from(tables.tagTable)
          .select("id, slug, name, group_name")
          .in("id", tagIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (tagError) {
    throw new Error(tagError.message);
  }

  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag]));
  const tagsByProduct = new Map<string, unknown[]>();

  for (const relation of relations ?? []) {
    const tag = tagById.get(relation.tag_id);
    if (!tag) {
      continue;
    }

    const current = tagsByProduct.get(relation.product_id) ?? [];
    current.push(tag);
    tagsByProduct.set(relation.product_id, current);
  }

  return products.map((product) => ({
    ...product,
    tags: tagsByProduct.get(product.id) ?? [],
  }));
}

export async function attachB2bProductSpecOptions<T extends { id: string }>(
  client: SupabaseClient,
  products: T[],
) {
  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const { data: options, error } = await client
    .from("b2b_product_spec_options")
    .select(B2B_SPEC_OPTION_FIELDS)
    .in("product_id", productIds)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("option_code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const optionsByProduct = new Map<string, B2BProductSpecOptionRow[]>();
  for (const option of options ?? []) {
    const current = optionsByProduct.get(option.product_id) ?? [];
    current.push(option as B2BProductSpecOptionRow);
    optionsByProduct.set(option.product_id, current);
  }

  return products.map((product) => ({
    ...product,
    specification_options: optionsByProduct.get(product.id) ?? [],
  }));
}
