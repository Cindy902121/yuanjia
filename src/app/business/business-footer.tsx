import Image from "next/image";
import Link from "next/link";

const socialLinks = [
  { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/@yensseafood" },
  { platform: "line", label: "LINE", href: "https://page.line.me/cdd6667c?openQrModal=true" },
  { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/yensseafood" },
  { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/yensseafood" },
  { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@yensseafood" },
] as const;

type SocialPlatform = (typeof socialLinks)[number]["platform"];

export default function BusinessFooter() {
  return (
    <footer className="border-t border-[#35434A] bg-[#252A2B] text-[#D6DEE0]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Image alt="元家" className="h-auto w-28 brightness-110" height={54} src="/yens-logo.png" width={180} />
          <p className="mt-5 text-sm leading-7">元家企業股份有限公司<br />YEN &amp; Brothers Enterprise CO., LTD.</p>
          <p className="mt-3 text-xs leading-6 text-[#AEBBBE]">242 新北市新莊區新北大道二段 217 號 14 樓<br />代表號：(02) 8521-1230</p>
          <nav aria-label="元家官方社群" className="mt-6 flex flex-wrap gap-3">
            {socialLinks.map((social) => (
              <a aria-label={`前往元家 ${social.label}（另開新分頁）`} className="grid size-9 place-items-center rounded-full border border-[#65757A] text-[#D6DEE0] transition duration-200 hover:-translate-y-0.5 hover:border-[#8EC2D9] hover:bg-[#8EC2D9] hover:text-[#252A2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href={social.href} key={social.platform} rel="noreferrer" target="_blank">
                <SocialIcon platform={social.platform} />
              </a>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-[#8EC2D9]">採購服務</p>
          <nav className="mt-4 space-y-3 text-sm">
            <Link className="block hover:text-white" href="/business/catalog">企業型錄</Link>
            <Link className="block hover:text-white" href="/business/product-finder">需求篩選</Link>
            <Link className="block hover:text-white" href="/business/rfq">詢價紀錄</Link>
          </nav>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-[#8EC2D9]">品牌故事</p>
          <nav className="mt-4 space-y-3 text-sm">
            <Link className="block hover:text-white" href="/business/about/company">企業介紹</Link>
            <Link className="block hover:text-white" href="/business/about/strengths">企業優勢</Link>
            <Link className="block hover:text-white" href="/business/about/milestones">發展歷程</Link>
          </nav>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-[#8EC2D9]">合作與責任</p>
          <nav className="mt-4 space-y-3 text-sm">
            <Link className="block hover:text-white" href="/business/about/quality-safety">品質與食安</Link>
            <Link className="block hover:text-white" href="/business/about/supply-service">供應與服務</Link>
            <Link className="block hover:text-white" href="/business/about/sustainability">永續責任</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-[#3A464A] px-5 py-4 text-center text-xs text-[#9EAAAD]">© {new Date().getFullYear()} YEN &amp; Brothers Enterprise CO., LTD. All rights reserved.</div>
    </footer>
  );
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === "youtube") return <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
  if (platform === "line") return <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24"><path d="M20.4 10.3c0-3.8-3.8-6.9-8.4-6.9s-8.4 3.1-8.4 6.9 3.8 6.9 8.4 6.9c.7 0 1.4-.1 2.1-.3l3.1 2.2c.3.2.8 0 .8-.4l-.2-3.2c1.6-1.3 2.6-3.1 2.6-5.2Zm-12 1.8H6.8V8h1.6v4.1Zm3.2 0H10V8h1.6l2.1 2.8V8h1.6v4.1h-1.6l-2.1-2.8v2.8Zm5.6 0h-1.6V8h1.6v4.1Z" /></svg>;
  if (platform === "facebook") return <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24"><path d="M13.7 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.2H8.6V14H11v7h2.7Z" /></svg>;
  if (platform === "instagram") return <svg aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24"><rect height="15" rx="4" width="15" x="4.5" y="4.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.3" cy="6.8" fill="currentColor" r=".8" stroke="none" /></svg>;
  return <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24"><path d="M16.7 3c.3 2.2 1.5 3.6 3.6 3.8v3.1c-1.3.1-2.5-.3-3.5-1v6.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.4V3h3Z" /></svg>;
}
