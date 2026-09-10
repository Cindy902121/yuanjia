import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const root = resolve(import.meta.dirname, "../..");
const require = createRequire(import.meta.url);

function load(relative, mocks = {}, cache = new Map()) {
  const path = resolve(root, relative);
  if (cache.has(path)) return cache.get(path).exports;
  const moduleRecord = { exports: {} };
  cache.set(path, moduleRecord);
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (id) => {
    if (id in mocks) return mocks[id];
    const base = id.startsWith("@/")
      ? resolve(root, "src", id.slice(2))
      : id.startsWith(".")
        ? resolve(dirname(path), id)
        : null;
    if (!base) return require(id);
    const candidate = existsSync(base + ".ts") ? base + ".ts" : base;
    return load(candidate, mocks, cache);
  };
  new Function("exports", "require", "module", source)(
    moduleRecord.exports,
    localRequire,
    moduleRecord,
  );
  return moduleRecord.exports;
}

test("Supabase auth retry failures are surfaced as an unavailable admin context", async () => {
  const auth = load("src/lib/auth-context.ts", {
    "./supabase/server": {
      createClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: { name: "AuthRetryableFetchError", status: 0, message: "offline" },
          }),
        },
      }),
    },
    "./supabase/admin": { createAdminClient: () => { throw new Error("unused"); } },
  });

  const context = await auth.getAdminContext();
  assert.equal(context.user, null);
  assert.equal(context.databaseError?.name, "AuthRetryableFetchError");
});

test("business staff opening the admin route is redirected to the legal B2B workspace", async () => {
  class Redirect extends Error {
    constructor(location) {
      super(location);
      this.location = location;
    }
  }

  const pageAuth = load("src/lib/admin-page-auth.ts", {
    "next/navigation": {
      redirect: (location) => { throw new Redirect(location); },
    },
    "./auth-context": {
      getAdminContext: async () => ({
        user: { id: "staff" },
        role: "business_staff",
        configurationError: null,
        databaseError: null,
      }),
      getB2bContext: async () => ({ company: null, databaseError: null }),
    },
  });

  await assert.rejects(
    pageAuth.requireAdminPage("/admin"),
    (error) => error instanceof Redirect && error.location === "/admin/business?tab=b2b-products",
  );
});

test("admin page auth returns an unavailable state for Supabase failures", async () => {
  const pageAuth = load("src/lib/admin-page-auth.ts", {
    "next/navigation": { redirect: () => { throw new Error("unexpected redirect"); } },
    "./auth-context": {
      getAdminContext: async () => ({
        user: null,
        role: null,
        configurationError: null,
        databaseError: { message: "offline" },
      }),
      getB2bContext: async () => ({ company: null, databaseError: null }),
    },
  });

  assert.deepEqual(await pageAuth.requireAdminPage("/admin/business"), { unavailable: true });
});
