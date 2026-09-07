import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PORT = process.env.CONTRACT_TEST_PORT ?? "3100";
const testFiles = [
  "tests/contracts/api-contract.test.mjs",
  "tests/contracts/database-contract.test.mjs",
  "tests/contracts/analytics-report.test.mjs",
  "tests/contracts/analytics-report.integration.test.mjs",
  "tests/contracts/integration.test.mjs",
];

async function readEnvFile(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

function parseEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

async function loadLocalEnv() {
  const merged = {};
  for (const file of [".env.local", ".env.test.local"]) {
    const contents = await readEnvFile(resolve(ROOT, file));
    Object.assign(merged, parseEnv(contents));
  }

  for (const [name, value] of Object.entries(merged)) {
    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

function missingEnvironment() {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "CONTRACT_TEST_B2C_EMAIL",
    "CONTRACT_TEST_B2C_PASSWORD",
    "CONTRACT_TEST_B2B_IDENTIFIER",
    "CONTRACT_TEST_B2B_PASSWORD",
    "CONTRACT_TEST_ADMIN_EMAIL",
    "CONTRACT_TEST_ADMIN_PASSWORD",
  ].filter((name) => !process.env[name]);
}

function isLocalUrl(value) {
  try {
    return ["127.0.0.1", "localhost", "::1"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
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
  await loadLocalEnv();

  const missing = missingEnvironment();
  if (missing.length > 0) {
    console.error(`Missing test environment variables: ${missing.join(", ")}`);
    console.error("Put them in .env.test.local; that file is ignored by git.");
    process.exitCode = 2;
    return;
  }

  const port = process.env.CONTRACT_TEST_PORT ?? DEFAULT_PORT;
  const baseUrl = (process.env.CONTRACT_TEST_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
  if (!isLocalUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || !isLocalUrl(baseUrl)) {
    console.error("Refusing real contract tests against a non-local Supabase or test server.");
    process.exitCode = 2;
    return;
  }
  process.env.CONTRACT_TEST_BASE_URL = baseUrl;

  let server;
  const useExistingServer = process.env.CONTRACT_TEST_USE_EXISTING_SERVER === "1";

  try {
    if (useExistingServer) {
      await waitForServer(baseUrl);
    } else {
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
    }

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
