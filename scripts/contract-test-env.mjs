import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

async function readEnvFile() {
  try {
    return await readFile(resolve(ROOT, ".env.test.local"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function parseEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim();
    values[match[1]] =
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
        ? value.slice(1, -1)
        : value;
  }
  return values;
}

export async function loadContractTestEnv() {
  const values = parseEnv(await readEnvFile());
  for (const [name, value] of Object.entries(values)) {
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

function parseTarget(value, label, message) {
  if (!value?.trim()) throw new Error(`${label} 未設定；請填入 .env.test.local。`);
  let target;
  try {
    target = new URL(value);
  } catch {
    throw new Error(`${label} 格式不正確。`);
  }
  if (!LOOPBACK_HOSTS.has(target.hostname)) {
    throw new Error(`${message}目前是 ${target.hostname}。`);
  }
  return target;
}

export function assertLocalSupabaseTarget(value) {
  const target = parseTarget(
    value,
    "NEXT_PUBLIC_SUPABASE_URL",
    "契約測試只允許本機 Supabase，",
  );
  if (target.protocol !== "http:") {
    throw new Error("契約測試只允許使用 http 的本機 Supabase。");
  }
  return target;
}

export function assertLocalDatabaseTarget(value) {
  const target = parseTarget(
    value,
    "CONTRACT_TEST_DATABASE_URL",
    "契約測試只允許本機隔離資料庫，",
  );
  if (!["postgres:", "postgresql:"].includes(target.protocol)) {
    throw new Error("CONTRACT_TEST_DATABASE_URL 必須是 PostgreSQL 連線 URL。");
  }
  return target;
}

export function assertLocalTestServerTarget(value) {
  const target = parseTarget(
    value,
    "CONTRACT_TEST_BASE_URL",
    "契約測試只允許本機測試 server，",
  );
  if (target.protocol !== "http:") {
    throw new Error("契約測試只允許使用 http 的本機測試 server。");
  }
  return target;
}
