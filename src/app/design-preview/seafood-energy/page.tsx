"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * 設計提案預覽：「視覺能量」（2026-09-03）。
 *
 * 背景：B 回報現有日系雜誌編輯風（細線、低對比、偏冷海洋藍 `#3E5C6B`、大量
 * 留白）放在生鮮海鮮電商上「太文靜」，不太像在賣海鮮。使用者要求「動畫、加
 * 一些圖片」兩個方向都做做看，但**先不要改到正式頁面**，生一份預覽檔案。
 *
 * 這支檔案：
 * - 是獨立路由 `/design-preview/seafood-energy`，沒有被任何導覽選單連結、
 *   不會出現在 sitemap，正式使用者不會看到，純粹給團隊review 用。
 * - 完全自包含（自己的 `<style>`、自己的假資料、自己的元件），刻意不 import
 *   `EditorialStyles.tsx`／`editorial/styles.ts` 這些正式頁面共用的樣式檔——
 *   避免這份提案跟正式頁面的樣式互相牽動，之後真的要採用某個方向時，是團隊
 *   確認後再手動搬移到正式元件（照這個專案一貫的作法，見
 *   src/components/editorial/ProductList.tsx 檔頭「design-preview 搬過來」
 *   的說明），不是這份檔案本身會影響正式網站。
 * - 商品圖片用的是正式 5 筆商品目前真的在用的近似商品照（見
 *   src/lib/product-photos.ts），文案（描述／價格）照抄正式 Supabase 資料，
 *   讓 review 時看到的是接近真實上線的效果，不是隨便拼湊的假內容。
 *
 * 兩個提案方向都做進來，用右上角的切換鈕直接比較「目前風格」與「提案風格」：
 *
 * 1. 輕量 CSS 微動畫（不改配色時也能感受到差異）：
 *    - 商品卡片依序錯開淡入（IntersectionObserver + index 決定延遲），
 *      不是整批一起出現。
 *    - 圖片 hover 放大幅度加大、easing 更明快（現有 `ep-hover-zoom` 是
 *      `scale(1.06)`／0.7s，這裡加大到 `scale(1.12)`／0.45s）。
 *    - Hero 圖片加一個很輕的視差（滾動時背景圖以比內容慢的速度位移）。
 *    - 「加入購物車」點擊後有明顯的回饋動畫（輕微放大＋色塊閃過），不是只
 *      換文字。
 *    - 全部動畫都包在 `prefers-reduced-motion` 判斷內，跟正式站
 *      （EditorialStyles.tsx 的 `.ep-fade-in`）同樣的無障礙處理方式。
 *
 * 2. 局部注入暖色（食物普遍用暖色刺激食欲，現有主色是偏冷的海洋藍）：
 *    - 新增一個珊瑚橘紅 `--accent-warm: #E4572E`，只用在 CTA 按鈕、「本日
 *      直送」徽章這種強調互動點，背景／文字／間距等其他一切維持原本的
 *      編輯風語言不變——不是全站換色系，是點綴。
 *
 * 這份檔案本身不影響 `/products`、`/` 等正式頁面的任何程式碼或資料。
 */

interface PreviewProduct {
  slug: string;
  name: string;
  price: number;
  shortDescription: string;
  image: string;
  imageAlt: string;
}

const PREVIEW_PRODUCTS: PreviewProduct[] = [
  {
    slug: "argentine-red-shrimp",
    name: "阿根廷天使紅蝦",
    price: 329,
    shortDescription: "捕撈自南大西洋阿根廷海域，肉質鮮甜彈牙、蝦膏飽滿，適合涮火鍋、鹽烤或簡單白灼。",
    image: "/product-photos-shrimp.jpg",
    imageAlt: "阿根廷天使紅蝦示意照",
  },
  {
    slug: "norwegian-salmon-fillet",
    name: "挪威鮭魚菲力",
    price: 239,
    shortDescription: "來自挪威優質漁場，油脂分布均勻、肉質細嫩多汁，已去骨去皮，適合煎烤、氣炸。",
    image: "/product-photos-salmon-fillet.jpg",
    imageAlt: "挪威鮭魚菲力示意照",
  },
  {
    slug: "taiwan-milkfish-belly",
    name: "台灣虱目魚肚",
    price: 169,
    shortDescription: "台灣本地養殖，取魚腹油脂最豐厚的部位，肉質細緻軟嫩、油脂香氣足。",
    image: "/product-photos-milkfish-belly.jpg",
    imageAlt: "台灣虱目魚肚示意照",
  },
  {
    slug: "taiwan-clam",
    name: "台灣鮮甜蛤蜊",
    price: 139,
    shortDescription: "台灣沿海養殖，殼薄肉厚、湯汁鮮甜，適合煮湯、蒜蓉爆炒或義式蛤蜊麵。",
    image: "/product-photos-clam.jpg",
    imageAlt: "台灣鮮甜蛤蜊示意照",
  },
  {
    slug: "seasoned-mackerel",
    name: "日式調味鯖魚",
    price: 119,
    shortDescription: "以日式手法調味醃漬，鹹香入味、油脂豐富，退冰後簡單煎烤或氣炸即可上桌。",
    image: "/product-photos-mackerel.jpg",
    imageAlt: "日式調味鯖魚示意照",
  },
];

