import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const ROOT = new URL("..", import.meta.url);

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
  if (!value) {
    throw new Error(`Missing ${name}. Put it in .env.test.local; never commit that file.`);
  }
  return value;
}

function assertLocalTarget(url) {
  const hostname = new URL(url).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("Refusing a non-local Supabase target for contract test identities.");
  }
}

await loadEnv();

const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireValue("SUPABASE_SECRET_KEY");
const b2bIdentifier = requireValue("CONTRACT_TEST_B2B_IDENTIFIER");
assertLocalTarget(supabaseUrl);

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listed.error) throw listed.error;
const users = new Map(
  listed.data.users
    .filter((user) => user.email)
    .map((user) => [user.email.toLowerCase(), user]),
);

async function ensureUser(emailName, passwordName) {
  const email = requireValue(emailName).toLowerCase();
  const password = requireValue(passwordName);
  const existing = users.get(email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw error ?? new Error(`Auth user was not updated for ${emailName}.`);
    }
    users.set(email, data.user);
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error(`Auth user was not created for ${emailName}.`);
  }

  users.set(email, data.user);
  return data.user;
}

const b2c = await ensureUser("CONTRACT_TEST_B2C_EMAIL", "CONTRACT_TEST_B2C_PASSWORD");
const b2b = await ensureUser("CONTRACT_TEST_B2B_EMAIL", "CONTRACT_TEST_B2B_PASSWORD");
const adminUser = await ensureUser("CONTRACT_TEST_ADMIN_EMAIL", "CONTRACT_TEST_ADMIN_PASSWORD");

const { data: company, error: companyError } = await admin
  .from("companies")
  .select("id, auth_user_id")
  .eq("client_code", b2bIdentifier)
  .maybeSingle();
if (companyError || !company) {
  throw companyError ?? new Error(`B2B company ${b2bIdentifier} is missing; run supabase/seed.sql first.`);
}
if (company.auth_user_id && company.auth_user_id !== b2b.id) {
  throw new Error(`Refusing to replace the existing Auth binding for ${b2bIdentifier}.`);
}

const { error: bindError } = await admin
  .from("companies")
  .update({ auth_user_id: b2b.id })
  .eq("id", company.id);
if (bindError) throw bindError;

const { error: roleError } = await admin.from("app_admins").upsert(
  { user_id: adminUser.id, role: "admin", is_active: true },
  { onConflict: "user_id" },
);
if (roleError) throw roleError;

console.log(`Local contract identities ready: ${[b2c, b2b, adminUser].length} users.`);
