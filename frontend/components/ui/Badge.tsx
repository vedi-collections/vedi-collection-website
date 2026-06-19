import { cn } from "@/lib/cn";

/** Marketing tag pill (e.g. "Bestseller"), shown over product images. */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-surface/95 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Discount percentage pill, derived from real MRP vs price (never fabricated). */
export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-badge px-2 py-1 text-xs font-bold text-badge-fg",
        className
      )}
    >
      {percent}% OFF
    </span>
  );
}
