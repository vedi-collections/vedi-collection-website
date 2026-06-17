import type { MouseEvent } from "react";
import Link from "next/link";

import { Tag } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Product } from "@/lib/shop/types";

type StoreProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

/** Catalog card. The whole card is a link to the product detail page
 *  (/product/[id]); the + button quick-adds to the bag without navigating
 *  (design_ref behaviour). The link is a stretched overlay so the card stays
 *  valid markup (no <button> nested inside the <a>). */
export function StoreProductCard({ product, onAdd }: StoreProductCardProps) {
  function quickAdd(event: MouseEvent<HTMLButtonElement>) {
    // Sits above the stretched link — stop it from following the card link.
    event.preventDefault();
    event.stopPropagation();
    onAdd(product);
  }

  return (
    <article className="group relative transition-transform duration-200 hover:-translate-y-1">
      <ProductImage
        seed={product.variants[0]}
        imageUrl={product.imageUrl}
        alt={`${product.name} — ${product.shade}`}
        className="aspect-[3/4] rounded-xl transition-shadow duration-200 group-hover:shadow-[0_14px_30px_rgba(60,20,30,0.22)] min-[900px]:rounded-2xl"
      >
        {product.tag && <Tag className="absolute left-2 top-2 z-[2]">{product.tag}</Tag>}
        <button
          type="button"
          aria-label={`Add ${product.name} to bag`}
          onClick={quickAdd}
          className="absolute bottom-2 right-2 z-[2] grid h-8 w-8 place-items-center rounded-full bg-surface text-xl leading-none text-primary shadow-[0_2px_8px_rgba(40,10,18,0.25)]"
        >
          +
        </button>
      </ProductImage>

      <div className="pt-2.5">
        <h3 className="text-sm font-semibold leading-tight text-heading min-[900px]:text-[15px]">{product.name}</h3>
        <p className="mt-1 text-xs text-muted-soft min-[900px]:text-[13px]">{product.shade}</p>
        <PriceTag priceMinor={product.priceMinor} mrpMinor={product.mrpMinor} className="mt-1.5" />
      </div>

      {/* Stretched link covers the whole card; interactive controls above use z-[2]. */}
      <Link
        href={`/product/${product.id}`}
        aria-label={`${product.name} — ${product.shade}`}
        className="absolute inset-0 z-[1] rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </article>
  );
}
