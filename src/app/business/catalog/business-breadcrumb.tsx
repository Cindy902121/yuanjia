import Link from "next/link";

export default function BusinessBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="麵包屑導覽" className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-[#718087]">
      <Link className="shrink-0 transition hover:text-[#005DAA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" href="/business">
        首頁
      </Link>
      <span aria-hidden="true" className="text-[#B7C3C9]">/</span>
      <span aria-current="page" className="truncate font-medium text-[#536168]">{current}</span>
    </nav>
  );
}
