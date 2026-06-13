// Promo configuration. The reference site leans on countdown timers and
// fabricated "Extra X% OFF" overlays. We build the SLOTS for these but default
// to honest values: a real announcement, no fake countdown, and discount badges
// derived from genuine MRP vs price (computed in components, not faked here).
//
// Fake/resetting urgency timers are a dark pattern flagged under India's CCPA
// guidelines and clash with the WhatsApp-confirmed (non-instant) checkout, so
// `countdown` is off by default. To run a real, time-bound sale, set
// `countdown.endsAt` to a future ISO date — that's the only change needed.

export type PromoConfig = {
  announcement: string;
  countdown: { label: string; endsAt: string } | null;
  /** Show discount % badges on cards (derived from real MRP, never fabricated). */
  showDiscountBadges: boolean;
  /** Free-shipping threshold in PAISE (drives the cart progress bar). */
  freeShippingThresholdMinor: number;
};

export const PROMO: PromoConfig = {
  announcement: "Free shipping pan-India above ₹1,999 · Order & pay over WhatsApp",
  countdown: null,
  showDiscountBadges: true,
  freeShippingThresholdMinor: 199900
};
