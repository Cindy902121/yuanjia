import { timingSafeEqual } from "node:crypto";

import { apiError, json } from "@/lib/api";
import { runAdminAnalyticsJobs } from "@/lib/admin-analytics-job";

function matchesSecret(received: string | null, expected: string) {
  if (!received) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return apiError("排程服務尚未設定。", 503);
  const authorization = request.headers.get("authorization");
  const received = authorization?.replace(/^Bearer\s+/i, "") || request.headers.get("x-cron-secret");
  if (!matchesSecret(received, expected)) return apiError("排程驗證失敗。", 401);

  try {
    return json(await runAdminAnalyticsJobs());
  } catch (error) {
    console.error("Admin Analytics cron failed", error);
    return apiError("目前無法執行 Analytics 排程。", 503);
  }
}
