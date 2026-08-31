import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
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

const inactiveB2bIdentifier = process.env.CONTRACT_TEST_B2B_INACTIVE_IDENTIFIER;
const integrationReady = Boolean(baseUrl && credentials.b2c && credentials.b2b && credentials.admin);

const createdRows = {
  eventIds: new Set(),
  orderIds: new Set(),
  rfqIds: new Set(),
  companyIds: new Set(),
};

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

async function createOrder(body, options = {}) {
  const response = await request("/api/b2c/mock-orders", {
    method: "POST",
    ...options,
    body,
  });
  assert.equal(response.status, 201);
  const payload = await json(response);
  assert.ok(payload.orderId, "the order response needs an orderId");
  createdRows.orderIds.add(payload.orderId);
  return payload;
}

async function recordEvent(response, label) {
  assert.equal(response.status, 201, `${label} should be accepted`);
  const payload = await json(response);
  assert.ok(payload.event?.id, `${label} response needs an event id`);
  createdRows.eventIds.add(payload.event.id);
  return payload;
}

async function cleanupCreatedRows() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    return;
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const eventIds = [...createdRows.eventIds];
  if (eventIds.length > 0) {
    const { error } = await admin.from("analytics_events").delete().in("id", eventIds);
    assert.ifError(error);
  }

  const rfqIds = [...createdRows.rfqIds];
  if (rfqIds.length > 0) {
    const { error: itemError } = await admin
      .from("b2b_rfq_items")
      .delete()
      .in("rfq_id", rfqIds);
    assert.ifError(itemError);
    const { error } = await admin.from("b2b_rfqs").delete().in("id", rfqIds);
    assert.ifError(error);
  }

  const orderIds = [...createdRows.orderIds];
  if (orderIds.length > 0) {
    const { error: itemError } = await admin
      .from("b2c_order_items")
      .delete()
      .in("mock_order_id", orderIds);
    assert.ifError(itemError);
    const { error } = await admin.from("b2c_orders").delete().in("id", orderIds);
    assert.ifError(error);
  }

  const companyIds = [...createdRows.companyIds];
  if (companyIds.length > 0) {
    const { data: companies, error: selectError } = await admin
      .from("companies")
      .select("id, auth_user_id")
      .in("id", companyIds);
    assert.ifError(selectError);

    const { error: deleteCompanyError } = await admin
      .from("companies")
      .delete()
      .in("id", companyIds);
    assert.ifError(deleteCompanyError);

    for (const authUserId of (companies ?? []).map((company) => company.auth_user_id).filter(Boolean)) {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      assert.ifError(error);
    }
  }
}

async function setCustomerPrefixRuleActive(prefix, isActive) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error: readError } = await admin
    .from("customer_prefix_rules")
    .select("is_active")
    .eq("prefix", prefix)
    .single();
  assert.ifError(readError);

  const { error: updateError } = await admin
    .from("customer_prefix_rules")
    .update({ is_active: isActive })
    .eq("prefix", prefix);
  assert.ifError(updateError);
  return data.is_active;
}

function runWithInput(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(`${command} exited with code ${code}: ${stderr}`);
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });

    child.stdin.end(input);
  });
}

async function runDatabaseCommand(databaseUrl, args) {
  try {
    return await execFileAsync("psql", [databaseUrl, "-At", "-v", "ON_ERROR_STOP=1", ...args]);
  } catch (error) {
    const hostname = new URL(databaseUrl).hostname;
    if (error.code !== "ENOENT" || !["127.0.0.1", "localhost"].includes(hostname)) {
      throw error;
    }

    const dockerArgs = [
      "exec",
      "-i",
      process.env.CONTRACT_TEST_DB_CONTAINER ?? "supabase_db_supabase",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
    ];
    const fileIndex = args.indexOf("-f");
    if (fileIndex >= 0) {
      const sql = await readFile(args[fileIndex + 1]);
      dockerArgs.push("-f", "-", ...args.slice(0, fileIndex));
      return runWithInput("docker", dockerArgs, sql);
    }

    dockerArgs.push(...args);
    return runWithInput("docker", dockerArgs);
  }
}

