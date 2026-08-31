import Image from "next/image";
import Link from "next/link";

export default function BusinessFooter() {
  return (
    <footer className="border-t border-[#35434A] bg-[#252A2B] text-[#D6DEE0]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Image alt="元家" className="h-auto w-28 brightness-110" height={54} src="/yens-logo.png" width={180} />
          <p className="mt-5 text-sm leading-7">元家企業股份有限公司<br />YEN &amp; Brothers Enterprise CO., LTD.</p>
          <p className="mt-3 text-xs leading-6 text-[#AEBBBE]">242 新北市新莊區新北大道二段 217 號 14 樓<br />代表號：(02) 8521-1230</p>
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
