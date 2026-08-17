import Link from "next/link";

export interface BreadcrumbSegment {
  label: string;
  /** 沒有 href 代表是目前頁面（附圖二參考的「藍字」那一段），不做成連結。 */
  href?: string;
}

/**
 * 路徑列（2026-08-17 使用者要求，參考附圖二）：首頁 > 商品列表 > 分類 > 商品名稱，
 * 最後一段是目前頁面，不可點擊、顏色跟其他段落區隔（用品牌藍，呼應附圖裡的藍字）。
 *
 * 用 <nav aria-label="breadcrumb"> + <ol> 是慣例作法，螢幕閱讀器會唸出「導覽，
 * 路徑」跟清單項目數，比純 <div> 一串文字對無障礙更友善。
 */
export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav aria-label="breadcrumb" className="text-sm text-ink-600">
      <ol className="flex flex-wrap items-center gap-1">
        {segments.map((segment, index) => (
          <li key={`${segment.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? (
              <span aria-hidden="true" className="text-ink-600/50">
                /
              </span>
            ) : null}
            {segment.href ? (
              <Link
                href={segment.href}
                className="hover:text-brand-ocean-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              >
                {segment.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-brand-ocean-700">
                {segment.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
