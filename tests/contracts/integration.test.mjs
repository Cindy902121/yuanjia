import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.CONTRACT_TEST_BASE_URL?.replace(/\/$/, "");

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

const credentials = {
  b2c: process.env.CONTRACT_TEST_B2C_EMAIL && process.env.CONTRACT_TEST_B2C_PASSWORD
    ? { identifier: process.env.CONTRACT_TEST_B2C_EMAIL, password: process.env.CONTRACT_TEST_B2C_PASSWORD }
    : null,
  b2b: process.env.CONTRACT_TEST_B2B_IDENTIFIER && process.env.CONTRACT_TEST_B2B_PASSWORD
    ? { identifier: process.env.CONTRACT_TEST_B2B_IDENTIFIER, password: process.env.CONTRACT_TEST_B2B_PASSWORD }
    : null,
  admin: process.env.CONTRACT_TEST_ADMIN_EMAIL && process.env.CONTRACT_TEST_ADMIN_PASSWORD
    ? { identifier: process.env.CONTRACT_TEST_ADMIN_EMAIL, password: process.env.CONTRACT_TEST_ADMIN_PASSWORD }
    : null,
  otherB2b: process.env.CONTRACT_TEST_B2B_OTHER_IDENTIFIER && process.env.CONTRACT_TEST_B2B_OTHER_PASSWORD
    ? { identifier: process.env.CONTRACT_TEST_B2B_OTHER_IDENTIFIER, password: process.env.CONTRACT_TEST_B2B_OTHER_PASSWORD }
    : null,
};

const integrationReady = Boolean(baseUrl && credentials.b2c && credentials.b2b && credentials.admin);

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
}

function cookiesFrom(response) {
  return (response.headers.getSetCookie?.() ?? [])
    .map((cookie) => cookie.split(";", 1)[0])
    .join("; ");
}

async function login(account) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(account),
  });
  assert.equal(response.status, 200, `login failed for ${account.identifier}`);
  return cookiesFrom(response);
}

async function json(response) {
  return response.json();
}

test(
  "running API permission matrix covers anonymous, B2C, B2B and Admin",
  { skip: integrationReady ? false : "set CONTRACT_TEST_BASE_URL and the three demo credential pairs to run" },
  async () => {
    const b2cCookies = await login(credentials.b2c);
    const b2bCookies = await login(credentials.b2b);
    const adminCookies = await login(credentials.admin);

    const anonymousProductsResponse = await request("/api/b2c/products");
    assert.equal(anonymousProductsResponse.status, 200);
    const anonymousProducts = await json(anonymousProductsResponse);
    const productId = anonymousProducts.products?.[0]?.id;
    assert.ok(productId, "the B2C fixture needs at least one product");

    const orderBody = JSON.stringify({
      recipient_name: "契約測試",
      recipient_phone: "0900000000",
      recipient_email: "contract-test@example.com",
      delivery_address: "台北市測試地址",
      privacy_consent_at: new Date().toISOString(),
      items: [{ product_id: productId, quantity: 1 }],
    });
    assert.equal((await request("/api/b2c/mock-orders", { method: "POST", body: orderBody })).status, 201);
    assert.equal((await request("/api/b2b/products")).status, 401);
    assert.equal((await request("/api/admin/analytics/summary")).status, 401);
    assert.equal((await request("/api/b2c/mock-orders")).status, 401);

    assert.equal((await request("/api/b2c/products", { headers: { cookie: b2cCookies } })).status, 200);
    assert.equal((await request("/api/b2b/products", { headers: { cookie: b2cCookies } })).status, 403);
    assert.equal((await request("/api/b2c/mock-orders", { method: "POST", headers: { cookie: b2cCookies }, body: orderBody })).status, 201);
    assert.equal((await request("/api/b2c/mock-orders", { method: "GET", headers: { cookie: b2cCookies } })).status, 403);

    assert.equal((await request("/api/b2b/products", { headers: { cookie: b2bCookies } })).status, 200);
    assert.equal((await request("/api/b2b/rfqs", { headers: { cookie: b2bCookies } })).status, 200);
    assert.equal((await request("/api/b2c/product-finder?conditions=fish", { headers: { cookie: b2bCookies } })).status, 403);
    assert.equal((await request("/api/b2c/mock-orders", { headers: { cookie: b2bCookies } })).status, 403);

    assert.equal((await request("/api/admin/analytics/summary", { headers: { cookie: adminCookies } })).status, 200);
    assert.equal((await request("/api/b2c/mock-orders", { method: "GET", headers: { cookie: adminCookies } })).status, 200);
    assert.equal((await request("/api/b2c/mock-orders", { method: "POST", headers: { cookie: adminCookies }, body: JSON.stringify({}) })).status, 403);
  },
);

