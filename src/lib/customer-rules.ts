import { createAdminClient } from "./supabase/admin";

export async function resolveCustomerSnapshot(clientCode: string) {
  const admin = createAdminClient();
  const { data: rules, error } = await admin
    .from("customer_prefix_rules")
    .select("prefix, tier_label, channel_label")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const rule = (rules ?? [])
    .filter(
      (candidate) =>
        typeof candidate.prefix === "string" &&
        clientCode.startsWith(candidate.prefix),
    )
    .sort((left, right) => right.prefix.length - left.prefix.length)[0];

  return {
    customerTierSnapshot: rule?.tier_label ?? "unclassified",
    channelSnapshot: rule?.channel_label ?? "unclassified",
  };
}
