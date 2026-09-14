import type { Metadata } from "next";

import PrototypeHomeClient from "./prototype-home-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "B2B 官網 UI 概念預覽 | 元家",
};

export default async function PrototypeHomePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return <PrototypeHomeClient initialVariant={variant} />;
}
