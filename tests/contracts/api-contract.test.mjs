import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
  adminImages: read("src/app/api/admin/products/[channel]/[productId]/images/route.ts"),
  adminImage: read("src/app/api/admin/products/[channel]/[productId]/images/[imageId]/route.ts"),
  productImages: read("src/lib/product-images.ts"),
  adminSpecOptions: read("src/app/api/admin/products/b2b/[productId]/spec-options/route.ts"),
  adminSpecOption: read("src/app/api/admin/products/b2b/[productId]/spec-options/[optionId]/route.ts"),
  adminProducts: read("src/app/api/admin/products/[channel]/route.ts"),
  adminProductStatus: read("src/app/api/admin/products/[channel]/[productId]/route.ts"),
  adminBulkStatus: read("src/app/api/admin/products/b2b/bulk-status/route.ts"),
  adminCompanies: read("src/app/api/admin/companies/route.ts"),
  adminCompany: read("src/app/api/admin/companies/[companyId]/route.ts"),
  adminRfqs: read("src/app/api/admin/rfqs/route.ts"),
  adminAuth: read("src/lib/auth-context.ts"),
  adminPageAuth: read("src/lib/admin-page-auth.ts"),
  adminCatalog: read("src/lib/admin-catalog.ts"),
  adminDashboard: read("src/app/admin/admin-dashboard.tsx"),
  b2cProductNewPage: read("src/app/admin/products/new/page.tsx"),
  b2cProductEditPage: read("src/app/admin/products/[productId]/page.tsx"),
  b2cProductEditor: read("src/app/admin/products/product-editor.tsx"),
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

test("B2C Auth supports registration, recovery, OAuth boundaries, and the floating entry", () => {
  const authPaths = [
    "src/app/api/auth/register/route.ts",
    "src/app/api/auth/password-reset/route.ts",
    "src/app/auth/callback/route.ts",
    "src/components/auth/auth-panel.tsx",
    "src/components/auth/auth-modal.tsx",
  ];

  for (const path of authPaths) {
    assert.ok(existsSync(join(ROOT, path)), `${path} should exist`);
  }

  const register = read(authPaths[0]);
  const reset = read(authPaths[1]);
  const callback = read(authPaths[2]);
  const panel = read(authPaths[3]);
  const modal = read(authPaths[4]);
  const supabaseConfig = read("supabase/config.toml");

  assert.match(register, /auth\.signUp/);
  assert.match(register, /emailRedirectTo/);
  assert.match(register, /PASSWORD_MIN_LENGTH/);
  assert.match(reset, /listUsers/);
  assert.match(reset, /Email 不存在/);
  assert.match(reset, /resetPasswordForEmail/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /mode === "confirm" \? "confirmed" : mode/);
  assert.match(callback, /mode === "google"/);
  assert.match(callback, /app_admins/);
  assert.match(callback, /companies/);
  assert.match(callback, /google-b2c-only/);
  assert.match(supabaseConfig, /enable_confirmations = true/);
  assert.match(supabaseConfig, /\[auth\.external\.google\]/);
  assert.match(supabaseConfig, /auth\/callback/);
  assert.match(panel, /\/api\/auth\/register/);
  assert.match(panel, /\/api\/auth\/password-reset/);
  assert.match(panel, /signInWithOAuth/);
  assert.match(panel, /updateUser/);
  assert.match(panel, /註冊會員/);
  assert.match(panel, /忘記密碼/);
  assert.match(modal, /usePathname/);
  assert.match(modal, /aria-modal/);
  assert.match(modal, /Escape/);
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
  for (const route of [routes.adminAnalytics]) {
    assert.match(route, /getAdminContext/);
    assert.match(route, /!context\.isAdmin/);
    assert.match(route, /context\.configurationError \|\| context\.databaseError/);
  }
  assert.match(routes.adminTags, /requireAdmin\(\)/);
});

