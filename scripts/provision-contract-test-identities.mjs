import { createClient } from "@supabase/supabase-js";

import {
  assertLocalSupabaseTarget,
  loadContractTestEnv,
} from "./contract-test-env.mjs";

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Put it in .env.test.local; never commit that file.`);
  return value;
}

await loadContractTestEnv();
const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireValue("SUPABASE_SECRET_KEY");
assertLocalSupabaseTarget(supabaseUrl);

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listed.error) throw listed.error;
const users = new Map(listed.data.users.map((user) => [user.email?.toLowerCase(), user]));

async function ensureUser(emailName, passwordName) {
  const email = requireValue(emailName).toLowerCase();
  const password = requireValue(passwordName);
  const existing = users.get(email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error(`Auth user was not created for ${emailName}.`);
  users.set(email, data.user);
  return data.user;
}

const b2bAccounts = [
  {
    identifier: requireValue("CONTRACT_TEST_B2B_IDENTIFIER"),
    emailName: "CONTRACT_TEST_B2B_EMAIL",
    passwordName: "CONTRACT_TEST_B2B_PASSWORD",
  },
  {
    identifier: requireValue("CONTRACT_TEST_B2B_E_IDENTIFIER"),
    emailName: "CONTRACT_TEST_B2B_E_EMAIL",
    passwordName: "CONTRACT_TEST_B2B_E_PASSWORD",
  },
  {
    identifier: requireValue("CONTRACT_TEST_B2B_W_IDENTIFIER"),
    emailName: "CONTRACT_TEST_B2B_W_EMAIL",
    passwordName: "CONTRACT_TEST_B2B_W_PASSWORD",
  },
];

const b2c = await ensureUser("CONTRACT_TEST_B2C_EMAIL", "CONTRACT_TEST_B2C_PASSWORD");
const b2bUsers = [];
for (const account of b2bAccounts) {
  const user = await ensureUser(account.emailName, account.passwordName);
  b2bUsers.push(user);

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, auth_user_id")
    .eq("client_code", account.identifier)
    .maybeSingle();
  if (companyError || !company) {
    throw companyError ?? new Error(`B2B company ${account.identifier} is missing.`);
  }
  if (company.auth_user_id && company.auth_user_id !== user.id) {
    throw new Error(`Refusing to replace the existing Auth binding for ${account.identifier}.`);
  }

  const { error: bindError } = await admin
    .from("companies")
    .update({ auth_user_id: user.id })
    .eq("id", company.id);
  if (bindError) throw bindError;
}

const adminUser = await ensureUser("CONTRACT_TEST_ADMIN_EMAIL", "CONTRACT_TEST_ADMIN_PASSWORD");
const businessStaff = await ensureUser(
  "CONTRACT_TEST_BUSINESS_STAFF_EMAIL",
  "CONTRACT_TEST_BUSINESS_STAFF_PASSWORD",
);

const { error: roleError } = await admin.from("app_admins").upsert(
  [
    { user_id: adminUser.id, role: "admin", is_active: true },
    { user_id: businessStaff.id, role: "business_staff", is_active: true },
  ],
  { onConflict: "user_id" },
);
if (roleError) throw roleError;

console.log(`Local contract identities ready: ${[b2c, ...b2bUsers, adminUser, businessStaff].length} users.`);
