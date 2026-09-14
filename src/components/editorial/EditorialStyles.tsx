/**
 * 淡入／圖片 hover 縮放的共用 CSS（原
 * design-preview/_components/EditorialStyles.tsx，2026-08-19 搬到這裡全站
 * 共用）。純 CSS，不需要是 Client Component，可以直接放在 Server Component
 * 頁面裡。
 */
export function EditorialStyles() {
  return (
    <style>{`
      .ep-fade-in { opacity: 0; transform: translate3d(0, 24px, 0); transition: opacity 0.72s var(--motion-ease-out), transform 0.72s var(--motion-ease-out); }
      .ep-fade-in.is-visible { opacity: 1; transform: translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .ep-fade-in { transition: none; }
      }
      .ep-hover-zoom { overflow: hidden; }
      .ep-hover-zoom img { transition: transform 0.7s var(--motion-ease-out), opacity 0.7s var(--motion-ease-out); }
      .ep-hover-zoom:hover img { transform: scale(1.06); }
    `}</style>
  );
}
