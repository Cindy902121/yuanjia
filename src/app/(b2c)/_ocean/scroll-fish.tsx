"use client";

import { useEffect, useRef } from "react";

/**
 * 「魚沿著洋流向下游」的 Scroll-driven 動畫。
 *
 * 2026-09：原為 `/about-preview` 專用元件，Ocean Motion 視覺設計五輪確認
 * 核准後原封不動搬進 `_ocean/` 給正式首頁使用——這個檔案本身在最後一輪
 * 使用者回饋裡被明確列為 LOCKED／APPROVED，Migration 過程沒有動任何一行
 * 邏輯，只有搬動檔案位置。
 *
 * 掛在 page.tsx 的 `.op-descent`（涵蓋品牌故事／企業優勢／食安品質／媒體
 * 報導／收尾引言這幾個內容 Section，實際數量隨 page.tsx 增減，這裡不寫死）
 * 裡，`absolute inset-0`，貼齊「這些 Section 疊起來的總高度」，不是貼齊
 * 整個 viewport——使用者往下滑多少比例、魚就游到容器裡對應比例的位置，
 * 不是自己跑的固定時長動畫。進度公式本身是用「整份文件捲動比例」算（見
 * 下方 `computeProgress()`），跟這個容器裡實際有幾個 Section 無關，
 * page.tsx 增減 Section 不需要跟著改這個檔案。
 *
 * 「不遮住文字、不搶閱讀內容」的做法：魚跟軌跡線刻意只在**貼著左邊界的一條
 * 窄帶**（離左邊 12–56px）內游動，不會進到 `max-w-[1200px]` 的內文欄位——
 * 這個寬度不管在什麼螢幕尺寸都是安全的空白邊界，不需要另外偵測內文欄位的
 * 實際寬度。
 *
 * 魚的座標／軌跡線的座標用同一條公式算（sine 波動模擬 S 型洋流路徑），兩者
 * 保證永遠對得上、不會因為 SVG viewBox 縮放而跑位或變形；魚的旋轉角度用
 * 「這一刻」跟「一瞬間之後」的座標差算方向，讓魚頭自然跟著路徑轉彎。
 *
 * 軌跡線用 `stroke-dasharray`／`stroke-dashoffset` 做「魚游到哪、線就畫到
 * 哪」的效果，`dashoffset` 直接對應 Scroll Progress，不是額外的計時動畫。
 *
 * 響應式／可及性：
 * - 手機（< 768px）完全不渲染這個圖層（`hidden md:block`），只留背景漸層
 *   跟品牌故事區的靜態線稿，符合「Mobile 大幅降低動畫幅度」的要求。
 * - 平板（768–1023px）用比較小的擺動幅度／透明度；桌面（≥1024px）用完整
 *   幅度——同一份程式碼，只是依 `window.innerWidth` 選一組較保守的參數。
 * - `prefers-reduced-motion: reduce`：完全不掛 scroll／resize 監聽，魚固定
 *   停在容器中點、軌跡線直接完整畫出來（`dashoffset: 0`），保留靜態畫面，
 *   但沒有任何動態。
 * - scroll 監聽用 `passive: true`，並用 `requestAnimationFrame` 節流，卸載
 *   時清掉監聽器、`ResizeObserver`、待執行的 rAF，避免記憶體洩漏。
 *
 * 2026-09（使用者回報「魚沒有一路游到頁面最底部」後修正兩次——只改
 * `computeProgress()` 這一個算式，魚的 SVG、線條、配色、Motion Path 公式、
 * 響應式／reduced-motion 規則完全沒有動）：
 *
 * 第一次修正：原本的算式是 `(viewportMid - rect.top) / rect.height`——魚在
 * 「viewport 正中央對齊容器底部」的當下就達到 progress=1、動畫提前跑完，
 * 改成「元素被捲動經過的比例」算式 `(innerHeight - rect.top) / (innerHeight
 * + rect.height)`，容器底部離開螢幕上緣時才算完成。
 *
 * 實測後發現第一次的修法還是不夠：這個容器（`.op-descent`，止於 Footer
 * 開始的地方）本身比一個 viewport 高，但這個頁面的 Footer 卻比一個
 * viewport 矮——代表使用者捲到「文件真正的最底部」時，viewport 裡同時看得
 * 到「容器尾端＋完整 Footer」，容器永遠不會真的「完全離開畫面」，魚用
 * 上面那條公式會卡在 100% 之前（實測卡在約 84%），到不了終點。
 *
 * 第二次修正：改成直接對應「整份文件」的捲動比例，不是「這個容器自己被
 * 捲過多少」：`window.scrollY / (document.documentElement.scrollHeight -
 * window.innerHeight)`。這才精確符合使用者的原始要求——「0% 頁面捲動≈0%
 * 魚的進度、50%≈50%、接近100%≈100%」——而且每次都即時讀
 * `document.documentElement.scrollHeight`，不是寫死的像素距離，之後任何
 * Section 增減內容、Header／Footer 高度變動，都會自動反映在這個比例裡。
 *
 * 2026-09（使用者要求「魚進入深色背景後顏色太深看不清楚，Stroke Color
 * 必須隨海洋深度平滑變化」——只加這一件事，SVG 形狀／Motion Path 公式／
 * 響應式／reduced-motion／opacity 全部沒有動）：
 * 用同一個 `progress`（0→1，跟位置公式共用同一個數值，天然對齊、不會有
 * 「魚游到哪、顏色卻沒跟上」的錯位）在三個顏色點之間做線性插值：
 * `progress 0`（淺色背景）＝ Deep Ocean Blue、`progress 0.5`（中段背景）＝
 * Muted Blue Gray、`progress 1`（深色背景）＝ Ice White。魚本身跟軌跡線
 * 共用同一條插值結果，確保兩者顏色永遠一致；因為是逐 frame 平滑插值（不是
 * 用 CSS transition 在某個斷點瞬間切換），不會出現「在某個 Section 突然從
 * 藍色跳成白色」的硬切換。
 */
