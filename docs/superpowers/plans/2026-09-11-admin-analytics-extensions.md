# Admin Analytics Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 `/admin` Analytics 中加入共用常用篩選、排程聚合匯出、共用異常告警與 Admin-only 客戶明細下鑽。

**Architecture:** 延伸既有 Next.js server-side Admin Analytics seam；新增 server-only Supabase migration／RPC、受保護的 Vercel Cron job、私有 Storage 檔案與既有 Analytics client UI。所有敏感明細都由後端授權與聚合，CSV 維持聚合資料。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Supabase SSR／service role、PostgreSQL、Vercel Cron、Node contract tests。

**Spec:** [FDDv4.1.md](../../FDDv4.1.md)、[ADR-0002](../../adr/0002-admin-analytics-extensions.md)、[Admin 共用互動規則與驗收案例](../../admin-interaction-rules-and-acceptance.md)

## Global Constraints

- 只有 `admin` 可使用 Analytics 擴充；`business_staff` 維持只能管理 B2B 商品與 RFQ。
- 客戶明細只回傳最小聚合欄位；不回傳 Auth email、user ID、session ID 或原始 `event_data`。
- 少於 5 家企業的遮罩列不可下鑽；手動與排程 CSV 只輸出聚合列。
- 排程使用 `Asia/Taipei`，Vercel Cron 每 5 分鐘呼叫受保護 server job；錯過不補跑，匯出失敗每 5 分鐘重試最多 3 次。
- 所有 server-only 表啟用 RLS，撤銷 `anon`／`authenticated` 存取；service role 只在 server-side 使用。
- 先寫 failing contract／unit test，再寫最小 production code；不重置或覆蓋工作樹既有修改。

---

### Task 1: Domain validation and schedule/alert primitives

**Files:**
- Create: `src/lib/admin-analytics-extensions.ts`
- Test: `tests/contracts/admin-analytics-extensions.test.mjs`

**Interfaces:**
- Produces pure validation and due-date helpers for later routes and jobs: saved-filter names, schedule timing, monthly last-day resolution, retry state, alert deduplication and business anomaly thresholds.

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run the focused test and confirm the missing-module failure**
- [x] **Step 3: Implement only the pure helpers required by the test**
- [x] **Step 4: Run the focused test to verify green**
- [x] **Step 5: Run the existing analytics contract tests**

### Task 2: Server-only schema, RPCs and Storage lifecycle

**Files:**
- Create: `supabase/migrations/20260911153845_admin_analytics_extensions.sql`
- Test: `tests/contracts/database-contract.test.mjs`
- Modify: `docs/supabase-schema-alignment.md` only after migration is locally verified

**Interfaces:**
- Produces tables and RPCs for shared filters, schedules, export runs, alerts and paginated company drilldown; all are service-role/server-only.

- [x] **Step 1: Add failing SQL contract assertions for RLS, grants, constraints, RPC names and masking boundary**
- [x] **Step 2: Run the focused database contract test and confirm failure**
- [x] **Step 3: Generate the migration filename with `supabase migration new` and implement the minimum schema**
- [x] **Step 4: Start/reset the isolated Supabase database and apply the migration**
- [x] **Step 5: Run the focused database contract and advisor checks**

### Task 3: Admin APIs for filters, drilldown, schedules, history and alerts

**Files:**
- Create: `src/app/api/admin/analytics/saved-filters/route.ts`
- Create: `src/app/api/admin/analytics/drilldown/route.ts`
- Create: `src/app/api/admin/analytics/schedules/route.ts`
- Create: `src/app/api/admin/analytics/exports/route.ts`
- Create: `src/app/api/admin/analytics/alerts/route.ts`
- Test: `tests/contracts/api-contract.test.mjs`

**Interfaces:**
- Every route uses the existing Admin context and returns 401/403/503 consistently; schedule APIs store independent condition snapshots; drilldown rejects masked rows and non-admin roles.

- [x] **Step 1: Add failing API contract assertions for authorization, validation, pagination and response shapes**
- [x] **Step 2: Run the focused contract test and confirm failure**
- [x] **Step 3: Implement routes by reusing existing auth, API parsing and Analytics filter helpers**
- [x] **Step 4: Run focused API contracts and TypeScript**

### Task 4: Protected Vercel Cron job and export/alert execution

**Files:**
- Create: `src/app/api/cron/admin-analytics/route.ts`
- Create: `src/lib/admin-analytics-job.ts`
- Create: `vercel.json`
- Test: `tests/contracts/admin-analytics-extensions.test.mjs`

**Interfaces:**
- Produces a secret-protected job that runs due schedules, retries failed exports every five minutes up to three attempts, evaluates daily business rules at 08:00, evaluates API/Supabase health every five minutes, uploads aggregate CSVs to private Storage and updates audit/run state.

- [x] **Step 1: Add failing tests for cron secret rejection, due schedule selection, retry and alert deduplication**
- [x] **Step 2: Run focused tests and confirm failure**
- [x] **Step 3: Implement the minimum job runner with idempotent database state transitions**
- [x] **Step 4: Run focused tests and local HTTP checks**

### Task 5: Analytics UI integration

**Files:**
- Modify: `src/app/admin/analytics-report-panel.tsx`
- Modify: `src/app/admin/admin-workspace.module.css`
- Test: `tests/contracts/analytics-report.test.mjs`

**Interfaces:**
- Adds shared filter controls, alert entry/status, schedule/export history controls and unmasked-row drilldown while preserving existing applied dates/filters and existing loading/error states.

- [x] **Step 1: Add failing copy/markup contract assertions for all new UI states**
- [x] **Step 2: Run the focused UI contract and confirm failure**
- [x] **Step 3: Implement the smallest accessible controls using existing styles and native controls**
- [x] **Step 4: Run targeted contracts, lint and TypeScript**
- [ ] **Step 5: Verify 390/768/1440px in the local browser**

### Task 6: Documentation and acceptance evidence

**Files:**
- Modify: `docs/admin-interaction-rules-and-acceptance.md`
- Modify: `docs/FDDv4.1.md`
- Modify: `docs/database-plan.md`
- Modify: `docs/supabase-schema-alignment.md`

- [x] **Step 1: Update only claims supported by executed tests or browser evidence**
- [x] **Step 2: Run `git diff --check` and the complete contract suite**
- [x] **Step 3: Record local, hosted and blocked evidence separately**
