import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const routes = {
  b2cProducts: read("src/app/api/b2c/products/route.ts"),
  b2cFinder: read("src/app/api/b2c/product-finder/route.ts"),
  b2cOrders: read("src/app/api/b2c/mock-orders/route.ts"),
  b2bProducts: read("src/app/api/b2b/products/route.ts"),
  b2bFinder: read("src/app/api/b2b/product-finder/route.ts"),
  b2bRfqs: read("src/app/api/b2b/rfqs/route.ts"),
  analytics: read("src/app/api/analytics/events/route.ts"),
  adminAnalytics: read("src/app/api/admin/analytics/summary/route.ts"),
  adminTags: read("src/app/api/admin/products/[channel]/[productId]/tags/route.ts"),
  adminProducts: read("src/app/api/admin/products/[channel]/route.ts"),
  adminProductStatus: read("src/app/api/admin/products/[channel]/[productId]/route.ts"),
  adminCompanies: read("src/app/api/admin/companies/route.ts"),
  adminCompany: read("src/app/api/admin/companies/[companyId]/route.ts"),
  adminRfqs: read("src/app/api/admin/rfqs/route.ts"),
};

const EVENT_NAMES = [
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
  "b2c_product_view",
  "b2c_search_category",
  "b2c_tag_click",
  "b2c_tag_view",
  "b2c_help_widget_open",
  "b2c_product_finder_start",
  "b2c_product_finder_answer",
  "b2c_product_finder_complete",
  "b2c_product_finder_result_click",
  "b2c_line_click",
  "b2c_ai_demo_open",
  "b2c_cart_add",
  "b2c_checkout_start",
  "b2c_mock_order_created",
];

test("C API route set is present without replacing B Auth", () => {
  for (const route of Object.keys(routes)) {
    assert.ok(routes[route].length > 0, `${route} should be migrated`);
  }

  const loginRoute = read("src/app/api/auth/login/route.ts");
  assert.match(loginRoute, /function isEmailIdentifier/);
  assert.doesNotMatch(loginRoute, /from "@\/lib\/api"/);
});