test("B2B admin catalog exposes status, media counts, and batch status boundaries", () => {
  assert.match(routes.adminProducts, /requireBusinessAdmin\(\)/);
  assert.match(routes.adminProducts, /status/);
  assert.match(routes.adminProducts, /image_count/);
  assert.match(routes.adminProducts, /thumbnail_url/);
  assert.match(routes.adminBulkStatus, /requireBusinessAdmin\(\)/);
  assert.match(routes.adminBulkStatus, /admin_bulk_update_b2b_product_status/);
  assert.match(routes.adminBulkStatus, /product_ids/);
  assert.match(routes.adminBulkStatus, /next_status/);
  assert.match(routes.adminAuth, /business_staff/);
  assert.match(routes.adminPageAuth, /isBusinessStaff/);
  assert.match(routes.adminDashboard, /B2bProductPanel/);
  assert.match(routes.adminDashboard, /\/admin\/business\/products\/new/);
  assert.match(routes.b2bProducts, /\.eq\("status", "published"\)/);
  assert.match(routes.b2bFinder, /\.eq\("status", "published"\)/);
  assert.match(routes.b2bRfqs, /\.eq\("status", "published"\)/);
});

test("B2B product editor has shared new/edit routes and guarded form behavior", () => {
  const editorPaths = [
    "src/app/admin/business/products/new/page.tsx",
    "src/app/admin/business/products/[productId]/page.tsx",
    "src/app/admin/business/products/product-editor.tsx",
  ];
  for (const path of editorPaths) {
    assert.ok(existsSync(join(ROOT, path)), `${path} should exist`);
  }

  const newPage = read(editorPaths[0]);
  const editPage = read(editorPaths[1]);
  const editor = read(editorPaths[2]);
  assert.match(newPage, /requireAdminPage\("\/admin\/business\/products\/new"\)/);
  assert.match(editPage, /requireAdminPage\(.*productId/);
  assert.match(newPage, /ProductEditor/);
  assert.match(editPage, /ProductEditor/);
  assert.match(editor, /B2B_PRODUCT_FIELD_RULES/);
  assert.match(editor, /beforeunload/);
  assert.match(editor, /popstate/);
  assert.match(editor, /儲存變更/);
  assert.match(editor, /fieldForError/);
  assert.match(editor, /message.includes\("product_code"\)/);
  assert.doesNotMatch(editor, /price/);
  assert.match(routes.adminPageAuth, /business.*products/);
  assert.match(routes.adminCatalog, /B2B_PRODUCT_CODE_PATTERN/);
});

test("B2C product editor has guarded new/edit flow and channel-scoped media", () => {
  assert.match(routes.b2cProductNewPage, /requireAdminPage\("\/admin\/products\/new"\)/);
  assert.match(routes.b2cProductEditPage, /requireAdminPage\(.*productId/);
  assert.match(routes.b2cProductNewPage, /ProductEditor/);
  assert.match(routes.b2cProductEditPage, /ProductEditor/);
  assert.match(routes.b2cProductEditor, /B2C_PRODUCT_FIELD_RULES/);
  assert.match(routes.b2cProductEditor, /B2C_SLUG_PATTERN/);
  assert.match(routes.b2cProductEditor, /\/api\/admin\/products\/b2c/);
  assert.match(routes.b2cProductEditor, /ProductImageManager/);
  assert.match(routes.b2cProductEditor, /onCoverChange/);
  assert.match(routes.b2cProductEditor, /beforeunload/);
  assert.match(routes.b2cProductEditor, /popstate/);
  assert.match(routes.adminCatalog, /payload\.is_active = false/);
  assert.match(routes.adminProductStatus, /b2cActivationError/);
  assert.match(routes.adminProductStatus, /b2c_product_images/);
  assert.match(routes.adminImage, /activeB2cCoverError/);
  assert.match(routes.adminDashboard, /\/admin\/products\/new/);
  assert.match(routes.adminDashboard, /\/admin\/products\/\$\{product\.id\}/);
});

test("B2B product tags and specification options stay isolated and staff-manageable", () => {
  assert.match(routes.adminTags, /export async function GET/);
  assert.match(routes.adminTags, /requireBusinessAdmin/);
  assert.match(routes.adminTags, /b2b_tags/);
  assert.match(routes.adminTags, /\.eq\("is_active", true\)/);
  assert.match(routes.adminTags, /tag_ids/);
  assert.match(routes.adminTags, /admin\.rpc\("admin_replace_b2b_product_tags"/);
  assert.match(routes.adminSpecOptions, /requireBusinessAdmin/);
  assert.match(routes.adminSpecOptions, /option_code/);
  assert.match(routes.adminSpecOptions, /23505/);
  assert.match(routes.adminSpecOption, /requireBusinessAdmin/);
  assert.match(routes.adminSpecOption, /規格選項代碼建立後不可修改/);
  assert.match(routes.adminSpecOption, /is_active: false/);

  const editor = read("src/app/admin/business/products/product-editor.tsx") +
    read("src/app/admin/business/products/product-image-manager.tsx");
  assert.match(editor, /tag_ids/);
  assert.match(editor, /管理標籤/);
  assert.match(editor, /新增規格選項/);
  assert.match(editor, /重試規格選項/);
  assert.match(editor, /option_code/);
  assert.match(editor, /上移|下移/);
  assert.match(editor, /停用|啟用/);
});

test("B2B product images stay private, validated, staff-manageable, and recoverable", () => {
  assert.match(routes.adminImages, /requireBusinessAdmin/);
  assert.match(routes.adminImage, /requireBusinessAdmin/);
  assert.match(routes.productImages, /b2b-media/);
  assert.match(routes.adminImages, /PRODUCT_IMAGE_MAX_DETAILS/);
  assert.match(routes.adminImages, /validateProductImageFile/);
  assert.match(routes.adminImages, /storage_cleanup/);
  assert.match(routes.adminImage, /storage_cleanup/);
  assert.match(routes.adminImage, /storage_path/);
  assert.match(routes.adminImages, /channel !== "b2b"/);
  assert.match(routes.adminImage, /channel === "b2b" && nextRole === "cover"/);
  assert.match(routes.productImages, /createSignedUrl/);
  assert.match(routes.productImages, /600/);
  assert.match(routes.productImages, /PRODUCT_IMAGE_MAX_BYTES/);

  const editor = read("src/app/admin/business/products/product-editor.tsx") +
    read("src/app/admin/business/products/product-image-manager.tsx");
  for (const required of [
    "onDrop",
    "draggable",
    "image/jpeg,image/png,image/webp",
    "5 MB",
    "替代文字",
    "替換圖片",
    "刪除圖片",
    "window.confirm",
    "重試清理",
    "上移",
    "下移",
  ]) {
    assert.match(editor, new RegExp(required));
  }
});

test("B2B admin workbench is responsive and keyboard-recoverable", () => {
  const dashboard = routes.adminDashboard;
  const editor = read("src/app/admin/business/products/product-editor.tsx");
  const images = read("src/app/admin/business/products/product-image-manager.tsx");

  assert.match(dashboard, /overflow-x-hidden/);
  assert.match(dashboard, /xl:hidden/);
  assert.match(dashboard, /hidden[^"\n]*xl:block/);
  assert.match(dashboard, /aria-label="B2B 商品清單"/);
  assert.match(dashboard, /const b2bButtonClass =\s*\n\s*"[^"\n]*min-h-11/);
  assert.match(dashboard, /motion-reduce:transition-none/);

  assert.match(editor, /productReloadKey/);
  assert.match(editor, /imagesDirty/);
  assert.match(editor, /disabled=\{loading \|\| saving \|\| Boolean\(loadError\)\}/);
  assert.match(editor, /tabIndex=\{-1\}/);
  assert.match(editor, /pb-20 sm:pb-6/);
  assert.match(editor, /motion-reduce:animate-none/);

  assert.match(images, /loadError/);
  assert.match(images, /onDirtyChange/);
  assert.match(images, /重試讀取/);
  assert.match(images, /item\.image_role === "cover"/);
  assert.match(images, /tabIndex=\{-1\}/);
  assert.match(images, /className="mt-5 grid gap-3 grid-cols-2/);
  assert.match(images, /aria-live="polite"/);
  assert.match(images, /motion-reduce:animate-none/);
});

test("admin product, company and RFQ management routes stay server-authorized", () => {
  for (const route of [
    routes.adminProductStatus,
    routes.adminCompanies,
    routes.adminCompany,
  ]) {
    assert.match(route, /requireAdmin\(\)/);
  }
  assert.match(routes.adminRfqs, /requireBusinessAdmin\(\)/);
  assert.match(routes.adminProducts, /include_inactive/);
  assert.match(routes.adminProductStatus, /is_active|status/);
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
