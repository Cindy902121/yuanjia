import { requireBusinessAdmin } from "@/lib/admin-auth";
import { json } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireBusinessAdmin();
  if (guard.response) return guard.response;
  const admin = createAdminClient();
  // Exact HEAD counts are independent of list pagination and the PostgREST row limit.
  const requests = {
    new: admin.from("b2b_rfqs").select("id", { count: "exact", head: true }).eq("status", "new"),
    processing: admin.from("b2b_rfqs").select("id", { count: "exact", head: true }).eq("status", "processing"),
    draft: admin.from("b2b_products").select("id", { count: "exact", head: true }).eq("status", "draft"),
    review: admin.from("b2b_products").select("id", { count: "exact", head: true }).eq("status", "review"),
    published: admin.from("b2b_products").select("id", { count: "exact", head: true }).eq("status", "published"),
    offline: admin.from("b2b_products").select("id", { count: "exact", head: true }).eq("status", "offline"),
    missing_images: admin.from("b2b_products").select("id,b2b_product_images()", { count: "exact", head: true }).is("b2b_product_images", null),
  };
  const entries = Object.entries(requests);
  const results = await Promise.allSettled(entries.map(async ([, query]) => {
    const result = await query;
    if (result.error || result.count === null) throw new Error("讀取失敗");
    return result.count;
  }));
  return json({
    metrics: Object.fromEntries(entries.map(([key], index) => {
      const result = results[index];
      return [key, result.status === "fulfilled" ? result.value : null];
    })),
    updated_at: new Date().toISOString(),
  });
}
