import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  const path = join(ROOT, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

test("analytics extension domain helpers define the confirmed schedule and alert rules", () => {
  const source = read("src/lib/admin-analytics-extensions.ts");
  assert.match(source, /export function validateSavedFilterName/);
  assert.match(source, /export function resolveMonthlyRunDate/);
  assert.match(source, /export function isBusinessAnomaly/);
  assert.match(source, /export function shouldCreateAlert/);
  assert.match(source, /50/);
  assert.match(source, /10/);
  assert.match(source, /Asia\/Taipei/);
});

test("analytics extension migration keeps every new resource server-only", () => {
  const source = read("supabase/migrations/20260911153845_admin_analytics_extensions.sql");
  for (const table of [
    "admin_analytics_saved_filters",
    "admin_analytics_schedules",
    "admin_analytics_export_runs",
    "admin_analytics_alerts",
  ]) {
    assert.match(source, new RegExp(`create table public\\.${table}`));
    assert.match(source, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(source, new RegExp(`revoke all on table public\\.${table}`));
    assert.match(source, new RegExp(`grant all on table public\\.${table} to service_role`));
  }
  assert.match(source, /insert into storage\.buckets/);
  assert.match(source, /admin_b2b_analytics_company_detail/);
  assert.match(source, /create unique index.*saved_filters.*lower\(name\)/s);
});

test("analytics extension API and cron routes re-check admin and cron secret boundaries", () => {
  const auth = read("src/lib/admin-auth.ts");
  const routeSources = [
    "src/app/api/admin/analytics/saved-filters/route.ts",
    "src/app/api/admin/analytics/saved-filters/[id]/route.ts",
    "src/app/api/admin/analytics/drilldown/route.ts",
    "src/app/api/admin/analytics/schedules/route.ts",
    "src/app/api/admin/analytics/schedules/[id]/route.ts",
    "src/app/api/admin/analytics/exports/route.ts",
    "src/app/api/admin/analytics/alerts/route.ts",
    "src/app/api/cron/admin-analytics/route.ts",
  ].map(read);
  assert.match(auth, /getAdminContext/);
  assert.match(auth, /allowedRoles\.includes\(context\.role\)/);
  for (const source of routeSources.slice(0, -1)) {
    assert.match(source, /requireAdmin/);
    assert.match(source, /apiError/);
  }
  assert.match(routeSources.at(-1), /CRON_SECRET/);
  assert.match(routeSources.at(-1), /export async function GET/);
});

test("analytics panel exposes the shared filters, alert, schedule and drilldown entry points", () => {
  const panel = read("src/app/admin/analytics-report-panel.tsx");
  for (const label of ["常用篩選", "排程匯出", "告警中心", "查看客戶明細", "匯出歷史"]) {
    assert.match(panel, new RegExp(label));
  }
  assert.match(panel, /少於 5 家.*不可下鑽|不可下鑽/);
  assert.match(panel, /\/api\/admin\/analytics\/drilldown/);
});