const OP_FISH_DEEP: [number, number, number] = [18, 42, 58]; // Deep Ocean Blue（比 ink 更藍一階，避免跟純黑文字色混淆）
const OP_FISH_MUTED: [number, number, number] = [92, 115, 131]; // #5C7383 Muted Blue Gray
const OP_FISH_ICE: [number, number, number] = [234, 244, 248]; // #EAF4F8 Ice White

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function colorForDepth(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const [from, to, localT] =
    clamped <= 0.5
      ? [OP_FISH_DEEP, OP_FISH_MUTED, clamped / 0.5]
      : [OP_FISH_MUTED, OP_FISH_ICE, (clamped - 0.5) / 0.5];
  const r = lerpChannel(from[0], to[0], localT);
  const g = lerpChannel(from[1], to[1], localT);
  const b = lerpChannel(from[2], to[2], localT);
  return `rgb(${r}, ${g}, ${b})`;
}
export function ScrollFish() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const fishRef = useRef<HTMLDivElement>(null);
  const fishPathRef = useRef<SVGPathElement>(null);
  const rafRef = useRef<number | null>(null);
  const heightRef = useRef(0);
  const ampRef = useRef(20);

  useEffect(() => {
    const containerEl = containerRef.current;
    const pathEl = pathRef.current;
    const fishEl = fishRef.current;
    const fishPathEl = fishPathRef.current;
    if (!containerEl || !pathEl || !fishEl || !fishPathEl) return;
    const container = containerEl;
    const path = pathEl;
    const fish = fishEl;
    const fishPath = fishPathEl;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const EDGE_BASE = 34; // 離左邊界的中心位置（px）
    const FREQUENCY = 2.4; // S 型彎的數量
    const SAMPLE_COUNT = 48;

    function amplitudeForViewport() {
      return window.innerWidth >= 1024 ? 20 : 12;
    }

    function xAt(progress: number, amplitude: number) {
      return EDGE_BASE + amplitude * Math.sin(progress * FREQUENCY * Math.PI);
    }

    function buildPathD(height: number, amplitude: number) {
      const parts: string[] = [];
      for (let i = 0; i <= SAMPLE_COUNT; i++) {
        const t = i / SAMPLE_COUNT;
        const x = xAt(t, amplitude);
        const y = t * height;
        parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return parts.join(" ");
    }

    function measure() {
      const rect = container.getBoundingClientRect();
      heightRef.current = rect.height;
      ampRef.current = amplitudeForViewport();
      path.setAttribute("d", buildPathD(heightRef.current, ampRef.current));
    }

    function applyProgress(progress: number) {
      const height = heightRef.current;
      const amplitude = ampRef.current;
      if (!height) return;
      const clamped = Math.min(1, Math.max(0, progress));
      const x = xAt(clamped, amplitude);
      const y = clamped * height;

      const delta = 0.01;
      const ahead = Math.min(1, clamped + delta);
      const xAhead = xAt(ahead, amplitude);
      const yAhead = ahead * height;
      const angle = Math.atan2(yAhead - y, xAhead - x) * (180 / Math.PI);

      fish.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

      const length = path.getTotalLength();
      if (length > 0) {
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length * (1 - clamped)}`;
      }

      const depthColor = colorForDepth(clamped);
      path.style.stroke = depthColor;
      fishPath.style.stroke = depthColor;
    }

    /** Reduced-motion 用：魚固定停在容器中點，軌跡線完整畫出來（dashoffset
     * 固定 0），不能借用 applyProgress(0.5)——那會把 dashoffset 設成「畫一半」
     * （length * 0.5），不是「完整畫出來」，兩者是不同的靜態畫面。 */
    function applyStatic() {
      const height = heightRef.current;
      const amplitude = ampRef.current;
      if (!height) return;
      const x = xAt(0.5, amplitude);
      const y = 0.5 * height;
      fish.style.transform = `translate(${x}px, ${y}px) rotate(90deg)`;

      const length = path.getTotalLength();
      if (length > 0) {
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = "0";
      }

      const depthColor = colorForDepth(0.5);
      path.style.stroke = depthColor;
      fishPath.style.stroke = depthColor;
    }

    measure();

    if (reduceMotion) {
      applyStatic();
      const onResize = () => {
        measure();
        applyStatic();
      };
      window.addEventListener("resize", onResize, { passive: true });
      return () => window.removeEventListener("resize", onResize);
    }

    function computeProgress() {
      // 直接用「整個頁面」的捲動比例，不是「這個容器自己被捲過多少」的比例
      // ——這裡的容器（.op-descent，止於 Footer 開始的地方）本身就比一個
      // viewport 高，但 Footer 卻可能比一個 viewport 矮（這個頁面實測就是
      // 這樣），用「容器被完整捲過」當終點條件，會導致使用者捲到文件真正
      // 的最底部時，容器都還沒有完整離開畫面，魚永遠到不了 100%。改成直接
      // 對應 `scrollY / (整份文件高度 - viewport 高度)`，正好符合使用者的
      // 要求：「0% 頁面捲動≈0%魚的進度、50%≈50%、接近100%≈100%」，而且是
      // 每次都重新讀 `document.documentElement.scrollHeight`，內容增減
      // （例如之後任何 Section 多幾行字）會自動反映在這個比例裡，不是寫死
      // 的像素值。
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return 1;
      return window.scrollY / max;
    }

    function onScroll() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        applyProgress(computeProgress());
        rafRef.current = null;
      });
    }

    function onResize() {
      measure();
      applyProgress(computeProgress());
    }

    applyProgress(computeProgress());

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="op-fish-layer pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden md:block"
    >
      <svg className="absolute inset-0 h-full w-full">
        <path ref={pathRef} fill="none" strokeOpacity={0.16} strokeWidth={1.2} strokeLinecap="round" />
      </svg>
      <div ref={fishRef} className="absolute left-0 top-0" style={{ transform: "translate(-999px, -999px)" }}>
        <svg width="34" height="15" viewBox="0 0 64 28" style={{ overflow: "visible" }}>
          <path
            ref={fishPathRef}
            d="M4,14 C4,7 14,3 26,3 C36,3 44,7 48,11 L60,4 L54,14 L60,24 L48,17 C44,21 36,25 26,25 C14,25 4,21 4,14 Z"
            fill="none"
            strokeOpacity={0.38}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