type Mode = "current" | "proposed";

export default function SeafoodEnergyPreviewPage() {
  const [mode, setMode] = useState<Mode>("proposed");
  const isProposed = mode === "proposed";

  return (
    <div
      className="preview-root"
      style={{
        // 提案模式才套用暖色點綴變數；目前風格沿用原本的海洋藍。
        ["--accent" as string]: isProposed ? "#E4572E" : "#3E5C6B",
        ["--accent-soft" as string]: isProposed ? "#FBE4DA" : "#E7EDEF",
      }}
    >
      <PreviewStyles />

      {/* 只在這份預覽頁出現的說明列＋切換鈕，正式頁面沒有這個東西。 */}
      <div className="preview-banner">
        <div className="preview-banner-inner">
          <div>
            <strong>設計提案預覽</strong> · `/design-preview/seafood-energy`
            ——沒有連結在任何導覽選單、不影響正式網站，純供內部 review。
          </div>
          <div className="preview-toggle" role="group" aria-label="切換比較風格">
            <button
              type="button"
              className={!isProposed ? "is-active" : ""}
              onClick={() => setMode("current")}
            >
              目前風格
            </button>
            <button
              type="button"
              className={isProposed ? "is-active" : ""}
              onClick={() => setMode("proposed")}
            >
              提案風格
            </button>
          </div>
        </div>
      </div>

      <HeroSection isProposed={isProposed} />
      <ProductGridSection isProposed={isProposed} />

      <div className="preview-footer">
        這份頁面只是視覺提案，「加入購物車」按鈕沒有接真實購物車邏輯——只做點擊
        回饋動畫的示範。商品連結會導到正式的 `/products/[slug]`（同一個
        Supabase 資料），方便直接比較卡片跟真正詳情頁的視覺落差。
      </div>
    </div>
  );
}

function HeroSection({ isProposed }: { isProposed: boolean }) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    function handleScroll() {
      if (!bgRef.current) return;
      // 很輕的視差：背景位移量只有捲動量的 15%，避免暈眩感、也避免圖片邊緣露白。
      const offset = window.scrollY * 0.15;
      bgRef.current.style.transform = `translateY(${offset}px)`;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="hero">
      <div ref={bgRef} className={`hero-bg ${isProposed ? "hero-bg-parallax" : ""}`}>
        <Image src="/hero-seafood.jpg" alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="hero-gradient" />
      </div>
      <div className="hero-content">
        {isProposed ? <span className="hero-badge">今日直送 · 現流嚴選</span> : null}
        <span className="hero-eyebrow">YUANJIA</span>
        <h1>新鮮有來源，生活更有味</h1>
        <p>嚴選全球水產與即食料理，從採購、加工到冷鏈配送，替每一餐守住品質。</p>
        <button type="button" className="cta-button">
          開始挑選 EXPLORE
        </button>
      </div>
    </section>
  );
}

function ProductGridSection({ isProposed }: { isProposed: boolean }) {
  return (
    <section className="product-section">
      <div className="product-section-inner">
        <span className="section-eyebrow">MENU · 商品一覽</span>
        <div className="product-grid">
          {PREVIEW_PRODUCTS.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} isProposed={isProposed} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  index,
  isProposed,
}: {
  product: PreviewProduct;
  index: number;
  isProposed: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  // 偏好減少動態效果的使用者，初始狀態就直接視為「已可見」——lazy initializer
  // 只在第一次渲染算一次，不會像在 effect 裡呼叫 setState 那樣多觸發一次
  // render（見 react-hooks/set-state-in-effect 規則，跟
  // src/components/B2CHelpWidget.tsx 之前修過的同一種寫法）。
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // 故意只在掛載時判斷一次是否要略過 observer；`visible` 之後變 true 是這個
    // effect 自己觸發的，不需要因此重新執行整個 effect。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!justAdded) return;
    const timeoutId = setTimeout(() => setJustAdded(false), 900);
    return () => clearTimeout(timeoutId);
  }, [justAdded]);

  // 「提案風格」才錯開淡入延遲；「目前風格」維持跟正式站一樣的整批同時淡入，方便對照差異。
  const delayMs = isProposed ? index * 90 : 0;

  return (
    <div
      ref={cardRef}
      className={`product-card ${isProposed ? "product-card-proposed" : ""} ${visible ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="product-image-wrap">
        <Image src={product.image} alt={product.imageAlt} fill sizes="(min-width: 640px) 20vw, 45vw" style={{ objectFit: "cover" }} />
        {isProposed ? <span className="product-badge">熱銷</span> : null}
      </div>
      <div className="product-body">
        <Link href={`/products/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        <p className="product-desc">{product.shortDescription}</p>
        <div className="product-price-row">
          <span className="product-price">NT$ {product.price}</span>
        </div>
        <button
          type="button"
          className={`add-to-cart-button ${justAdded ? "is-added" : ""}`}
          onClick={() => setJustAdded(true)}
        >
          {justAdded ? "已加入 ✓" : "加入購物車"}
        </button>
      </div>
    </div>
  );
}

