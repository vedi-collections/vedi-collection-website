import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductView } from "@/components/store/ProductView";
import { getProduct, getRelatedProducts } from "@/lib/shop/client";
import { formatINR } from "@/lib/shop/money";

type Params = { params: Promise<{ id: string }> };

// Server-rendered detail page: real URL per product (SEO + shareable WhatsApp
// link previews via OG tags), full catalog data fetched on the server.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found" };

  const description = product.shade || `Available now at Vedi Collections — ${formatINR(product.priceMinor)}.`;
  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} · Vedi Collections`,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  return <ProductView product={product} related={related} />;
}
