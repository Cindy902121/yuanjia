/**
 * 結構化資料（schema.org JSON-LD）共用元件。Next.js 官方推薦的做法就是在頁面裡
 * 直接輸出一個 `<script type="application/ld+json">`，metadata API 本身沒有
 * 「structuredData」欄位可以填（2026-08-18，使用者要求補上 SEO 技術基礎）。
 *
 * 用 `dangerouslySetInnerHTML` 是必要的（React 預設會把字串內容跳脫成
 * HTML-safe 文字，`<script>` 標籤內部需要的是原始 JSON，不能被跳脫），資料一律
 * 來自我們自己組出的物件（商品名稱／價格這類已經顯示在頁面上的真實資料），不是
 * 使用者輸入，沒有 XSS 疑慮。
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
