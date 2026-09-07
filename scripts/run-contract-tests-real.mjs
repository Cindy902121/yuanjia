import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertLocalDatabaseTarget,
  assertLocalSupabaseTarget,
  assertLocalTestServerTarget,
  loadContractTestEnv,
} from "./contract-test-env.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testFiles = [
  "tests/contracts/contract-test-env.test.mjs",
  "tests/contracts/api-contract.test.mjs",
  "tests/contracts/database-contract.test.mjs",
  "tests/contracts/integration.test.mjs",
];

function missingEnvironment() {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "CONTRACT_TEST_B2C_EMAIL",
    "CONTRACT_TEST_B2C_PASSWORD",
    "CONTRACT_TEST_B2B_IDENTIFIER",
    "CONTRACT_TEST_B2B_PASSWORD",
    "CONTRACT_TEST_B2B_E_IDENTIFIER",
    "CONTRACT_TEST_B2B_E_EMAIL",
    "CONTRACT_TEST_B2B_E_PASSWORD",
    "CONTRACT_TEST_B2B_W_IDENTIFIER",
    "CONTRACT_TEST_B2B_W_EMAIL",
    "CONTRACT_TEST_B2B_W_PASSWORD",
    "CONTRACT_TEST_ADMIN_EMAIL",
    "CONTRACT_TEST_ADMIN_PASSWORD",
  ].filter((name) => !process.env[name]);
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
      ...options,
    });

    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      resolveRun({ code: code ?? 1, signal });
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  let lastError = "unknown error";

  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`Next.js test server exited with code ${child.exitCode}.`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/b2c/products`, {
        cache: "no-store",
      });
      if (response.ok) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error(`Timed out waiting for ${baseUrl}; last error: ${lastError}`);
}

async function main() {
  await loadContractTestEnv();

  const missing = missingEnvironment();
  if (missing.length > 0) {
    console.error(`Missing test environment variables: ${missing.join(", ")}`);
    console.error("Put them in .env.test.local; that file is ignored by git.");
    process.exitCode = 2;
    return;
  }

  const port = process.env.CONTRACT_TEST_PORT ?? "3100";
  const baseUrl = (process.env.CONTRACT_TEST_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
  const useExistingServer = process.env.CONTRACT_TEST_USE_EXISTING_SERVER === "1";

  try {
    const serverTarget = assertLocalTestServerTarget(baseUrl);
    assertLocalSupabaseTarget(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (process.env.CONTRACT_TEST_DATABASE_URL) {
      assertLocalDatabaseTarget(process.env.CONTRACT_TEST_DATABASE_URL);
    }
    if (serverTarget.port !== port) {
      throw new Error("CONTRACT_TEST_BASE_URL 的 port 必須與 CONTRACT_TEST_PORT 相同。");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
    return;
  }

  if (useExistingServer) {
    console.error("為避免測試連到未知資料庫，test:contracts:real 必須由 runner 啟動本機測試 server；請移除 CONTRACT_TEST_USE_EXISTING_SERVER。");
    process.exitCode = 2;
    return;
  }

  process.env.CONTRACT_TEST_BASE_URL = baseUrl;

  let server;

  try {
    server = spawn(
      process.execPath,
      [resolve(ROOT, "node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1", "--port", port],
      {
        cwd: ROOT,
        env: process.env,
        stdio: "inherit",
      },
    );
    await waitForServer(baseUrl, server);

    const result = await run(process.execPath, ["--test", ...testFiles]);
    process.exitCode = result.code;
  } finally {
    if (server && server.exitCode === null) {
      server.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
