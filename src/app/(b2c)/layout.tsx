import { Header } from "@/components/Header";

/** B2C 專屬版面：只讓消費者首頁與商品頁共用 B2C 導覽列。 */
export default function B2CLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
