export const B2C_FINDER_CONDITIONS = {
  "hot-pot": { type: "tag", value: "hot-pot" },
  "pan-fry": { type: "tag", value: "pan-fry" },
  "air-fry": { type: "tag", value: "air-fry" },
  steam: { type: "tag", value: "steam" },
  soup: { type: "tag", value: "soup" },
  raw: { type: "tag", value: "raw" },
  "easy-cook": { type: "tag", value: "easy-cook" },
  boneless: { type: "tag", value: "boneless" },
  "high-protein": { type: "tag", value: "high-protein" },
  "kid-friendly": { type: "tag", value: "kid-friendly" },
  "right-portion": { type: "tag", value: "right-portion" },
  fish: { type: "category", value: "魚類" },
  shrimp: { type: "category", value: "蝦類" },
  shellfish: { type: "category", value: "貝類" },
  "other-seafood": { type: "category", value: "其他海鮮" },
  plain: { type: "tag", value: "plain" },
  seasoned: { type: "tag", value: "seasoned" },
  "ready-to-cook": { type: "tag", value: "ready-to-cook" },
} as const;

export const B2B_FINDER_CONDITIONS = {
  "b2b-fish": { type: "tag", value: "b2b-fish" },
  "b2b-shrimp": { type: "tag", value: "b2b-shrimp" },
  "b2b-shellfish": { type: "tag", value: "b2b-shellfish" },
  "processed-food": { type: "tag", value: "processed-food" },
  "raw-material": { type: "tag", value: "raw-material" },
  "whole-fish": { type: "tag", value: "whole-fish" },
  fillet: { type: "tag", value: "fillet" },
  "cut-piece": { type: "tag", value: "cut-piece" },
  seasoned: { type: "tag", value: "seasoned" },
  restaurant: { type: "tag", value: "restaurant" },
  retail: { type: "tag", value: "retail" },
  "bulk-supply": { type: "tag", value: "bulk-supply" },
  frozen: { type: "tag", value: "frozen" },
  "pack-5kg": { type: "specification", value: "5kg/箱" },
  "pack-10kg": { type: "specification", value: "10kg/箱" },
} as const;

export const B2B_FINDER_CHANNELS = {
  wholesale: {
    label: "盤商／批發",
    categories: {
      wholesale_small: { label: "小盤", tagSlug: "wholesale_small" },
      wholesale_mid_large: { label: "中大型盤商", tagSlug: "wholesale_mid_large" },
    },
  },
  ecommerce: {
    label: "電子商務",
    categories: {
      ecommerce_group_buy: { label: "團購", tagSlug: "ecommerce_group_buy" },
      ecommerce_live: { label: "直播", tagSlug: "ecommerce_live" },
      ecommerce_marketplace: { label: "網購平台", tagSlug: "ecommerce_marketplace" },
    },
  },
  mass_retail: { label: "量販／超市", tagSlug: "mass_retail" },
  traditional_retail_specialty: {
    label: "傳統零售／專賣",
    categories: {
      traditional_market: { label: "傳統菜市場", tagSlug: "traditional_market" },
      seafood_specialty_store: { label: "海鮮專賣店", tagSlug: "seafood_specialty_store" },
    },
  },
  foodservice: {
    label: "餐飲",
    categories: {
      foodservice_general: { label: "一般餐飲", tagSlug: "foodservice_general" },
      foodservice_chain: { label: "連鎖", tagSlug: "foodservice_chain" },
      foodservice_banquet_catering: {
        label: "宴會・外燴",
        tagSlug: "foodservice_banquet_catering",
      },
      foodservice_hotel: { label: "飯店", tagSlug: "foodservice_hotel" },
    },
  },
} as const;

export function parseB2bChannelSelection(
  channel: string | null,
  category: string | null,
) {
  if (!channel) return null;

  const channelKey = channel as keyof typeof B2B_FINDER_CHANNELS;
  const channelDefinition = B2B_FINDER_CHANNELS[channelKey];
  if (!channelDefinition) return null;

  if ("tagSlug" in channelDefinition) {
    return category
      ? null
      : { channel: channelKey, category: null, tagSlug: channelDefinition.tagSlug };
  }

  if (!category || !("categories" in channelDefinition)) return null;
  const categoryDefinition = Object.values(channelDefinition.categories).find(
    (definition) => definition.tagSlug === category,
  );
  return categoryDefinition
    ? { channel: channelKey, category, tagSlug: categoryDefinition.tagSlug }
    : null;
}

export function parseFinderConditions(
  raw: string | null,
  definitions:
    | typeof B2C_FINDER_CONDITIONS
    | typeof B2B_FINDER_CONDITIONS,
) {
  const keys = [
    ...new Set(
      (raw ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item && item !== "any"),
    ),
  ];

  const conditions = keys.map((key) => {
    const condition = definitions[key as keyof typeof definitions];
    return condition ? { key, ...condition } : null;
  });

  if (conditions.some((condition) => condition === null)) {
    return null;
  }

  return conditions as Array<{
    key: string;
    type: "tag" | "category" | "specification";
    value: string;
  }>;
}
