import type { ReactNode } from "react";

// The storefront is a single-page catalog that renders its own chrome
// (announcement bar, header, footer, floating button) inside the Storefront
// component, so this layout is a simple pass-through.
export default function ShopLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