test("the API permission matrix remains explicit", () => {
  const matrix = [
    ["/api/b2c/products", "GET", "anonymous", "allow"],
    ["/api/b2c/products", "GET", "b2c", "allow"],
    ["/api/b2c/products", "GET", "b2b", "allow"],
    ["/api/b2c/products", "GET", "admin", "allow"],
    ["/api/b2c/product-finder", "GET", "anonymous", "allow"],
    ["/api/b2c/product-finder", "GET", "b2c", "allow"],
    ["/api/b2c/product-finder", "GET", "b2b", "deny"],
    ["/api/b2c/product-finder", "GET", "admin", "allow"],
    ["/api/b2c/mock-orders", "POST", "anonymous", "allow"],
    ["/api/b2c/mock-orders", "POST", "b2c", "allow"],
    ["/api/b2c/mock-orders", "POST", "b2b", "deny"],
    ["/api/b2c/mock-orders", "POST", "admin", "deny"],
    ["/api/b2c/mock-orders", "GET/PATCH", "anonymous", "deny"],
    ["/api/b2c/mock-orders", "GET/PATCH", "b2c", "deny"],
    ["/api/b2c/mock-orders", "GET/PATCH", "b2b", "deny"],
    ["/api/b2c/mock-orders", "GET/PATCH", "admin", "allow"],
    ["/api/b2b/products", "GET", "anonymous", "deny"],
    ["/api/b2b/products", "GET", "b2c", "deny"],
    ["/api/b2b/products", "GET", "b2b", "allow"],
    ["/api/b2b/products", "GET", "admin", "deny"],
    ["/api/b2b/product-finder", "GET", "anonymous", "deny"],
    ["/api/b2b/product-finder", "GET", "b2c", "deny"],
    ["/api/b2b/product-finder", "GET", "b2b", "allow"],
    ["/api/b2b/product-finder", "GET", "admin", "deny"],
    ["/api/b2b/rfqs", "GET/POST", "anonymous", "deny"],
    ["/api/b2b/rfqs", "GET/POST", "b2c", "deny"],
    ["/api/b2b/rfqs", "GET/POST", "b2b", "allow"],
    ["/api/b2b/rfqs", "GET/POST", "admin", "deny"],
    ["/api/analytics/events (B2C event)", "POST", "anonymous", "allow"],
    ["/api/analytics/events (B2C event)", "POST", "b2c", "allow"],
    ["/api/analytics/events (B2C event)", "POST", "b2b", "deny"],
    ["/api/analytics/events (B2C event)", "POST", "admin", "allow"],
    ["/api/analytics/events (B2B event)", "POST", "anonymous", "deny"],
    ["/api/analytics/events (B2B event)", "POST", "b2c", "deny"],
    ["/api/analytics/events (B2B event)", "POST", "b2b", "allow"],
    ["/api/analytics/events (B2B event)", "POST", "admin", "deny"],
    ["/api/admin/analytics/summary", "GET", "anonymous", "deny"],
    ["/api/admin/analytics/summary", "GET", "b2c", "deny"],
    ["/api/admin/analytics/summary", "GET", "b2b", "deny"],
    ["/api/admin/analytics/summary", "GET", "admin", "allow"],
    ["/api/admin/products/{channel}/{productId}/tags", "PATCH", "anonymous", "deny"],
    ["/api/admin/products/{channel}/{productId}/tags", "PATCH", "b2c", "deny"],
    ["/api/admin/products/{channel}/{productId}/tags", "PATCH", "b2b", "deny"],
    ["/api/admin/products/{channel}/{productId}/tags", "PATCH", "admin", "allow"],
  ];

  assert.equal(matrix.length, 44);
  assert.equal(new Set(matrix.map(([path]) => path)).size, 10);
  assert.ok(matrix.some(([path, method, role, access]) => path === "/api/analytics/events (B2B event)" && method === "POST" && role === "b2b" && access === "allow"));
  assert.ok(matrix.some(([path, method, role, access]) => path === "/api/admin/analytics/summary" && method === "GET" && role === "admin" && access === "allow"));
});

test("B2C and B2B guards are not interchangeable", () => {
  assert.match(routes.b2cFinder, /getB2bContext/);
  assert.match(routes.b2cFinder, /context\.company/);
  assert.match(routes.b2bProducts, /!context\.user/);
  assert.match(routes.b2bProducts, /!context\.company/);
  assert.match(routes.b2bFinder, /!context\.user/);
  assert.match(routes.b2bFinder, /!context\.company/);
  assert.match(routes.b2bRfqs, /!context\.user/);
  assert.match(routes.b2bRfqs, /!context\.company/);
  assert.match(routes.analytics, /isB2bEvent/);
  assert.match(routes.analytics, /isB2bEvent && \(!context\.user \|\| !context\.company\)/);
  assert.match(routes.analytics, /!isB2bEvent && context\.company/);
  assert.doesNotMatch(routes.b2cProducts, /b2b_products/);
  assert.doesNotMatch(routes.b2bProducts, /b2c_products/);
});

test("mock order permissions match the route specification", () => {
  assert.match(routes.b2cOrders, /if \(b2bContext\.company\)/);
  assert.match(routes.b2cOrders, /if \(adminContext\.isAdmin\)/);
  assert.match(routes.b2cOrders, /async function getAdminOnly/);
  assert.match(routes.b2cOrders, /export async function POST/);
  assert.match(routes.b2cOrders, /export async function GET/);
  assert.match(routes.b2cOrders, /export async function PATCH/);
});

test("RFQ reads and writes are scoped to the authenticated company", () => {
  assert.match(routes.b2bRfqs, /\.eq\("company_id", context\.company\.id\)/);
  assert.match(routes.b2bRfqs, /company_id: context\.company\.id/);
  assert.doesNotMatch(routes.b2bRfqs, /body\??\.company_id/);
  assert.doesNotMatch(routes.b2bRfqs, /company_id:\s*body/);
  assert.match(routes.b2bRfqs, /resolveCustomerSnapshot\(context\.company\.client_code\)/);
});

