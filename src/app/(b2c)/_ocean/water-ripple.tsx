"use client";

import { useEffect, useRef } from "react";

/**
 * 滑鼠水波紋互動（使用者要求「非常 subtle 的 Mouse / Pointer Water Ripple
 * Trail」，不是換掉滑鼠游標本身）。
 *
 * 2026-09：原為 `/about-preview` 專用元件，Ocean Motion 視覺設計五輪確認
 * 核准後原封不動搬進 `_ocean/` 給正式首頁使用——只掛在首頁（見 page.tsx），
 * 不是全站共用，跟 Preview 階段的範圍一致。
 *
 * 技術選擇：單一個 `fixed` 滿版 `<canvas>`，用一個 rAF 迴圈畫所有現存的
 * 漣漪，不是每個漣漪各自一個 DOM node——使用者明確要求「避免大量 DOM
 * nodes」「不要用重量級 WebGL library」，Canvas 2D 剛好符合「輕量」跟
 * 「效能」兩個要求，rAF 迴圈只在還有漣漪存在時才跑（見 `ensureLoop`），
 * 滑鼠靜止時不會平白消耗效能。
 *
 * 生成節流：不是每個 `mousemove` 都生成漣漪，而是「跟上一個生成點的直線
 * 距離超過門檻才生成下一個」（`SPAWN_DISTANCE`），符合使用者要求的
 * 「約 80–120px 後才生成下一個」。
 *
 * 每個漣漪：極小的橢圓開始、緩慢放大、`opacity` 從 0.08–0.15 線性淡到
 * 0、1–1.5 秒後從陣列移除（不會累積）。橢圓的長短軸比例、初始角度、
 * 淡出時間都各自帶一點隨機（見 `spawnRipple`），確保「每個 Ripple 不完全
 * 相同」，模擬自然水面的不規則感，同時維持細線條、無填色、無光暈——
 * 完全不用 `shadowBlur`／漸層／粒子效果，避免使用者明確排除的
 * Glow／Neon／Particle／Splash 效果。
 *
 * 顏色隨海洋深度變化：用漣漪產生當下的「文件絕對 Y 座標 ÷ 全文件高度」
 * 算出跟 Fish／背景漸層同一套邏輯的深淺色（Deep Ocean Blue → Muted Blue
 * Gray → Ice White）。這裡刻意重新寫一份一樣的插值函式，不從
 * scroll-fish.tsx import——那個檔案這次被使用者列為 LOCKED／APPROVED，
 * 不應該因為新增這個功能而被動到（即使只是抽成共用函式），寧可重複十幾行
 * 顏色公式，也不要牽動被鎖定的檔案。
 *
 * 裝置分級（使用者要求 Desktop 完整、Tablet 簡化、Mobile 完全停用）：
 * - 用 `matchMedia("(pointer: fine)")` 判斷是不是滑鼠／觸控板這類精確
 *   指標裝置——觸控螢幕（含手機、大部分平板）不會命中，直接不啟用，
 *   不需要另外判斷 User Agent。
 * - 精確指標裝置裡再依寬度分兩級：≥1024px 用完整參數（門檻 100px、
 *   同時最多 8 個漣漪）；768–1023px 用簡化參數（門檻 160px、同時最多 4
 *   個），對應「Tablet 適度簡化」。
 * - `prefers-reduced-motion: reduce`：完全不啟用（不掛任何監聽器、不畫
 *   任何東西），對應使用者要求。
 *
 * 一律 `pointer-events: none`——canvas 不會攔截任何點擊，不影響按鈕／
 * 連結／購物車等既有互動；z-index 定在 Header（`z-40`）之下、一般內容
 * 之上，配合極低的 opacity（0.08–0.15）確保「就算蓋在文字或照片上也
 * 非常低調」，不會實際影響閱讀。
 */

const RIPPLE_DEEP: [number, number, number] = [18, 42, 58];
const RIPPLE_MUTED: [number, number, number] = [92, 115, 131];
const RIPPLE_ICE: [number, number, number] = [234, 244, 248];

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function rippleColorForDepth(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const [from, to, localT] =
    clamped <= 0.5
      ? [RIPPLE_DEEP, RIPPLE_MUTED, clamped / 0.5]
      : [RIPPLE_MUTED, RIPPLE_ICE, (clamped - 0.5) / 0.5];
  return [
    lerpChannel(from[0], to[0], localT),
    lerpChannel(from[1], to[1], localT),
    lerpChannel(from[2], to[2], localT),
  ] as const;
}

type Ripple = {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
  rx: number;
  ry: number;
  rotation: number;
  peakOpacity: number;
  color: readonly [number, number, number];
};

export function WaterRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<{ x: number; y: number } | null>(null);
  const configRef = useRef({ spawnDistance: 100, maxRipples: 8 });

  useEffect(() => {
    // 裝置資格檢查直接寫在這個 effect 開頭、不通過的話 return 提早結束——
    // 不另外用一個 state＋effect 做「先判斷資格、資格通過再啟用」，避免
    // 在 effect 裡呼叫 setState 觸發不必要的二次 render（react-hooks/
    // set-state-in-effect），canvas 元素本身固定渲染、只是不掛任何監聽器、
    // 不畫任何東西，效果等同「未啟用」。
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function updateTier() {
      const tablet = window.innerWidth < 1024;
      configRef.current = tablet ? { spawnDistance: 160, maxRipples: 4 } : { spawnDistance: 100, maxRipples: 8 };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateTier();
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    function ensureLoop() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(tick);
    }

    function tick() {
      rafRef.current = null;
      const now = performance.now();
      const ripples = ripplesRef.current;
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const elapsed = now - r.startTime;
        if (elapsed >= r.duration) {
          ripples.splice(i, 1);
          continue;
        }
        const t = elapsed / r.duration;
        const eased = 1 - Math.pow(1 - t, 2); // ease-out
        const radius = 3 + (r.maxRadius - 3) * eased;
        const opacity = r.peakOpacity * (1 - t);

        ctx!.beginPath();
        ctx!.ellipse(r.x, r.y, radius * r.rx, radius * r.ry, r.rotation, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${r.color[0]}, ${r.color[1]}, ${r.color[2]}, ${opacity.toFixed(3)})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      if (ripples.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function spawnRipple(x: number, y: number) {
      const ripples = ripplesRef.current;
      if (ripples.length >= configRef.current.maxRipples) {
        ripples.shift();
      }
      const progress = (window.scrollY + y) / Math.max(1, document.documentElement.scrollHeight - window.innerHeight || 1);
      ripples.push({
        x,
        y,
        startTime: performance.now(),
        duration: 1000 + Math.random() * 500, // 1–1.5s
        maxRadius: 44 + Math.random() * 26, // 隨機收尾半徑，非每個一樣大
        rx: 0.85 + Math.random() * 0.3, // 略微橢圓，不是正圓
        ry: 0.85 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI,
        peakOpacity: 0.08 + Math.random() * 0.07, // 0.08–0.15
        color: rippleColorForDepth(progress),
      });
      ensureLoop();
    }

    function onMouseMove(event: MouseEvent) {
      const last = lastSpawnRef.current;
      if (last) {
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        if (Math.sqrt(dx * dx + dy * dy) < configRef.current.spawnDistance) return;
      }
      lastSpawnRef.current = { x: event.clientX, y: event.clientY };
      spawnRipple(event.clientX, event.clientY);
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ripplesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[25]"
    />
  );
}