test.after(cleanupCreatedRows);

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
    await createOrder(orderBody);
    assert.equal((await request("/api/b2b/products")).status, 401);
    assert.equal((await request("/api/admin/analytics/summary")).status, 401);
    assert.equal((await request("/api/b2c/mock-orders")).status, 401);

    assert.equal((await request("/api/b2c/products", { headers: { cookie: b2cCookies } })).status, 200);
    assert.equal((await request("/api/b2b/products", { headers: { cookie: b2cCookies } })).status, 403);
    await createOrder(orderBody, { headers: { cookie: b2cCookies } });
    assert.equal((await request("/api/b2c/mock-orders", { method: "GET", headers: { cookie: b2cCookies } })).status, 403);

    const b2bCatalogResponse = await request("/api/b2b/products", { headers: { cookie: b2bCookies } });
    assert.equal(b2bCatalogResponse.status, 200);
    const b2bCatalog = await json(b2bCatalogResponse);
    assert.ok(
      !(b2bCatalog.products ?? []).some(
        (product) => product.product_code === "B2B-TEST-INACTIVE-001",
      ),
      "inactive B2B fixture must not appear in the catalog",
    );
    assert.equal((await request("/api/b2b/rfqs", { headers: { cookie: b2bCookies } })).status, 200);
    assert.equal((await request("/api/b2c/product-finder?conditions=fish", { headers: { cookie: b2bCookies } })).status, 403);
    assert.equal((await request("/api/b2c/mock-orders", { headers: { cookie: b2bCookies } })).status, 403);

    assert.equal((await request("/api/admin/analytics/summary", { headers: { cookie: adminCookies } })).status, 200);
    assert.equal((await request("/api/b2c/mock-orders", { method: "GET", headers: { cookie: adminCookies } })).status, 200);
    assert.equal((await request("/api/b2c/mock-orders", { method: "POST", headers: { cookie: adminCookies }, body: JSON.stringify({}) })).status, 403);
  },
);

