import type { SupabaseClient } from "@supabase/supabase-js";

type CatalogTables = {
  tagTable: "b2c_tags" | "b2b_tags";
  relationTable: "b2c_product_tags" | "b2b_product_tags";
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