test(
  "all 24 event names accept the documented minimal payload on the correct surface",
  { skip: integrationReady ? false : "set CONTRACT_TEST_BASE_URL and the three demo credential pairs to run" },
  async () => {
    const b2bCookies = await login(credentials.b2b);
    for (const eventName of EVENT_NAMES) {
      const isB2b = eventName.startsWith("b2b_");
      const response = await request("/api/analytics/events", {
        method: "POST",
        headers: isB2b ? { cookie: b2bCookies } : undefined,
        body: JSON.stringify({ event_name: eventName }),
      });
      assert.equal(response.status, 201, `${eventName} should be accepted`);
    }

    const invalid = await request("/api/analytics/events", {
      method: "POST",
      body: JSON.stringify({ event_name: "not_in_allowlist" }),
    });
    assert.equal(invalid.status, 400);

    const b2cFromB2b = await request("/api/analytics/events", {
      method: "POST",
      headers: { cookie: b2bCookies },
      body: JSON.stringify({ event_name: "b2c_product_view" }),
    });
    assert.equal(b2cFromB2b.status, 403);
  },
);

test(
  "B2B prefix fallback is persisted as an event snapshot",
  { skip: integrationReady ? false : "set CONTRACT_TEST_BASE_URL and the three demo credential pairs to run" },
  async () => {
    const b2bCookies = await login(credentials.b2b);
    const adminCookies = await login(credentials.admin);
    const event = await request("/api/analytics/events", {
      method: "POST",
      headers: { cookie: b2bCookies },
      body: JSON.stringify({ event_name: "b2b_catalog_view" }),
    });
    assert.equal(event.status, 201);

    const summary = await request(
      "/api/admin/analytics/summary?customer_tier_snapshot=unclassified&channel_snapshot=unclassified",
      { headers: { cookie: adminCookies } },
    );
    assert.equal(summary.status, 200);
    const payload = await json(summary);
    assert.ok(payload.totals.events >= 1);
  },
);

test(
  "RFQ reads remain isolated when a second company fixture is provided",
  { skip: integrationReady && credentials.otherB2b ? false : "set CONTRACT_TEST_B2B_OTHER_IDENTIFIER/PASSWORD for cross-company isolation" },
  async () => {
    const firstCookies = await login(credentials.b2b);
    const secondCookies = await login(credentials.otherB2b);
    const productsResponse = await request("/api/b2b/products", { headers: { cookie: firstCookies } });
    assert.equal(productsResponse.status, 200);
    const products = await json(productsResponse);
    const productId = products.products?.[0]?.id;
    assert.ok(productId, "the B2B fixture needs at least one product");

    const created = await request("/api/b2b/rfqs", {
      method: "POST",
      headers: { cookie: firstCookies },
      body: JSON.stringify({ items: [{ product_id: productId, quantity: 1, unit: "箱" }] }),
    });
    assert.equal(created.status, 201);
    const createdPayload = await json(created);

    const secondList = await request("/api/b2b/rfqs", { headers: { cookie: secondCookies } });
    assert.equal(secondList.status, 200);
    const secondPayload = await json(secondList);
    assert.ok(!(secondPayload.rfqs ?? []).some((rfq) => rfq.id === createdPayload.rfqId));
  },
);

test(
  "seed rerun preserves Auth identity binding",
  { skip: process.env.CONTRACT_TEST_DATABASE_URL ? false : "set CONTRACT_TEST_DATABASE_URL to an isolated local/test database" },
  async () => {
    const databaseUrl = process.env.CONTRACT_TEST_DATABASE_URL;
    const query = "select coalesce(auth_user_id::text, '<null>') from public.companies where client_code = 'B2B-TEST-001';";
    const run = async (args) => execFileAsync("psql", [databaseUrl, "-At", "-v", "ON_ERROR_STOP=1", ...args]);
    const before = (await run(["-c", query])).stdout.trim();
    await run(["-f", "supabase/seed.sql"]);
    await run(["-f", "supabase/seed.sql"]);
    const after = (await run(["-c", query])).stdout.trim();
    assert.equal(after, before);
  },
);
