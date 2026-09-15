import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../..", import.meta.url).pathname;

function read(relativePath) {
  try {
    return readFileSync(join(root, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

const login = read("src/app/login/login-form.tsx");
const recovery = read("src/app/reset-password/reset-password-form.tsx");
const callback = read("src/app/auth/callback/route.ts");
const businessRfq = read("src/app/business/rfq/rfq-history-client.tsx");
const adminRfq = read("src/app/admin/rfq-workspace.tsx");
const checkout = read("src/app/(b2c)/checkout/checkout-form.tsx");

test("email login exposes a complete password recovery flow", () => {
  assert.match(login, /href="\/reset-password"/);
  assert.match(login, /忘記密碼/);
  assert.match(recovery, /resetPasswordForEmail/);
  assert.match(recovery, /updateUser\(\{ password/);
  assert.match(recovery, /aria-describedby="reset-password-help"/);
  assert.match(recovery, /canReset/);
  assert.match(recovery, /event === "PASSWORD_RECOVERY"/);
  assert.match(callback, /searchParams\.get\("next"\)/);
  assert.match(callback, /\/reset-password/);
  assert.match(callback, /password-recovery/);
});

test("B2B and Admin RFQ status vocabulary explains the same progress", () => {
  assert.match(businessRfq, /status === "processing" \|\| status === "reviewing"/);
  assert.match(businessRfq, /狀態對照/);
  assert.match(adminRfq, /企業端「已送出」.*「新詢價」/);
});

test("checkout waits for the browser cart snapshot before showing empty state", () => {
  const cartStore = read("src/lib/cart/store.ts");
  assert.match(checkout, /isCartReady/);
  assert.match(checkout, /正在載入購物車/);
  assert.match(checkout, /if \(!isCartReady\)/);
  assert.match(cartStore, /getCartReadySnapshot/);
  assert.match(cartStore, /getCartSnapshot\(\);/);
});
