import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const execute = process.argv.includes("--execute");

const sources = [
  ["B2B-FISH-001", "智利鮭魚切片", "元家智利鮭魚切片商品主圖", ["detail-01.jpg", "detail-02.jpg"]],
  ["B2B-FISH-002", "午仔魚整尾", "元家午仔魚整尾商品主圖", ["detail-01.jpg", "detail-02.jpg"]],
  ["B2B-FISH-003", "鯖魚菲力", "元家鯖魚菲力商品主圖", ["detail-01.jpg", "detail-02.jpg", "detail-03.jpg"]],
  ["B2B-SHRIMP-001", "白蝦原料", "元家白蝦原料商品主圖", ["detail-01.jpg", "detail-02.jpg", "detail-03.jpg"]],
  ["B2B-SHELL-001", "熟凍扇貝", "元家熟凍扇貝商品主圖", ["detail-01.jpg", "detail-02.jpg", "detail-03.jpg"]],
  ["B2B-SOFT-001", "透抽圈", "元家透抽圈商品主圖", []],
  ["B2B-MEAT-001", "去骨雞腿肉切塊", "元家去骨雞腿肉切塊商品主圖", ["detail-01.jpg"]],
  ["B2B-PREP-001", "調理海鮮丸", "元家調理海鮮丸商品主圖", []],
].map(([productCode, name, coverAlt, details]) => ({
  productCode,
  name,
  coverAlt,
  files: [
    { filename: "main.jpg", role: "cover", altText: coverAlt, sortOrder: 0 },
    ...details.map((filename, index) => ({
      filename,
      role: "detail",
      altText: `元家${name}商品細節圖 ${index + 1}`,
      sortOrder: index + 1,
    })),
  ],
}));

function readEnvFile(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}

const env = readEnvFile(await readFile(path.join(root, ".env.local"), "utf8"));
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  throw new Error(".env.local 缺少 Supabase 連線設定。");
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const planned = [];
for (const source of sources) {
  for (const file of source.files) {
    const filePath = path.join(root, "public", "products", "b2b", source.productCode, file.filename);
    const fileInfo = await stat(filePath);
    if (fileInfo.size === 0 || fileInfo.size > 5 * 1024 * 1024) {
      throw new Error(`${filePath} 的檔案大小不符合 5 MB 限制。`);
    }
    planned.push({ ...source, ...file, filePath, bytes: fileInfo.size });
  }
}

const { data: products, error: productError } = await client
  .from("b2b_products")
  .select("id,product_code")
  .in("product_code", sources.map((source) => source.productCode));
if (productError) throw productError;
if ((products ?? []).length !== sources.length) {
  throw new Error("資料庫中的 B2B 商品數量與匯入清單不一致，已停止。" );
}

const { count: existingImageCount, error: existingError } = await client
  .from("b2b_product_images")
  .select("id", { count: "exact", head: true });
if (existingError) throw existingError;
if (existingImageCount !== 0) {
  throw new Error(`b2b_product_images 已有 ${existingImageCount} 筆資料，為避免重複上傳已停止。`);
}

console.table(planned.map(({ productCode, filename, role, sortOrder, bytes }) => ({ productCode, filename, role, sortOrder, bytes })));
if (!execute) {
  console.log(`預覽完成：共 ${planned.length} 張。加入 --execute 才會上傳。`);
  process.exit(0);
}

const productIds = new Map(products.map((product) => [product.product_code, product.id]));
let completed = 0;
for (const item of planned) {
  const productId = productIds.get(item.productCode);
  const storagePath = `products/${productId}/${randomUUID()}.jpg`;
  const file = await readFile(item.filePath);
  const { error: uploadError } = await client.storage.from("b2b-media").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: imageError } = await client.from("b2b_product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    image_role: item.role,
    alt_text: item.altText,
    sort_order: item.sortOrder,
  });
  if (imageError) {
    await client.storage.from("b2b-media").remove([storagePath]);
    throw imageError;
  }
  completed += 1;
  console.log(`已上傳 ${completed}/${planned.length}：${item.productCode} ${item.filename}`);
}

console.log(`上傳完成：${completed} 張 B2B 商品圖片。`);
