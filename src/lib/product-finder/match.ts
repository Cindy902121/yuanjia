import { products } from "@/lib/fixtures/products";
import type { ProductDetailData } from "@/lib/types/product";
import { FINDER_STEPS, type FinderOption } from "./config";

/**
 * 依已選答案（每步一個 option key，"any" 或未選代表不篩選）用 AND「全部符合」
 * 邏輯過濾本機 fixture 商品——跟 ProductListWithFilters 的篩選邏輯同一套規則
 * （PRD 5.3.2、FDD §4.6.2「多個答案轉為條件，採 AND」），只是這裡的條件來源
 * 是浮動工具的四步問答，不是使用者自己點的篩選面板。
 */
export function findProductsByAnswers(
  answers: Record<string, string | undefined>,
): ProductDetailData[] {
  const selectedOptions: FinderOption[] = [];

  for (const step of FINDER_STEPS) {
    const answerKey = answers[step.key];
    if (!answerKey || answerKey === "any") {
      continue;
    }
    const option = step.options.find((o) => o.key === answerKey);
    if (option) {
      selectedOptions.push(option);
    }
  }

  return products.filter((product) =>
    selectedOptions.every((option) => {
      if (option.tagSlug) {
        return product.tags.some((tag) => tag.slug === option.tagSlug);
      }
      if (option.categorySlug) {
        return product.categories.some((category) => category.slug === option.categorySlug);
      }
      return true;
    }),
  );
}
