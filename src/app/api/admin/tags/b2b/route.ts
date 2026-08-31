import { apiError, json } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireBusinessAdmin();
  if (guard.response) return guard.response;

  try {
    const admin = createAdminClient();
    const { data: tags, error } = await admin
      .from("b2b_tags")
      .select("id, slug, name, group_name")
      .eq("is_active", true)
      .order("group_name")
      .order("name");
    if (error) return apiError("目前無法讀取 B2B 標籤。", 503);
    return json({ tags: tags ?? [] });
  } catch {
    return apiError("目前無法讀取 B2B 標籤。", 503);
  }
}
