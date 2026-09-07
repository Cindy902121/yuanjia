import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertLocalDatabaseTarget,
  assertLocalSupabaseTarget,
  assertLocalTestServerTarget,
} from "../../scripts/contract-test-env.mjs";

const realRunner = readFileSync(new URL("../../scripts/run-contract-tests-real.mjs", import.meta.url), "utf8");

test("contract tests accept only local Supabase and Postgres targets", () => {
  assert.doesNotThrow(() => assertLocalSupabaseTarget("http://127.0.0.1:54321"));
  assert.doesNotThrow(() => assertLocalDatabaseTarget("postgresql://127.0.0.1:54322/postgres"));
  assert.doesNotThrow(() => assertLocalTestServerTarget("http://localhost:3100"));

  assert.throws(
    () => assertLocalSupabaseTarget("https://example.supabase.co"),
    /只允許本機 Supabase/,
  );
  assert.throws(
    () => assertLocalDatabaseTarget("postgresql://db.example.com:5432/postgres"),
    /只允許本機隔離資料庫/,
  );
  assert.throws(
    () => assertLocalTestServerTarget("https://staging.example.com"),
    /只允許本機測試 server/,
  );
});

test("real contract runner cannot fall back to .env.local or an existing server", () => {
  assert.match(realRunner, /loadContractTestEnv/);
  assert.doesNotMatch(realRunner, /\.env\.local/);
  assert.match(realRunner, /assertLocalSupabaseTarget/);
  assert.match(realRunner, /assertLocalDatabaseTarget/);
  assert.match(realRunner, /CONTRACT_TEST_USE_EXISTING_SERVER/);
});
