import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const ROOT = new URL("..", import.meta.url);
const FIXTURE_CODE = "W483038";
const FIXTURE_NAME = "第二家公司隔離測試";

async function readEnvFile(name) {
  try {
    return await readFile(new URL(name, ROOT), "utf8");
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

async function loadEnv() {
  const values = {
    ...parseEnv(await readEnvFile(".env.local")),
    ...parseEnv(await readEnvFile(".env.test.local")),
  };
  for (const [name, value] of Object.entries(values)) {
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Put it in .env.test.local; never commit that file.`);
  return value;
}

function assertLocalTarget(url) {
  const hostname = new URL(url).hostname;
  if (!["127.0.0.1", "localhost"].includes(hostname)) {
    throw new Error("Refusing a non-local Supabase target for B2B test fixtures.");
  }
}

async function findOrCreateUser(admin, email, password) {
  const { data: users, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const existing = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Auth user was not created.");
  return data.user;
}

async function bindCompany(admin, userId) {
  const { data: company, error: lookupError } = await admin
    .from("companies")
    .select("id, auth_user_id")
    .eq("client_code", FIXTURE_CODE)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (!company) {
    const { error } = await admin.from("companies").insert({
      client_code: FIXTURE_CODE,
      name: FIXTURE_NAME,
      is_active: true,
      auth_user_id: userId,
    });
    if (error) throw error;
    return;
  }

  if (company.auth_user_id && company.auth_user_id !== userId) {
    throw new Error(`Refusing to replace the existing Auth binding for ${FIXTURE_CODE}.`);
  }

  const { error } = await admin
    .from("companies")
    .update({ name: FIXTURE_NAME, is_active: true, auth_user_id: userId })
    .eq("id", company.id);
  if (error) throw error;
}

await loadEnv();
const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireValue("SUPABASE_SECRET_KEY");
const email = requireValue("CONTRACT_TEST_B2B_OTHER_EMAIL");
const password = requireValue("CONTRACT_TEST_B2B_OTHER_PASSWORD");

assertLocalTarget(supabaseUrl);

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const user = await findOrCreateUser(admin, email, password);
await bindCompany(admin, user.id);

console.log(`B2B isolation Auth fixture is ready for ${FIXTURE_CODE}.`);
