// Money helpers. All amounts are integer PAISE (see lib/shop/types.ts).
// This is the SINGLE place money is formatted for display.

/** Format paise as INR, e.g. 185000 -> "₹1,850". */
export function formatINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

/** Whole-percent discount of price vs MRP, or null when there's no real saving. */
export function discountPct(mrpMinor: number | null, priceMinor: number): number | null {
  if (!mrpMinor || mrpMinor <= priceMinor) return null;
  return Math.round(((mrpMinor - priceMinor) / mrpMinor) * 100);
}

/** Saving amount in paise (0 when not on sale). */
export function savingsMinor(mrpMinor: number | null, priceMinor: number): number {
  if (!mrpMinor || mrpMinor <= priceMinor) return 0;
  return mrpMinor - priceMinor;
}
