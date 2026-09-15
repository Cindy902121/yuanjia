export type ProductAnnouncement = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
};

/**
 * 商品頁的展示公告資料。
 *
 * 只放品牌內容與導流，不捏造折扣、價格、日期或滿額門檻；
 * 需要接正式活動資料時，可直接替換這份陣列，不必改公告元件。
 */
export const PRODUCT_ANNOUNCEMENTS: ProductAnnouncement[] = [
  {
    id: "seasonal-newcomers",
    eyebrow: "NEW ARRIVALS",
    title: "本季新品登場",
    description: "從當季魚鮮到家庭餐桌，探索新鮮有來源的海味。",
    href: "/products",
  },
  {
    id: "mid-autumn-table",
    eyebrow: "SEASONAL TABLE",
    title: "中秋團聚海味推薦",
    description: "為共享餐桌挑一份剛好的鮮，從魚類選品開始。",
    href: "/products?category=fish",
  },
  {
    id: "frozen-storage",
    eyebrow: "CARE NOTE",
    title: "冷凍水產保存提醒",
    description: "收到商品後請盡快放回冷凍庫，並依商品詳情保存。",
    href: "/faq",
  },
  {
    id: "traceable-selection",
    eyebrow: "YUANJIA NOTE",
    title: "每一份鮮味，都有來處",
    description: "查看商品詳情中的產地、食品安全與品質資訊。",
    href: "/products",
  },
  {
    id: "weekday-seafood",
    eyebrow: "DINNER IDEA",
    title: "平日晚餐，也能有一道好海味",
    description: "從鮭魚、鯖魚到虱目魚，依今天的料理方式挑選合適魚鮮。",
    href: "/products",
  },
  {
    id: "thawing-guide",
    eyebrow: "KITCHEN NOTE",
    title: "解凍前，先留一點準備時間",
    description: "掌握冷凍與解凍方式，讓海鮮料理保留更理想的口感。",
    href: "/news/flash-freeze-thawing-test",
  },
];
