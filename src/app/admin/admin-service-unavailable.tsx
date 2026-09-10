"use client";

import { useRouter } from "next/navigation";

export function AdminServiceUnavailable() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center text-[#17242A]">
      <p className="text-sm font-semibold tracking-[0.2em] text-[#A43B34]">503</p>
      <h1 className="text-2xl font-bold">管理服務暫時無法使用</h1>
      <p className="max-w-lg text-sm leading-6 text-[#536168]">
        目前無法連線至管理資料服務，請稍後再試。尚未完成的操作不會自動重送。
      </p>
      <button
        type="button"
        className="min-h-11 rounded-lg bg-[#005DAA] px-5 py-2 text-sm font-semibold text-white hover:bg-[#00457F]"
        onClick={() => router.refresh()}
      >
        重試
      </button>
    </main>
  );
}
