"use client";

import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/lib/shop/types";

/** Add-to-bag with stock guards + toast feedback, shared by the catalog grid and
 *  the product detail page so the messaging stays identical in both places. */
export function useAddToBag(): (product: Product) => void {
  const { add, lines } = useCart();
  const { show } = useToast();

  return function addToBag(product: Product) {
    if (product.stock <= 0) {
      show(`${product.name} is out of stock`);
      return;
    }
    // Cap at stock: the bag can't hold more pieces than are available. When the
    // bag already holds them all, say so plainly rather than sounding like an error.
    const inBag = lines.find((l) => l.product.id === product.id && !l.size)?.qty ?? 0;
    if (inBag >= product.stock) {
      show(`All ${product.stock} in stock are already in your bag`);
      return;
    }
    add(product);
    show(`${product.name} added to bag`);
  };
}
