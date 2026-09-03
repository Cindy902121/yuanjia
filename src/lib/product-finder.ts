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

export type B2bFinderQuestionKey = "primary_channel" | "channel_category";

export type B2bChannelCategory = { key: string; label: string };
export type B2bChannel = { categories?: B2bChannelCategory[]; key: string; label: string };

/**
 * B2B 需求篩選器的唯一前台分類字典。主通路只決定是否顯示第二層；
 * 查詢永遠以葉節點的固定通路標籤進行。
 */
export const B2B_FINDER_CHANNELS: B2bChannel[] = [
  { key: "wholesale", label: "盤商／批發", categories: [{ key: "wholesale_small", label: "小盤" }, { key: "wholesale_mid_large", label: "中大型盤商" }] },
  { key: "ecommerce", label: "電子商務", categories: [{ key: "ecommerce_group_buy", label: "團購" }, { key: "ecommerce_live", label: "直播" }, { key: "ecommerce_marketplace", label: "網購平台" }] },
  { key: "mass_retail", label: "量販／超市" },
  { key: "traditional_retail_specialty", label: "傳統零售／專賣", categories: [{ key: "traditional_market", label: "傳統菜市場" }, { key: "seafood_specialty_store", label: "海鮮專賣店" }] },
  { key: "foodservice", label: "餐飲", categories: [{ key: "foodservice_general", label: "一般餐飲" }, { key: "foodservice_chain", label: "連鎖" }, { key: "foodservice_banquet_catering", label: "宴會・外燴" }, { key: "foodservice_hotel", label: "飯店" }] },
];

const B2B_FINDER_LEAF_KEYS = B2B_FINDER_CHANNELS.flatMap((channel) => channel.categories?.map((category) => category.key) ?? [channel.key]);

export const B2B_FINDER_EVENT_OPTIONS = [
  ...B2B_FINDER_CHANNELS.map((channel) => ({ optionId: channel.key, questionKey: "primary_channel" as const })),
  ...B2B_FINDER_CHANNELS.flatMap((channel) => (channel.categories ?? []).map((category) => ({ optionId: category.key, questionKey: "channel_category" as const }))),
];

export const B2B_FINDER_CONDITIONS = Object.fromEntries(
  B2B_FINDER_LEAF_KEYS.map((key) => [key, { type: "tag" as const, value: key }]),
) as Record<string, { type: "tag"; value: string }>;

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
