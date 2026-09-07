import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import test from "node:test";

const baseUrl = process.env.CONTRACT_TEST_BASE_URL?.replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const ANALYTICS_TEST_DATE = "2000-01-01";
const isLocalUrl = (value) => {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
};
const integrationReady = Boolean(
  baseUrl &&
  supabaseUrl &&
  secretKey &&
  isLocalUrl(baseUrl) &&
  isLocalUrl(supabaseUrl),
);

function cookiesFrom(response) {
  return (response.headers.getSetCookie?.() ?? [])
    .map((cookie) => cookie.split(";", 1)[0])
    .join("; ");
}

async function requireData(promise, label) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function chooseClientCodes(admin) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const start = randomInt(0, 999996);
    const codes = Array.from({ length: 5 }, (_, index) =>
      `W${String(start + index).padStart(6, "0")}`,
    );
    const existing = await requireData(
      admin.from("companies").select("client_code").in("client_code", codes),
      "look up analytics fixture client codes",
    );
    if (!existing?.length) return codes;
  }
  throw new Error("Could not allocate five unused local analytics client codes.");
}

async function createAuthUser(admin, email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error(`Auth user was not created for ${email}.`);
  return data.user;
}

test(
  "B2B analytics API and CSV export verify funnels, rankings, Finder and five-company masking",
  {
    skip: integrationReady
      ? false
      : "requires a local Supabase URL, secret key and CONTRACT_TEST_BASE_URL",
  },
  async () => {
    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = randomUUID().replaceAll("-", "");
    const createdUserIds = [];
    const createdCompanyIds = [];
    const createdRfqIds = [];
    const createdEventIds = [];
    const exportAuditNote = `analytics-mask-export:${token}`;
    let analyticsAdminId;

    try {
      const adminUser = await createAuthUser(
        admin,
        `analytics-mask-admin-${token}@local.test`,
        `Analytics-mask-${token}!aA1`,
      );
      analyticsAdminId = adminUser.id;
      createdUserIds.push(adminUser.id);
      await requireData(
        admin.from("app_admins").insert({
          user_id: adminUser.id,
          role: "admin",
          is_active: true,
        }),
        "create analytics test admin",
      );

      const companyUsers = [];
      for (let index = 0; index < 5; index += 1) {
        const user = await createAuthUser(
          admin,
          `analytics-mask-company-${index + 1}-${token}@local.test`,
          `Analytics-mask-${token}-${index + 1}!aA1`,
        );
        companyUsers.push(user);
        createdUserIds.push(user.id);
      }

      const clientCodes = await chooseClientCodes(admin);
      const companies = await requireData(
        admin
          .from("companies")
          .insert(
            clientCodes.map((clientCode, index) => ({
              client_code: clientCode,
              name: `Analytics 遮罩測試企業 ${index + 1}`,
              is_active: true,
              auth_user_id: companyUsers[index].id,
            })),
          )
          .select("id, auth_user_id, client_code"),
        "create five analytics test companies",
      );
      createdCompanyIds.push(...companies.map((company) => company.id));

      const products = await requireData(
        admin
          .from("b2b_products")
          .select("id, product_code, category, brand")
          .in("product_code", ["B2B-FISH-001", "B2B-FISH-003"]),
        "load analytics test products",
      );
      const productByCode = new Map(products.map((product) => [product.product_code, product]));
      const commonProduct = productByCode.get("B2B-FISH-001");
      const maskedProduct = productByCode.get("B2B-FISH-003");
      assert.ok(commonProduct && maskedProduct, "analytics seed needs both ranking products");

      const options = await requireData(
        admin
          .from("b2b_product_spec_options")
          .select("id, option_code, specification_text, packaging_text, product_id")
          .in("option_code", ["B2B-FISH-001-200G", "B2B-FISH-003-DEFAULT"]),
        "load analytics test specification options",
      );
      const optionByCode = new Map(options.map((option) => [option.option_code, option]));
      const commonOption = optionByCode.get("B2B-FISH-001-200G");
      const maskedOption = optionByCode.get("B2B-FISH-003-DEFAULT");
      assert.ok(commonOption && maskedOption, "analytics seed needs both ranking options");

      const eventBase = Date.parse(`${ANALYTICS_TEST_DATE}T00:00:00+08:00`);
      const timestamp = (step, companyIndex) =>
        new Date(eventBase + (companyIndex * 20 + step) * 1000).toISOString();
      const rfqRows = [];
      for (let index = 0; index < 5; index += 1) {
        rfqRows.push({
          company_id: companies[index].id,
          status: "new",
          total_note: `analytics-mask:${token}:${index}:common`,
          customer_tier_snapshot: "其他",
          channel_snapshot: "B2B",
          created_at: timestamp(0, index),
          updated_at: timestamp(0, index),
        });
        if (index < 4) {
          rfqRows.push({
            company_id: companies[index].id,
            status: "new",
            total_note: `analytics-mask:${token}:${index}:masked`,
            customer_tier_snapshot: "其他",
            channel_snapshot: "B2B",
            created_at: timestamp(1, index),
            updated_at: timestamp(1, index),
          });
        }
      }
      const rfqs = await requireData(
        admin.from("b2b_rfqs").insert(rfqRows).select("id, company_id, total_note"),
        "create analytics test RFQs",
      );
      createdRfqIds.push(...rfqs.map((rfq) => rfq.id));
      const rfqByNote = new Map(rfqs.map((rfq) => [rfq.total_note, rfq]));

      const rfqItems = [];
      for (let index = 0; index < 5; index += 1) {
        const commonRfq = rfqByNote.get(`analytics-mask:${token}:${index}:common`);
        rfqItems.push({
          rfq_id: commonRfq.id,
          product_id: commonProduct.id,
          specification_option_id: commonOption.id,
          specification_text_snapshot: commonOption.specification_text,
          packaging_text_snapshot: commonOption.packaging_text,
          quantity: 1,
          unit: "箱",
        });
        if (index < 4) {
          const maskedRfq = rfqByNote.get(`analytics-mask:${token}:${index}:masked`);
          rfqItems.push({
            rfq_id: maskedRfq.id,
            product_id: maskedProduct.id,
            specification_option_id: maskedOption.id,
            specification_text_snapshot: maskedOption.specification_text,
            packaging_text_snapshot: maskedOption.packaging_text,
            quantity: 2,
            unit: "箱",
          });
        }
      }
      await requireData(
        admin.from("b2b_rfq_items").insert(rfqItems).select("id"),
        "create analytics test RFQ items",
      );

      const eventRows = [];
      const addEvent = (company, companyIndex, step, eventName, product, eventData = {}) => {
        eventRows.push({
          event_name: eventName,
          surface: "b2b",
          product_reference: product?.id ?? null,
          product_category: product?.category ?? null,
          product_brand: product?.brand ?? null,
          customer_tier_snapshot: "其他",
          channel_snapshot: "B2B",
          occurred_at: timestamp(step, companyIndex),
          actor_user_id: company.auth_user_id,
          company_id: company.id,
          session_id: `analytics-mask-${token}-${companyIndex + 1}`,
          customer_code_snapshot: company.client_code,
          event_data: eventData,
        });
      };

      for (let index = 0; index < 5; index += 1) {
        const company = companies[index];
        const commonRfq = rfqByNote.get(`analytics-mask:${token}:${index}:common`);
        addEvent(company, index, 2, "b2b_login_success");
        addEvent(company, index, 3, "b2b_catalog_view");
        addEvent(company, index, 4, "b2b_product_view", commonProduct);
        addEvent(company, index, 5, "b2b_rfq_add", commonProduct, {
          product_id: commonProduct.id,
        });
        addEvent(company, index, 6, "b2b_rfq_submit", null, { rfq_id: commonRfq.id });
        addEvent(company, index, 7, "b2b_product_finder_start");
        addEvent(company, index, 8, "b2b_product_finder_answer", null, {
          question_key: "tag",
          option_id: "b2b-fish",
        });
        if (index < 4) {
          addEvent(company, index, 9, "b2b_product_finder_answer", null, {
            question_key: "tag",
            option_id: "b2b-shrimp",
          });
        }
        addEvent(company, index, 10, "b2b_product_finder_complete");
        addEvent(company, index, 11, "b2b_product_finder_result_click", commonProduct, {
          product_id: commonProduct.id,
        });
        if (index < 4) {
          const maskedRfq = rfqByNote.get(`analytics-mask:${token}:${index}:masked`);
          addEvent(company, index, 12, "b2b_product_view", maskedProduct);
          addEvent(company, index, 13, "b2b_rfq_add", maskedProduct, {
            product_id: maskedProduct.id,
          });
          addEvent(company, index, 14, "b2b_rfq_submit", null, { rfq_id: maskedRfq.id });
        }
      }
      const events = await requireData(
        admin.from("analytics_events").insert(eventRows).select("id"),
        "create five-company analytics events",
      );
      createdEventIds.push(...events.map((event) => event.id));

      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: `analytics-mask-admin-${token}@local.test`,
          password: `Analytics-mask-${token}!aA1`,
        }),
      });
      assert.equal(loginResponse.status, 200, "analytics test admin should log in");
      const cookies = cookiesFrom(loginResponse);
      const response = await fetch(
        `${baseUrl}/api/admin/analytics/summary?date_from=${ANALYTICS_TEST_DATE}&date_to=${ANALYTICS_TEST_DATE}`,
        { headers: { cookie: cookies } },
      );
      assert.equal(response.status, 200, "Admin analytics summary should be available");
      const report = await response.json();

      assert.deepEqual(report.funnels.main.sessions, {
        catalog_view: 5,
        product_view: 5,
        rfq_add: 5,
        rfq_submit: 5,
      });
      assert.deepEqual(report.funnels.main.companies, {
        catalog_view: 5,
        product_view: 5,
        rfq_add: 5,
        rfq_submit: 5,
      });
      assert.deepEqual(report.funnels.finder.sessions, {
        start: 5,
        answer: 5,
        complete: 5,
        result_click: 5,
      });
      assert.deepEqual(report.funnels.finder.companies, {
        start: 5,
        answer: 5,
        complete: 5,
        result_click: 5,
      });

      const visibleProduct = report.product_ranking.find(
        (row) => row.product_code === "B2B-FISH-001",
      );
      assert.equal(visibleProduct?.events, 20);
      assert.equal(visibleProduct?.active_companies, 5);
      assert.equal(visibleProduct?.product_views, 5);
      assert.equal(visibleProduct?.rfq_adds, 5);
      assert.equal(visibleProduct?.rfq_submits, 5);
      assert.equal(
        report.product_ranking.some((row) => row.product_code === "B2B-FISH-003"),
        false,
      );
      const maskedProductRow = report.product_ranking.find(
        (row) => row.name === "其他（已遮罩）",
      );
      assert.equal(maskedProductRow?.events, 12);
      assert.equal(maskedProductRow?.active_companies, 4);
      assert.equal(maskedProductRow?.product_views, 4);
      assert.equal(maskedProductRow?.rfq_adds, 4);
      assert.equal(maskedProductRow?.rfq_submits, 4);

      const visibleFinderAnswer = report.finder_answers.find(
        (row) => row.question_key === "tag" && row.option_id === "b2b-fish",
      );
      assert.equal(visibleFinderAnswer?.events, 5);
      assert.equal(visibleFinderAnswer?.active_companies, 5);
      assert.equal(
        report.finder_answers.some(
          (row) => row.question_key === "tag" && row.option_id === "b2b-shrimp",
        ),
        false,
      );
      const maskedFinderAnswer = report.finder_answers.find(
        (row) => row.question_key === "tag" && row.option_id === "其他（已遮罩）",
      );
      assert.equal(maskedFinderAnswer?.events, 4);
      assert.equal(maskedFinderAnswer?.active_companies, 4);

      const visibleRfqProduct = report.rfq_product_ranking.find(
        (row) => row.product_code === "B2B-FISH-001",
      );
      assert.equal(visibleRfqProduct?.rfqs, 5);
      assert.equal(visibleRfqProduct?.active_companies, 5);
      assert.equal(visibleRfqProduct?.line_items, 5);
      assert.equal(visibleRfqProduct?.requested_quantity, 5);
      assert.equal(
        report.rfq_product_ranking.some((row) => row.product_code === "B2B-FISH-003"),
        false,
      );
      const maskedRfqProduct = report.rfq_product_ranking.find(
        (row) => row.name === "其他（已遮罩）",
      );
      assert.equal(maskedRfqProduct?.rfqs, 4);
      assert.equal(maskedRfqProduct?.active_companies, 4);
      assert.equal(maskedRfqProduct?.line_items, 4);
      assert.equal(maskedRfqProduct?.requested_quantity, 8);

      const exportParams = new URLSearchParams({
        date_from: ANALYTICS_TEST_DATE,
        date_to: ANALYTICS_TEST_DATE,
        note: exportAuditNote,
        purpose: "operations_analysis",
      });
      const exportResponse = await fetch(
        `${baseUrl}/api/admin/analytics/export?${exportParams}`,
        { headers: { cookie: cookies } },
      );
      assert.equal(exportResponse.status, 200, "Admin analytics CSV should download");
      assert.match(exportResponse.headers.get("content-type") ?? "", /text\/csv/);
      assert.match(
        exportResponse.headers.get("content-disposition") ?? "",
        /attachment; filename="b2b-analytics-2000-01-01\.csv"/,
      );
      const csvBytes = Buffer.from(await exportResponse.arrayBuffer());
      assert.deepEqual([...csvBytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
      const csv = csvBytes.toString("utf8");
      assert.match(csv, /^\uFEFFsection,label,sub_label,/);
      assert.match(csv, /B2B-FISH-001/);
      assert.match(csv, /其他（已遮罩）/);
      assert.doesNotMatch(csv, /B2B-FISH-003/);
      assert.doesNotMatch(csv, /customer_code_snapshot|actor_user_id|company_id/);

      const audits = await requireData(
        admin
          .from("analytics_export_audits")
          .select("id, admin_user_id, purpose, note, query_scope, file_format, row_count")
          .eq("admin_user_id", analyticsAdminId)
          .eq("note", exportAuditNote),
        "read analytics export audit",
      );
      assert.equal(audits.length, 1);
      assert.deepEqual(audits[0], {
        id: audits[0].id,
        admin_user_id: analyticsAdminId,
        purpose: "operations_analysis",
        note: exportAuditNote,
        query_scope: {
          date_from: ANALYTICS_TEST_DATE,
          date_to: ANALYTICS_TEST_DATE,
          filters: {
            channel_snapshot: [],
            customer_tier_snapshot: [],
            event_name: [],
            filter_type: [],
            finder_question: [],
            product_brand: [],
            product_category: [],
            product_reference: [],
          },
          grain: "day",
        },
        file_format: "csv",
        row_count: csv.split("\r\n").length - 1,
      });
    } finally {
      if (analyticsAdminId) {
        await requireData(
          admin
            .from("analytics_export_audits")
            .delete()
            .eq("admin_user_id", analyticsAdminId)
            .eq("note", exportAuditNote),
          "clean analytics export audit",
        );
      }
      if (createdEventIds.length) {
        await requireData(
          admin.from("analytics_events").delete().in("id", createdEventIds),
          "clean analytics test events",
        );
      }
      if (createdRfqIds.length) {
        await requireData(
          admin.from("b2b_rfq_items").delete().in("rfq_id", createdRfqIds),
          "clean analytics test RFQ items",
        );
        await requireData(
          admin.from("b2b_rfqs").delete().in("id", createdRfqIds),
          "clean analytics test RFQs",
        );
      }
      if (createdCompanyIds.length) {
        await requireData(
          admin.from("companies").delete().in("id", createdCompanyIds),
          "clean analytics test companies",
        );
      }
      if (analyticsAdminId) {
        await requireData(
          admin.from("app_admins").delete().eq("user_id", analyticsAdminId),
          "clean analytics test admin",
        );
      }
      for (const userId of createdUserIds) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw new Error(`clean analytics test Auth user: ${error.message}`);
      }
    }
  },
);
