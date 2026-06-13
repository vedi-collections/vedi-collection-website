import { Storefront } from "@/components/store/Storefront";
import { getProducts } from "@/lib/shop/client";

export default async function ShopHomePage() {
  // Full catalog fetched on the server (SSR for SEO); the Storefront filters
  // and handles modals client-side per the design_ref single-page experience.
  const products = await getProducts({});
  return <Storefront products={products} />;
}
