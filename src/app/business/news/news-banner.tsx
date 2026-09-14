import Image from "next/image";

export default function NewsBanner({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <section className="relative min-h-[280px] overflow-hidden bg-[#1F2723] text-white sm:min-h-[350px]">
        <Image alt="元家最新消息" className="object-cover" fill preload sizes="100vw" src="/news-banner.jpg" />
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,#0A0A09_0%,#0A0A09_70%,rgba(10,10,9,.95)_80%,rgba(10,10,9,0)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,38,52,.24)_0%,rgba(13,38,52,.1)_55%,rgba(13,38,52,.06)_100%)]" />
        <div className="relative mx-auto flex min-h-[280px] max-w-[1120px] items-end px-5 pb-11 pt-20 sm:min-h-[350px] sm:px-8 sm:pb-14 lg:px-10">
          <div className="[text-shadow:0_2px_14px_rgba(0,0,0,.42)]">
            <p className="motion-safe:animate-[news-banner-rise_.65s_.08s_both] text-[11px] font-semibold tracking-[0.24em] text-[#B7DEE5]">{kicker}</p>
            <h1 className="motion-safe:animate-[news-banner-rise_.75s_.18s_both] mt-3 font-[family-name:var(--ep-font-sans)] text-[34px] font-bold leading-[1.15] tracking-[0.02em] sm:text-[48px]">{title}</h1>
          </div>
        </div>
      </section>
      <style>{`@keyframes news-banner-rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </>
  );
}