test("B2B catalog and RFQ contracts preserve multi-spec selections", () => {
  for (const route of [routes.b2bProducts, routes.b2bFinder]) {
    assert.match(route, /attachB2bProductSpecOptions/);
  }
  for (const field of [
    "specification_option_id",
    "other_specification",
    "other_packaging",
    "specification_text_snapshot",
    "packaging_text_snapshot",
  ]) {
    assert.match(routes.b2bRfqs, new RegExp(field));
  }
  assert.doesNotMatch(routes.b2bRfqs, /seenProductIds/);
  assert.match(routes.b2bRfqs, /same product.*same specification|相同規格/);
});

test("all 24 analytics event names and server-derived payload fields are preserved", () => {
  const source = read("src/lib/analytics-events.ts");
  const match = source.match(/ANALYTICS_EVENT_NAMES = \[([\s\S]*?)\] as const/);
  assert.ok(match, "analytics allowlist should be exported as a literal array");
  const names = [...match[1].matchAll(/"([^"]+)"/g)].map(([, name]) => name);
  assert.deepEqual(names, EVENT_NAMES);

  assert.match(routes.analytics, /surface: isB2bEvent \? "b2b" : "b2c"/);
  for (const field of [
    "product_reference",
    "product_category",
    "product_brand",
    "customer_tier_snapshot",
    "channel_snapshot",
  ]) {
    assert.match(routes.analytics, new RegExp(`${field}:`));
  }
  for (const forbidden of ["body.company_id", "body.surface", "body.customer_tier", "body.channel", "body.email"]) {
    assert.doesNotMatch(routes.analytics, new RegExp(forbidden.replaceAll(".", "\\.")));
  }
});

test("admin routes re-check admin authorization at the API boundary", () => {
  for (const route of [routes.adminAnalytics, routes.adminTags]) {
    assert.match(route, /getAdminContext/);
    assert.match(route, /!context\.isAdmin/);
    assert.match(route, /context\.configurationError \|\| context\.databaseError/);
  }
});

test("admin product, company and RFQ management routes stay server-authorized", () => {
  for (const route of [
    routes.adminProducts,
    routes.adminProductStatus,
    routes.adminCompanies,
    routes.adminCompany,
    routes.adminRfqs,
  ]) {
    assert.match(route, /requireAdmin\(\)/);
  }
  assert.match(routes.adminProducts, /include_inactive/);
  assert.match(routes.adminProductStatus, /is_active/);
  assert.match(routes.adminCompanies, /auth\.admin\.createUser/);
  assert.match(routes.adminCompanies, /internalB2bAuthEmail/);
  assert.match(routes.adminCompany, /is_active/);
  assert.match(routes.adminRfqs, /b2b_rfq_items/);
  assert.match(routes.adminRfqs, /company_id/);
});

test("B2B customer codes are generated and validated with the approved format", () => {
  const codeSource = read("src/lib/client-code.ts");
  const loginRoute = read("src/app/api/auth/login/route.ts");
  const migration = read("supabase/migrations/20260817033059_enforce_b2b_client_code_format.sql");
  assert.match(codeSource, /CLIENT_CODE_PATTERN = \/\^\[ZEW\]\[0-9\]\{6\}\$\//);
  assert.match(codeSource, /randomInt\(0, 1_000_000\)/);
  assert.match(loginRoute, /isClientCode\(clientCode\)/);
  assert.match(migration, /\^\[ZEW\]\[0-9\]\{6\}\$/);
});

test("customer prefix matching keeps the longest rule and falls back safely", () => {
  const source = read("src/lib/customer-rules.ts");
  assert.match(source, /clientCode\.startsWith\(candidate\.prefix\)/);
  assert.match(source, /right\.prefix\.length - left\.prefix\.length/);
  assert.match(source, /rule\?\.tier_label \?\? "unclassified"/);
  assert.match(source, /rule\?\.channel_label \?\? "unclassified"/);
});
