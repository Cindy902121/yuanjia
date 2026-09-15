import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function loadTypeScript(relativePath) {
  const moduleRecord = { exports: {} };
  const source = ts.transpileModule(read(relativePath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("exports", "module", source)(moduleRecord.exports, moduleRecord);
  return moduleRecord.exports;
}

const cartPage = read("src/app/(b2c)/cart/cart-page-client.tsx");
const checkoutForm = read("src/app/(b2c)/checkout/checkout-form.tsx");
const productList = read("src/components/editorial/ProductList.tsx");
const categoryPage = read("src/app/(b2c)/products/categories/[slug]/page.tsx");
const tagPage = read("src/app/(b2c)/products/tags/[slug]/page.tsx");
const demoProfile = loadTypeScript("src/lib/cart/demo-profile.ts");

test("B2C shopping labels use clear Traditional Chinese", () => {
  for (const [source, label] of [
    [cartPage, "CART"],
    [cartPage, "CLEAR"],
    [cartPage, "REMOVE"],
    [checkoutForm, "CHECKOUT"],
    [checkoutForm, "ITEMS"],
    [checkoutForm, "COUPON"],
    [checkoutForm, "NOTE"],
    [checkoutForm, "PAYMENT"],
    [checkoutForm, "DELIVERY"],
    [productList, "RESULTS"],
    [productList, "ITEMS"],
    [categoryPage, "ALL PRODUCTS"],
    [categoryPage, "CATEGORY"],
    [tagPage, "ALL PRODUCTS"],
    [tagPage, "TAG"],
  ]) {
    assert.doesNotMatch(source, new RegExp(`>\\s*${label}\\s*<`), `visible label should not be ${label}`);
  }
});

test("clearing the cart requires explicit confirmation", () => {
  assert.match(cartPage, />\s*清空購物車\s*</);
  assert.match(
    cartPage,
    /window\.confirm\("確定要清空購物車嗎？購物車內的所有商品將被移除。"\)/,
  );
});

test("展示會員資料提供四個必填收件欄位", () => {
  assert.equal(typeof demoProfile.getDemoRecipientFields, "function");
  assert.deepEqual(demoProfile.getDemoRecipientFields(), {
    recipient_name: "元家展示會員",
    recipient_phone: "0912345678",
    recipient_email: "demo@yens.com.tw",
    delivery_address: "104台北市中山區南京東路二段100號5樓",
  });
});
