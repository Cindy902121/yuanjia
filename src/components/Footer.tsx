import Image from "next/image";
import Link from "next/link";

/**
 * 全站 Footer，掛在 root layout，跟 Header 一樣所有頁面都會顯示。
 *
 * 版面結構延續 design.md §6.5 的「四欄」規格（品牌／公司資料、商品探索、服務
 * 政策、企業合作與社群）；連結規則不變：
 * - 連到我們真的有的頁面用真連結；
 * - 我們還沒做的頁面（客戶服務、隱私權政策）用不可點擊的「即將推出」文字，
 *   不連到不存在或外部網址，避免死連結／誤導。「客戶服務」「隱私權政策」這
 *   兩個查過 PRD／FDD／路由權限規格，確認都不是正式規格要求的頁面（唯一跟
 *   隱私相關的規格是結帳頁的「隱私權同意」勾選欄位，不是獨立政策頁），繼續
 *   維持佔位文字即可，不用排進開發進度。
 *
 * 2026-08-19：「企業合作」原本也是佔位文字，PRD 5.4／6.7 其實有明確規格
 * （src/app/business/lead/page.tsx），頁面做好後這裡改成真連結。
 * - 社群連結（YouTube／Facebook／Instagram／TikTok）是元家官方帳號的真實外部
 *   網址（來源：yens.com.tw footer）。
 *
 * 公司資訊（地址、電話、公司全名）取自 yens.com.tw footer 的公開聯絡資訊。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，正式取代 design.md 舊有的
 * 「海洋藍＋鮮活綠」系統，Footer 這次也一起換：
 * - 底色從深海洋藍（`bg-brand-ocean-800`）改成跟 Header 同一套暖白系統的
 *   深墨色 `#2b2b2b`，不是純黑——維持「墨色」而不是「純黑」的編輯風原則，跟
 *   內文字色同一個顏色系統，只是這裡是底色。
 *   Logo 因此不再需要白底圓角小卡片墊底（原本是為了讓 logo 藍綠圖形在深海洋
 *   藍底上有對比，現在底色換成中性墨色，logo 直接放上去對比就足夠）。
 * - 欄位標題、連結字體改用內文字體＋拉寬字距，取代原本的粗體小標。
 * - 版權宣告改用更細的分隔線，維持整體「細線條」語言。
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#2b2b2b] text-white">
      <div className="mx-auto grid w-full max-w-[1300px] grid-cols-2 gap-x-8 gap-y-12 px-5 py-16 sm:px-8 lg:grid-cols-4 lg:px-10 lg:py-24">
        <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
          <Link href="/" className="w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <Image src="/yens-logo.png" alt="元家" width={97} height={34} className="h-8 w-auto" />
          </Link>
          <p className="text-sm font-light leading-7 text-white/60">
            元家企業股份有限公司
            <br />
            YEN &amp; Brothers Enterprise CO., LTD.
          </p>
          <p className="text-sm font-light leading-7 text-white/60">
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
          <FooterLink href="/faq">常見問題</FooterLink>
          <FooterPlaceholder>客戶服務（即將推出）</FooterPlaceholder>
          <FooterPlaceholder>隱私權政策（即將推出）</FooterPlaceholder>
        </FooterColumn>

        <FooterColumn title="企業合作與社群">
          <FooterLink href="/media">媒體報導</FooterLink>
          <FooterLink href="/business/lead">企業合作</FooterLink>
          <div className="flex flex-wrap gap-4 pt-1 font-[family-name:var(--ep-font-en)] text-xs tracking-widest">
            <a
              href="https://www.youtube.com/@yensseafood"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              YouTube
            </a>
            <a
              href="https://www.facebook.com/yensseafood"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/yensseafood"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@yensseafood"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              TikTok
            </a>
          </div>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1300px] px-5 py-5 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-white/40 sm:px-8 lg:px-10">
          © {year} YEN &amp; BROTHERS ENTERPRISE CO., LTD. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-white/40">{title}</h3>
      <div className="flex flex-col gap-3 text-sm font-light">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </Link>
  );
}

function FooterAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </a>
  );
}

/** 還沒有對應頁面的項目，刻意不做成連結，避免死連結——跟 Header 的「即將推出」慣例一致。 */
function FooterPlaceholder({ children }: { children: React.ReactNode }) {
  return <span className="text-white/30">{children}</span>;
}