test(
  "Admin pages and APIs support the acceptance workflow",
  { skip: integrationReady ? false : "set CONTRACT_TEST_BASE_URL and the three demo credential pairs to run" },
  async () => {
    const adminCookies = await login(credentials.admin);

    const adminPage = await request("/admin", { headers: { cookie: adminCookies } });
    assert.equal(adminPage.status, 200);
    const businessPage = await request("/admin/business", { headers: { cookie: adminCookies } });
    assert.equal(businessPage.status, 200);

    const anonymousPage = await request("/admin");
    assert.ok([307, 308].includes(anonymousPage.status));
    assert.match(anonymousPage.headers.get("location") ?? "", /\/login\?next=/);

    for (const role of ["b2c", "b2b"]) {
      const cookies = await login(credentials[role]);
      const adminRoute = await request("/admin", { headers: { cookie: cookies } });
      const businessRoute = await request("/admin/business", { headers: { cookie: cookies } });
      assert.ok([307, 308].includes(adminRoute.status));
      assert.ok([307, 308].includes(businessRoute.status));
      const expectedLocation = role === "b2b" ? "/business" : "/";
      assert.equal(new URL(adminRoute.headers.get("location"), baseUrl).pathname, expectedLocation);
      assert.equal(new URL(businessRoute.headers.get("location"), baseUrl).pathname, expectedLocation);
    }

    for (const channel of ["b2c", "b2b"]) {
      const response = await request(`/api/admin/products/${channel}?include_inactive=true`, {
        headers: { cookie: adminCookies },
      });
      assert.equal(response.status, 200);
      const payload = await json(response);
      assert.ok(Array.isArray(payload.products));
      assert.ok(payload.products.length > 0, `${channel} admin catalog needs at least one product`);
    }

    const b2cProductsResponse = await request("/api/admin/products/b2c?include_inactive=true", {
      headers: { cookie: adminCookies },
    });
    const b2cProductsPayload = await json(b2cProductsResponse);
    const b2cProduct = b2cProductsPayload.products?.[0];
    assert.ok(b2cProduct?.id, "the B2C admin catalog needs a product id");
    const originalB2cStatus = b2cProduct.is_active;
    try {
      const disableB2c = await request(`/api/admin/products/b2c/${b2cProduct.id}`, {
        method: "PATCH",
        headers: { cookie: adminCookies },
        body: JSON.stringify({ is_active: false }),
      });
      assert.equal(disableB2c.status, 200);
      const disabledB2cList = await request("/api/admin/products/b2c?include_inactive=false", {
        headers: { cookie: adminCookies },
      });
      const disabledB2cPayload = await json(disabledB2cList);
      assert.ok(!(disabledB2cPayload.products ?? []).some((product) => product.id === b2cProduct.id));
    } finally {
      const restoreB2c = await request(`/api/admin/products/b2c/${b2cProduct.id}`, {
        method: "PATCH",
        headers: { cookie: adminCookies },
        body: JSON.stringify({ is_active: originalB2cStatus }),
      });
      assert.equal(restoreB2c.status, 200);
    }

    const b2bProductsResponse = await request("/api/admin/products/b2b?include_inactive=true", {
      headers: { cookie: adminCookies },
    });
    const b2bProductsPayload = await json(b2bProductsResponse);
    const b2bProduct = b2bProductsPayload.products?.[0];
    assert.ok(b2bProduct?.id, "the B2B admin catalog needs a product id");
    const originalB2bStatus = b2bProduct.is_active;
    const b2bStatus = b2bProduct.status ?? (b2bProduct.is_active ? "published" : "offline");
    try {
      if (b2bStatus === "published") {
        const invalidB2bTransition = await request(`/api/admin/products/b2b/${b2bProduct.id}`, {
          method: "PATCH",
          headers: { cookie: adminCookies },
          body: JSON.stringify({ status: "draft" }),
        });
        assert.equal(invalidB2bTransition.status, 409);
      }
      const disableB2b = await request(`/api/admin/products/b2b/${b2bProduct.id}`, {
        method: "PATCH",
        headers: { cookie: adminCookies },
        body: JSON.stringify({ is_active: false }),
      });
      assert.equal(disableB2b.status, 200);
      const disabledB2bList = await request("/api/admin/products/b2b?include_inactive=false", {
        headers: { cookie: adminCookies },
      });
      const disabledB2bPayload = await json(disabledB2bList);
      assert.ok(!(disabledB2bPayload.products ?? []).some((product) => product.id === b2bProduct.id));
    } finally {
      const restoreB2b = await request(`/api/admin/products/b2b/${b2bProduct.id}`, {
        method: "PATCH",
        headers: { cookie: adminCookies },
        body: JSON.stringify({ is_active: originalB2bStatus }),
      });
      assert.equal(restoreB2b.status, 200);
    }

    const anonymousProductsResponse = await request("/api/b2c/products");
    const anonymousProducts = await json(anonymousProductsResponse);
    const orderProductId = anonymousProducts.products?.[0]?.id;
    assert.ok(orderProductId, "the B2C fixture needs a product for admin order management");
    const order = await createOrder(JSON.stringify({
      recipient_name: "管理驗收",
      recipient_phone: "0900000000",
      recipient_email: "admin-contract-test@example.com",
      delivery_address: "台北市管理驗收地址",
      privacy_consent_at: new Date().toISOString(),
      items: [{ product_id: orderProductId, quantity: 1 }],
    }));
    const orderUpdate = await request("/api/b2c/mock-orders", {
      method: "PATCH",
      headers: { cookie: adminCookies },
      body: JSON.stringify({ order_id: order.orderId, status: "processing" }),
    });
    assert.equal(orderUpdate.status, 200);
    const ordersResponse = await request("/api/b2c/mock-orders", {
      headers: { cookie: adminCookies },
    });
    const ordersPayload = await json(ordersResponse);
    assert.equal(
      (ordersPayload.orders ?? []).find((candidate) => candidate.id === order.orderId)?.status,
      "processing",
    );

    const generatedPassword = `AdminApi${Date.now()}!`;
    const createdCompanyCode = `Z${String(Date.now() % 1_000_000).padStart(6, "0")}`;
    const companyResponse = await request("/api/admin/companies", {
      method: "POST",
      headers: { cookie: adminCookies },
      body: JSON.stringify({
        name: `管理 API 驗收 ${Date.now()}`,
        client_code: createdCompanyCode,
        password: generatedPassword,
      }),
    });
    assert.equal(companyResponse.status, 201);
    const companyPayload = await json(companyResponse);
    assert.ok(companyPayload.company?.id);
    createdRows.companyIds.add(companyPayload.company.id);
    assert.equal(companyPayload.credential?.client_code, createdCompanyCode);
    assert.equal(companyPayload.credential?.password, undefined);

    const createdCompanyCookies = await login({
      identifier: createdCompanyCode,
      password: generatedPassword,
    });
    assert.ok(createdCompanyCookies);

    const disableCompany = await request(`/api/admin/companies/${companyPayload.company.id}`, {
      method: "PATCH",
      headers: { cookie: adminCookies },
      body: JSON.stringify({ is_active: false }),
    });
    assert.equal(disableCompany.status, 200);
    const disabledCompanyLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: createdCompanyCode, password: generatedPassword }),
    });
    assert.equal(disabledCompanyLogin.status, 403);
    assert.equal(disabledCompanyLogin.headers.get("set-cookie"), null);

    const enableCompany = await request(`/api/admin/companies/${companyPayload.company.id}`, {
      method: "PATCH",
      headers: { cookie: adminCookies },
      body: JSON.stringify({ is_active: true }),
    });
    assert.equal(enableCompany.status, 200);
    assert.equal(
      (await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: createdCompanyCode, password: generatedPassword }),
      })).status,
      200,
    );

    const b2bCookies = await login(credentials.b2b);
    const b2bCatalogResponse = await request("/api/b2b/products", { headers: { cookie: b2bCookies } });
    const b2bCatalogPayload = await json(b2bCatalogResponse);
    const rfqProduct = b2bCatalogPayload.products?.[0];
    const rfqOption = rfqProduct?.specification_options?.[0];
    assert.ok(rfqProduct?.id && rfqOption?.id, "the B2B fixture needs a product option for admin RFQ management");
    const rfqResponse = await request("/api/b2b/rfqs", {
      method: "POST",
      headers: { cookie: b2bCookies },
      body: JSON.stringify({
        items: [{ product_id: rfqProduct.id, specification_option_id: rfqOption.id, quantity: 1, unit: "箱" }],
      }),
    });
    assert.equal(rfqResponse.status, 201);
    const rfqPayload = await json(rfqResponse);
    createdRows.rfqIds.add(rfqPayload.rfqId);

    const rfqsResponse = await request("/api/admin/rfqs", { headers: { cookie: adminCookies } });
    assert.equal(rfqsResponse.status, 200);
    const rfqsPayload = await json(rfqsResponse);
    assert.ok((rfqsPayload.rfqs ?? []).some((rfq) => rfq.id === rfqPayload.rfqId));
    const rfqUpdate = await request("/api/admin/rfqs", {
      method: "PATCH",
      headers: { cookie: adminCookies },
      body: JSON.stringify({ rfq_id: rfqPayload.rfqId, status: "processing" }),
    });
    assert.equal(rfqUpdate.status, 200);
    assert.equal((await json(rfqUpdate)).rfq.status, "processing");
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
      await recordEvent(response, eventName);
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
    const originalRuleActive = await setCustomerPrefixRuleActive("Z", false);
    try {
      const event = await request("/api/analytics/events", {
        method: "POST",
        headers: { cookie: b2bCookies },
        body: JSON.stringify({ event_name: "b2b_catalog_view" }),
      });
      await recordEvent(event, "B2B prefix fallback event");

      const summary = await request(
        "/api/admin/analytics/summary?customer_tier_snapshot=unclassified&channel_snapshot=unclassified",
        { headers: { cookie: adminCookies } },
      );
      assert.equal(summary.status, 200);
      const payload = await json(summary);
      assert.ok(payload.totals.events >= 1);
    } finally {
      await setCustomerPrefixRuleActive("Z", originalRuleActive);
    }
  },
);

