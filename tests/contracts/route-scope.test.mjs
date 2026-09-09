import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const prd = read("docs/PRDv3.1.md");
const fdd = read("docs/FDDv4.1.md");
const routeSpecs = [
  read("docs/route-and-permission-spec.md"),
  read("docs/元家網站_路由與權限規格.md"),
];

test("正式 MVP 路由範圍在 PRD、FDD 與路由規格一致", () => {
  const formalRoutes = [
    "/business",
    "/business/about",
    "/business/about/[slug]",
    "/business/news",
    "/business/news/{activities,offers,yuanjia}",
    "/business/news/article/[slug]",
    "/news",
    "/news/[slug]",
    "/media",
    "/media/[slug]",
  ];

  for (const document of [prd, fdd, ...routeSpecs]) {
    for (const route of formalRoutes) {
      assert.ok(document.includes(route), `${route} should be documented`);
    }
  }

  assert.match(prd, /正式 MVP 路由範圍決策/);
  assert.match(fdd, /B2B 登入後內容首頁/);
  for (const spec of routeSpecs) {
    assert.match(spec, /MVP v3\.1/);
    assert.match(spec, /B2B 登入後內容首頁/);
  }
});

test("sitemap 與預覽頁的索引邊界符合路由決策", () => {
  const sitemap = read("src/app/sitemap.ts");
  const sitemapEntries = sitemap.slice(
    sitemap.indexOf("const staticEntries"),
    sitemap.indexOf("const productEntries"),
  );
  assert.match(sitemap, /SITE_URL}\/news/);
  assert.match(sitemap, /SITE_URL}\/media/);
  assert.doesNotMatch(sitemapEntries, /SITE_URL}\/cart/);
  assert.doesNotMatch(sitemapEntries, /business\/about|business\/news|homepage-preview|prototype-home|catalog-preview/);

  for (const page of [
    "src/app/business/homepage-preview/page.tsx",
    "src/app/business/prototype-home/page.tsx",
    "src/app/catalog-preview/layout.tsx",
  ]) {
    assert.match(read(page), /index: false/);
  }
});

test("B2B 正式內容路由保留伺服器端角色邊界", () => {
  for (const page of [
    "src/app/business/page.tsx",
    "src/app/business/about/page.tsx",
    "src/app/business/about/[slug]/page.tsx",
    "src/app/business/news/page.tsx",
    "src/app/business/news/news-list-page.tsx",
    "src/app/business/news/article/[slug]/page.tsx",
  ]) {
    const source = read(page);
    assert.match(source, /getB2BAccess/);
    assert.match(source, /redirect\("\/login"\)/);
    assert.match(source, /redirect\("\/"\)/);
    assert.match(source, /redirect\("\/admin/);
  }
});
