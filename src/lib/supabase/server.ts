import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component 渲染途中無法寫入 cookie（例如首頁這種一般
            // GET 頁面渲染途中，Supabase 判斷需要刷新 token 時會呼叫到這
            // 裡）。真正的 session 刷新交給 middleware 處理，這裡寫不進去
            // 可以安全忽略，不代表登入狀態壞掉。
          }
        },
      },
    },
  );
}
