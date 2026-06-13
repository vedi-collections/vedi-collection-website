import { cn } from "@/lib/cn";
import { discountPct, formatINR } from "@/lib/shop/money";

type PriceTagProps = {
  priceMinor: number;
  mrpMinor?: number | null;
  /** Visual scale: card prices vs the larger product-detail price. */
  size?: "sm" | "lg";
  className?: string;
};

/** The single component for rendering a price (sale + struck MRP + % off). */
export function PriceTag({ priceMinor, mrpMinor = null, size = "sm", className }: PriceTagProps) {
  const pct = discountPct(mrpMinor, priceMinor);
  const big = size === "lg";

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-bold text-heading", big ? "text-2xl" : "text-sm")}>
        {formatINR(priceMinor)}
      </span>
      {mrpMinor && mrpMinor > priceMinor && (
        <span className={cn("text-muted-strike line-through", big ? "text-sm" : "text-xs")}>
          {formatINR(mrpMinor)}
        </span>
      )}
      {pct !== null && (
        <span className={cn("font-bold text-whatsapp", big ? "text-sm" : "text-xs")}>
          {pct}% off
        </span>
      )}
    </div>
  );
}
