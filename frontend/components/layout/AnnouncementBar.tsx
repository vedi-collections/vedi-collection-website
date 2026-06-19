import { PROMO } from "@/lib/shop/promo-config";

/** Top promo strip. Honest by default (no fake countdown); see promo-config.ts. */
export function AnnouncementBar() {
  return (
    <div className="bg-primary-dark px-3 py-2 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-accent-pale">
      {PROMO.announcement}
    </div>
  );
}