test(
  "a disabled B2B company cannot create a login session",
  {
    skip: integrationReady && inactiveB2bIdentifier
      ? false
      : "set CONTRACT_TEST_B2B_INACTIVE_IDENTIFIER after applying the optional B2B fixture seed",
  },
  async () => {
    const response = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: inactiveB2bIdentifier,
        // The route rejects the disabled company before checking credentials.
        password: "fixture-disabled-company-test",
      }),
    });
    assert.equal(response.status, 403);
    const payload = await json(response);
    assert.match(payload.message, /停用/);
    assert.equal(response.headers.get("set-cookie"), null);
  },
);

test(
  "B2B RFQ preserves multiple options for one product and other text",
  { skip: integrationReady ? false : "set CONTRACT_TEST_BASE_URL and the three demo credential pairs to run" },
  async () => {
    const b2bCookies = await login(credentials.b2b);
    const productsResponse = await request("/api/b2b/products", { headers: { cookie: b2bCookies } });
    assert.equal(productsResponse.status, 200);
    const productsPayload = await json(productsResponse);
    const product = (productsPayload.products ?? []).find(
      (candidate) => (candidate.specification_options ?? []).length >= 2,
    );
    assert.ok(product, "the B2B seed needs a product with at least two options");

    const [firstOption, secondOption] = product.specification_options;
    const created = await request("/api/b2b/rfqs", {
      method: "POST",
      headers: { cookie: b2bCookies },
      body: JSON.stringify({
        items: [
          {
            product_id: product.id,
            specification_option_id: firstOption.id,
            quantity: 2,
            unit: "箱",
          },
          {
            product_id: product.id,
            specification_option_id: secondOption.id,
            quantity: 3,
            unit: "箱",
          },
          {
            product_id: product.id,
            other_specification: "客製尺寸",
            other_packaging: "業務確認包裝",
            quantity: 1,
            unit: "箱",
          },
        ],
      }),
    });
    assert.equal(created.status, 201);
    const createdPayload = await json(created);
    assert.ok(createdPayload.rfqId);
    createdRows.rfqIds.add(createdPayload.rfqId);

    const historyResponse = await request("/api/b2b/rfqs", { headers: { cookie: b2bCookies } });
    assert.equal(historyResponse.status, 200);
    const history = await json(historyResponse);
    const saved = (history.rfqs ?? []).find((rfq) => rfq.id === createdPayload.rfqId);
    assert.ok(saved, "the created RFQ should be visible to the same company");
    assert.equal(saved.items.length, 3);
    assert.deepEqual(
      saved.items.map((item) => item.specification_option_id).filter(Boolean).sort(),
      [firstOption.id, secondOption.id].sort(),
    );
    const otherItem = saved.items.find((item) => item.other_specification === "客製尺寸");
    assert.equal(otherItem?.other_packaging, "業務確認包裝");
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
    const product = products.products?.[0];
    const productId = product?.id;
    const specificationOptionId = product?.specification_options?.[0]?.id;
    assert.ok(productId, "the B2B fixture needs at least one product");
    assert.ok(specificationOptionId, "the B2B fixture needs at least one spec option");

    const created = await request("/api/b2b/rfqs", {
      method: "POST",
      headers: { cookie: firstCookies },
      body: JSON.stringify({
        items: [{ product_id: productId, specification_option_id: specificationOptionId, quantity: 1, unit: "箱" }],
      }),
    });
    assert.equal(created.status, 201);
    const createdPayload = await json(created);
    assert.ok(createdPayload.rfqId, "the RFQ response needs an rfqId");
    createdRows.rfqIds.add(createdPayload.rfqId);

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
    const query = "select coalesce(auth_user_id::text, '<null>') from public.companies where client_code = 'Z232113';";
    const run = async (args) => runDatabaseCommand(databaseUrl, args);
    const before = (await run(["-c", query])).stdout.trim();
    await run(["-f", "supabase/seed.sql"]);
    await run(["-f", "supabase/seed.sql"]);
    const after = (await run(["-c", query])).stdout.trim();
    assert.equal(after, before);
  },
);
