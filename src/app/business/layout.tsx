import BusinessFooter from "./business-footer";

export default function BusinessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}<BusinessFooter /></>;
}
