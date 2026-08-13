"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 登出 Server Action，給 Header 的登出按鈕用。
 *
 * 刻意簡化：只清除 session、導回首頁，不判斷角色、不做角色專屬的導轉邏輯
 * （例如 B2B 登出後是否該導向別的頁面）。角色相關的分流是 B 的 Auth／權限
 * 範圍，這裡不處理，避免跟他之後的設計衝突或需要重工——這點已經跟 B 確認過。
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
