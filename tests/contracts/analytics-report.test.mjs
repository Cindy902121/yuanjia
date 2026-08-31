import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function migration() {
  const filename = readdirSync(join(ROOT, "supabase/migrations")).find((entry) =>
    /_b2b_analytics_reporting\.sql$/.test(entry),
  );
  assert.ok(filename, "B2B analytics migration should exist");
  return read(join("supabase/migrations", filename));
}

test("B2B analytics schema keeps server identity snapshots private and aggregate-ready", () => {
  const source = migration();
  for (const field of [
    "actor_user_id",
    "company_id",
    "session_id",
    "customer_code_snapshot",
    "event_data",
  ]) {
    assert.match(source, new RegExp(`analytics_events[\\s\\S]*${field}`));
  }
  assert.match(source, /create table public\.analytics_export_audits/);
  assert.match(source, /enable row level security/);
  assert.match(source, /admin_b2b_analytics_summary/);
  assert.match(source, /cleanup_old_analytics_events/);
  assert.match(source, /revoke all on table public\.analytics_export_audits/);
  assert.match(source, /revoke (?:all|execute) on function public\.admin_b2b_analytics_summary/);
  assert.match(source, /eligible_events/);
  assert.match(source, /product_counts_raw/);
  assert.match(source, /finder_answer_counts_raw/);
  assert.match(source, /rfq_product_counts_raw/);
  assert.match(source, /其他（已遮罩）/);
  assert.match(source, /0 3 1 \* \*/);
});

test("analytics API uses database aggregation and records safe CSV exports", () => {
  const summary = read("src/app/api/admin/analytics/summary/route.ts");
  const exportRoute = read("src/app/api/admin/analytics/export/route.ts");
  assert.match(summary, /admin_b2b_analytics_summary/);
  assert.doesNotMatch(summary, /from\("analytics_events"\)/);
  assert.match(summary, /parseAnalyticsFilters/);
  assert.match(summary, /surface.*b2b|b2b.*surface/);
  assert.match(exportRoute, /requireAdmin|context\.role !== "admin"/);
  assert.match(exportRoute, /purpose/);
  assert.match(exportRoute, /analytics_export_audits/);
  assert.match(exportRoute, /text\/csv/);
  assert.doesNotMatch(exportRoute, /customer_code_snapshot|actor_user_id|company_id/);
});

test("event tracking accepts only structured B2B data and refreshes a first-party session cookie", () => {
  const route = read("src/app/api/analytics/events/route.ts");
  const tracker = read("src/lib/analytics/track.ts");
  assert.match(route, /event_data/);
  assert.match(route, /session_id|yuanjia_analytics_session/);
  assert.match(route, /customer_code_snapshot/);
  assert.match(route, /actor_user_id/);
  assert.match(route, /company_id/);
  assert.match(route, /rfq_id/);
  assert.match(route, /HttpOnly|httpOnly/);
  assert.match(route, /SameSite|sameSite/);
  assert.match(tracker, /trackEvent/);
  assert.match(tracker, /event_data/);
});

test("Admin exposes the B2B report and the active B2B journeys emit all ten events", () => {
  const dashboard = read("src/app/admin/admin-dashboard.tsx");
  const report = read("src/app/admin/analytics-report-panel.tsx");
  const reportLib = read("src/lib/analytics/report.ts");
  const catalog = read("src/app/business/catalog/catalog-inquiry-workspace.tsx");
  const catalogPage = read("src/app/business/catalog/page.tsx");
  const catalogTracker = read("src/app/business/catalog/catalog-tracker.tsx");
  const finder = read("src/app/business/product-finder/product-finder-client.tsx");
  const login = read("src/app/login/login-form.tsx");
  for (const eventName of [
    "b2b_login_success",
    "b2b_catalog_view",
    "b2b_product_view",
    "b2b_search_filter",
    "b2b_product_finder_start",
    "b2b_product_finder_answer",
    "b2b_product_finder_complete",
    "b2b_product_finder_result_click",
    "b2b_rfq_add",
    "b2b_rfq_submit",
  ]) {
    assert.match(`${catalog}\n${catalogPage}\n${catalogTracker}\n${finder}\n${login}`, new RegExp(eventName));
  }
  assert.match(dashboard, /analytics/);
  assert.match(dashboard, /AnalyticsReportPanel/);
  assert.match(report, /下載 CSV|CSV/);
  assert.match(report, /customer_tier_snapshot|customer_tier/);
  assert.match(reportLib, /MAX_REPORT_ROWS|takeRows/);
  assert.match(reportLib, /previous/);
  assert.ok(existsSync(join(ROOT, "src/app/api/admin/analytics/export/route.ts")));
});
