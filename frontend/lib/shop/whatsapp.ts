// WhatsApp ordering helpers — Vedi's checkout v1 is a wa.me deep link with a
// prefilled message (no payment gateway, per CLAUDE.md). Logic moved verbatim
// from the original storefront, adapted to paise + the Product/CartLine types.

import { formatINR } from "./money";
import type { CartLine, Product } from "./types";

const SELLER_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_SELLER_WHATSAPP_NUMBER ?? "919968835942";

/** Build a wa.me deep link for an arbitrary prefilled message. */
export function waLink(message: string): string {
  return `https://wa.me/${SELLER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const GREETING = "Namaste! I'd like to know more about Vedi Collections.";

/** Generic "say hello" link used by the header/footer/floating button. */
export function waHelloLink(): string {
  return waLink(GREETING);
}

/** Enquiry about a single product (used on the product detail page). */
export function waProductLink(product: Product, size?: string): string {
  const sizeNote = size ? `, size ${size}` : "";
  return waLink(
    `Namaste! I'm interested in the *${product.name} — ${product.shade}*${sizeNote} (${formatINR(
      product.priceMinor
    )}). Is it available?`
  );
}

/** Notify-me link for a not-yet-live collection. */
export function waNotifyLink(label: string): string {
  return waLink(
    `Namaste! Please let me know when ${label} arrives at Vedi Collections.`
  );
}

/** Compose the cart checkout message and its wa.me link. */
export function buildCartMessage(lines: CartLine[], subtotalMinor: number): string {
  if (lines.length === 0) return GREETING;
  const body = lines
    .map((line) => {
      const sizeNote = line.size ? `, ${line.size}` : "";
      return `• ${line.product.name} (${line.product.shade}${sizeNote}, ${line.product.unit}) × ${line.qty} — ${formatINR(
        line.product.priceMinor * line.qty
      )}`;
    })
    .join("\n");
  return `Namaste! I'd like to place an order with Vedi Collections:\n\n${body}\n\nSubtotal: ${formatINR(
    subtotalMinor
  )}\n\nPlease confirm availability and delivery time.`;
}

export function waCartLink(lines: CartLine[], subtotalMinor: number): string {
  return waLink(buildCartMessage(lines, subtotalMinor));
}
