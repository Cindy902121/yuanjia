import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { CategoryOrTagPageSkeleton } from "@/components/editorial/Skeletons";

/**
 * /products/tags/[slug] 的 route-level loading 邊界（2026-09-01，
 * 9/1 B2C QA 排程）。見 src/components/editorial/Skeletons.tsx 檔頭說明；
 * 跟分類頁共用同一份骨架屏（兩頁版面結構幾乎一樣，見兩者 page.tsx）。
 */
export default function ProductTagLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />
      <CategoryOrTagPageSkeleton />
    </main>
  );
}
