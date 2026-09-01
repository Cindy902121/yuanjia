import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { CategoryOrTagPageSkeleton } from "@/components/editorial/Skeletons";

/**
 * /products/categories/[slug] 的 route-level loading 邊界（2026-09-01，
 * 9/1 B2C QA 排程）。見 src/components/editorial/Skeletons.tsx 檔頭說明。
 */
export default function ProductCategoryLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <EditorialStyles />
      <CategoryOrTagPageSkeleton />
    </main>
  );
}
