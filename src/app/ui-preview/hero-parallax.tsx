"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Hero 圖片的極輕視差（`/ui-preview` 專用，跟正式首頁的靜態滿版圖不同）。
 * 只對圖片本身位移，不影響文字層——捲動時圖片以比頁面慢的速度往下移，
 * 製造深度感，位移量夾在 48px 內避免圖片邊緣露白或暈眩感。
 * 尊重 prefers-reduced-motion：偏好減少動態效果時完全不掛 scroll listener。
 */
export function HeroParallax({ src, alt }: { src: string; alt: string }) {
  const imgWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = imgWrapRef.current;
    if (!node) return;

    function handleScroll() {
      if (!node) return;
      const offset = Math.min(window.scrollY * 0.12, 48);
      node.style.transform = `translateY(${offset}px) scale(1.08)`;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={imgWrapRef} className="up-parallax absolute inset-0">
      <Image src={src} alt={alt} fill priority sizes="100vw" className="object-cover" />
    </div>
  );
}
