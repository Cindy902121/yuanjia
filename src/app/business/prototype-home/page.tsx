import PrototypeHomeClient from "./prototype-home-client";

export default async function PrototypeHomePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return <PrototypeHomeClient initialVariant={variant} />;
}