function PreviewStyles() {
  return (
    <style>{`
      .preview-root {
        --ink: #2b2b2b;
        --ink-soft: #4a4a4a;
        --muted: #8a8a8a;
        --bg: #FAF9F6;
        --placeholder: #F3F1EB;
        background: var(--bg);
        color: var(--ink);
        min-height: 100vh;
        font-family: system-ui, -apple-system, "PingFang TC", "Microsoft JhengHei", sans-serif;
      }

      .preview-banner {
        position: sticky;
        top: 0;
        z-index: 50;
        background: #1f1f1f;
        color: #f5f5f5;
        font-size: 12px;
        padding: 10px 20px;
      }
      .preview-banner-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .preview-toggle {
        display: inline-flex;
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 999px;
        overflow: hidden;
      }
      .preview-toggle button {
        border: none;
        background: transparent;
        color: #f5f5f5;
        padding: 6px 14px;
        font-size: 12px;
        cursor: pointer;
      }
      .preview-toggle button.is-active {
        background: var(--accent);
        color: white;
      }

      .hero {
        position: relative;
        min-height: 460px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        border-bottom: 1px solid #e5e2da;
      }
      .hero-bg {
        position: absolute;
        inset: -10% 0 -10% 0;
      }
      .hero-bg-parallax {
        transition: transform 0.05s linear;
      }
      .hero-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1));
      }
      .hero-content {
        position: relative;
        z-index: 1;
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 24px;
        color: white;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .hero-badge {
        display: inline-flex;
        width: fit-content;
        padding: 5px 12px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 12px;
        letter-spacing: 0.1em;
        animation: preview-badge-pop 0.4s ease-out;
      }
      @keyframes preview-badge-pop {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
      .hero-eyebrow {
        font-size: 13px;
        letter-spacing: 0.35em;
        color: rgba(255,255,255,0.85);
      }
      .hero-content h1 {
        font-size: 34px;
        font-weight: 300;
        letter-spacing: 0.03em;
        margin: 0;
      }
      .hero-content p {
        max-width: 32rem;
        font-size: 14px;
        font-weight: 300;
        line-height: 1.8;
        color: rgba(255,255,255,0.9);
        margin: 0;
      }
      .cta-button {
        margin-top: 8px;
        width: fit-content;
        padding: 13px 30px;
        border: 1px solid var(--accent);
        background: var(--accent);
        color: white;
        font-size: 13px;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: background-color 0.25s ease, transform 0.15s ease;
      }
      .cta-button:hover {
        transform: translateY(-2px);
        filter: brightness(1.08);
      }

      .product-section {
        padding: 72px 24px;
      }
      .product-section-inner {
        max-width: 1200px;
        margin: 0 auto;
      }
      .section-eyebrow {
        display: block;
        margin-bottom: 32px;
        font-size: 13px;
        letter-spacing: 0.3em;
        color: var(--muted);
      }
      .product-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 32px;
      }
      @media (min-width: 640px) {
        .product-grid { grid-template-columns: repeat(3, 1fr); gap: 28px; }
      }

      .product-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        opacity: 1;
        transform: none;
      }
      .product-card-proposed {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .product-card-proposed.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .product-image-wrap {
        position: relative;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: var(--placeholder);
      }
      .product-image-wrap img {
        transition: transform 0.7s ease;
      }
      .product-card-proposed .product-image-wrap img {
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .product-card:hover .product-image-wrap img {
        transform: scale(1.06);
      }
      .product-card-proposed:hover .product-image-wrap img {
        transform: scale(1.12);
      }
      .product-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        background: var(--accent);
        color: white;
        font-size: 11px;
        letter-spacing: 0.05em;
        padding: 4px 9px;
        border-radius: 3px;
      }

      .product-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .product-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--ink);
        text-decoration: none;
      }
      .product-name:hover {
        color: var(--accent);
      }
      .product-desc {
        font-size: 13px;
        font-weight: 300;
        line-height: 1.7;
        color: var(--ink-soft);
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .product-price-row {
        margin-top: 2px;
      }
      .product-price {
        font-size: 14px;
        letter-spacing: 0.05em;
        color: var(--ink);
      }
      .add-to-cart-button {
        margin-top: 4px;
        min-height: 38px;
        border: 1px solid var(--ink);
        background: transparent;
        color: var(--ink);
        font-size: 12px;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
      }
      .add-to-cart-button:hover {
        background: var(--ink);
        color: white;
      }
      .add-to-cart-button.is-added {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
        transform: scale(1.03);
      }

      .preview-footer {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px 24px 60px;
        font-size: 12px;
        color: var(--muted);
        line-height: 1.8;
      }

      @media (prefers-reduced-motion: reduce) {
        .product-card-proposed,
        .cta-button,
        .add-to-cart-button,
        .product-image-wrap img,
        .hero-badge {
          transition: none !important;
          animation: none !important;
        }
        .product-card-proposed {
          opacity: 1;
          transform: none;
        }
      }
    `}</style>
  );
}
