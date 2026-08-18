import Image from "next/image";
import Link from "next/link";

/**
 * 全站 Footer，掛在 root layout，跟 Header 一樣所有頁面都會顯示。
 *
 * 2026-08-14：design.md §6.5／§8 把 Footer 明確歸在 Phase 2（品牌信任），這次
 * 依使用者要求提早做——她想要有「附圖二」那種 footer（元家現有官網 yens.com.tw
 * 的 footer：logo、導覽連結列、公司資訊、社群連結、版權宣告）。
 *
 * 版面結構採 design.md §6.5 的「四欄」規格（品牌／公司資料、商品探索、服務政策、
 * 企業合作與社群），深海洋藍底；但欄位內容跟連結沒有照抄 yens.com.tw 原站，因為
 * 那個網站有品牌故事、最新消息、客戶服務等我們還沒做的頁面。這裡的規則跟 Header
 * 一致：
 * - 連到我們真的有的頁面（/products、首頁的 #about／#quality 錨點）用真連結；
 * - 我們還沒做的頁面（客戶服務、隱私權政策、企業合作）用不可點擊的「即將推出」
 *   文字，不連到不存在或外部網址，避免死連結／誤導。
 * - 社群連結（YouTube／Facebook／Instagram／TikTok）是元家官方帳號的真實外部
 *   網址（來源：yens.com.tw footer），可以連，不算捏造內容。
 *
 * 公司資訊（地址、電話、公司全名）取自 yens.com.tw footer 的公開聯絡資訊，不是
 * 捏造的假資料；著作權疑慮不大，因為這是元家自己的公司資訊，用在元家自己的新
 * 網站上。
 *
 * 2026-08-14（同日）：Logo 換成官方圖檔（public/yens-logo.png，來源同 Header）。
 * 這裡背景是深海洋藍（brand-ocean-800），logo 本身是白底透明背景＋藍綠色圖形，
 * 藍色的圖形部分跟深藍背景對比不夠，所以外面包一個白底圓角小卡片，不是直接放在
 * 深藍底上——純文字「元家」在深底上沒有這個問題，但這裡想保持跟 Header 用同一顆
 * 圖檔，視覺才會一致。
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-ocean-800 text-white">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-x-8 gap-y-10 px-5 py-14 sm:px-8 lg:grid-cols-4 lg:px-10">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <Link
            href="/"
            className="w-fit rounded-lg bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Image src="/yens-logo.png" alt="元家" width={97} height={34} className="h-8 w-auto" />
          </Link>
          <p className="text-sm leading-6 text-white/70">
            元家企業股份有限公司
            <br />
            YEN &amp; Brothers Enterprise CO., LTD.
          </p>
          <p className="text-sm leading-6 text-white/70">
            地址：242 新北市新莊區新北大道二段 217 號 14 樓
            <br />
            代表號：(02)8521-1230
          </p>
        </div>

        <FooterColumn title="商品探索">
          <FooterLink href="/products">全部商品</FooterLink>
          <FooterAnchor href="/#quality">食安與產地</FooterAnchor>
          <FooterAnchor href="/#about">關於元家</FooterAnchor>
        </FooterColumn>

        <FooterColumn title="服務與政策">
          <FooterPlaceholder>客戶服務（即將推出）</FooterPlaceholder>
          <FooterPlaceholder>隱私權政策（即將推出）</FooterPlaceholder>
        </FooterColumn>

        <FooterColumn title="企業合作與社群">
          <FooterPlaceholder>企業合作（即將推出）</FooterPlaceholder>
          <div className="flex flex-wrap gap-3 pt-1 text-xs">
            <a
              href="https://www.youtube.com/@yensseafood"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-2 py-1 text-white/80 hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              YouTube
            </a>
            <a
              href="https://www.facebook.com/yensseafood"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-2 py-1 text-white/80 hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/yensseafood"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-2 py-1 text-white/80 hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@yensseafood"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-2 py-1 text-white/80 hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              TikTok
            </a>
          </div>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1200px] px-5 py-4 text-xs text-white/50 sm:px-8 lg:px-10">
          © {year} YEN &amp; Brothers Enterprise CO., LTD. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold tracking-widest text-white/50">{title}</h3>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </Link>
  );
}

function FooterAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </a>
  );
}

/** 還沒有對應頁面的項目，刻意不做成連結，避免死連結——跟 Header 的「即將推出」慣例一致。 */
function FooterPlaceholder({ children }: { children: React.ReactNode }) {
  return <span className="text-white/40">{children}</span>;
}
