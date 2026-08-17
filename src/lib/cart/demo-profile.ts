/**
 * 「使用展示會員資料」勾選後帶入結帳表單的寫死示範資料。
 *
 * 2026-08-17：使用者要求結帳表單要能「使用會員資料」預設帶入收件資訊，但系統
 * 目前沒有真正的會員個人資料／地址儲存（FDD 沒有這張表，b2c_orders 也只存
 * 單次送出的收件資訊，不是會員檔案）。跟使用者確認後採用的做法：不是接一個
 * 不存在的真實會員資料來源，而是為展示帳號寫一組固定示範資料，勾選後帶入
 * 表單、使用者仍可自行修改——跟 /login 的展示帳號（demo@yens.com.tw）用同一個
 * Email，維持展示資料前後一致。
 */
export const DEMO_MEMBER_PROFILE = {
  recipientName: "元家展示會員",
  recipientPhone: "0912345678",
  recipientEmail: "demo@yens.com.tw",
  deliveryAddress: "104台北市中山區南京東路二段100號5樓",
} as const;
