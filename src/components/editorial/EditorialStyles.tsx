/**
 * 淡入／圖片 hover 縮放的共用 CSS（原
 * design-preview/_components/EditorialStyles.tsx，2026-08-19 搬到這裡全站
 * 共用）。純 CSS，不需要是 Client Component，可以直接放在 Server Component
 * 頁面裡。
 */
export function EditorialStyles() {
  return (
    <style>{`
      .ep-fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.9s ease, transform 0.9s ease; }
      .ep-fade-in.is-visible { opacity: 1; transform: translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .ep-fade-in { transition: none; }
      }
      .ep-hover-zoom { overflow: hidden; }
      .ep-hover-zoom img { transition: transform 0.7s ease, opacity 0.7s ease; }
      .ep-hover-zoom:hover img { transform: scale(1.06); }
    `}</style>
  );
}
