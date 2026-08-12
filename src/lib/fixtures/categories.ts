/**
 * B2C 正式分類清單。
 *
 * 依 docs/b2c-product-field-spec-v1.md §4（已確認版本），對應 GitHub Draft PR #1
 * 的 `b2c_categories` 種子資料（見 §6.0 C1／C8）。PR #1 尚未合併、尚未套用到遠端
 * 資料庫，這份清單目前只給前端本機開發用（分類篩選、之後的 /products/categories/[slug]）。
 */

export interface ProductCategoryOption {
  slug: string;
  name: string;
  sortOrder: number;
}

export const categories: ProductCategoryOption[] = [
  { slug: "shrimp-and-crab", name: "蝦蟹類", sortOrder: 10 },
  { slug: "fish", name: "魚類", sortOrder: 20 },
  { slug: "shellfish", name: "貝類", sortOrder: 30 },
  { slug: "cephalopods", name: "軟體類", sortOrder: 40 },
  { slug: "meat", name: "肉類", sortOrder: 50 },
  { slug: "prepared-food", name: "調理食品", sortOrder: 60 },
];
