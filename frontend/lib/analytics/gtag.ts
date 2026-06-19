// Google Ads conversion tracking — the "Google tag" (gtag.js).
// The base tag is loaded sitewide from app/layout.tsx; the purchase conversion
// is fired from the cart when a customer starts checkout on WhatsApp.
//
// ─── GOOGLE ADS IDENTIFIERS ────────────────────────────────────────────────
//   GOOGLE_ADS_ID              Conversion ID            → set (AW-18016707416)
//   PURCHASE_CONVERSION_LABEL  purchase Conversion Label → ⚠️ STILL A PLACEHOLDER
//     Replace REPLACE_WITH_LABEL with the label from Google Ads →
//     Goals → Conversions → your "Purchase" action → Tag setup (use Google tag).
//     It looks like "AW-18016707416/AbCdEf123_gQ".
// ──────────────────────────────────────────────────────────────────────────
export const GOOGLE_ADS_ID = "AW-18016707416";
export const PURCHASE_CONVERSION_LABEL = "AW-18016707416/REPLACE_WITH_LABEL";

// gtag.js attaches these to window. Typed here so callers stay strict-mode clean.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire the Google Ads purchase conversion. No-op on the server or before
 * gtag.js has loaded. `valueMinor` is paise (the app's money unit); Google
 * expects the value in major units (rupees), so it's divided by 100 here.
 */
export function trackPurchaseConversion(params: {
  valueMinor: number;
  currency: string;
  transactionId: string;
}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {
    send_to: PURCHASE_CONVERSION_LABEL,
    value: params.valueMinor / 100, // paise → rupees
    currency: params.currency,
    transaction_id: params.transactionId
  });
}

/** A client-side order reference used as the conversion's transaction_id. */
export function newOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `VC-${crypto.randomUUID()}`;
  }
  return `VC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const FIRED_KEY = "vc:ads:fired-conversions";

/**
 * Returns true the first time `key` is seen this session, false thereafter.
 * Backed by sessionStorage so repeated checkout clicks — or a page refresh —
 * don't double-count the same cart. Fails open (returns true) if storage is
 * unavailable, since under-counting a conversion is worse than a rare dupe.
 */
export function claimOnce(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(FIRED_KEY);
    const fired: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (fired.includes(key)) return false;
    fired.push(key);
    // Keep the list bounded; only recent carts matter for de-duping.
    window.sessionStorage.setItem(FIRED_KEY, JSON.stringify(fired.slice(-50)));
    return true;
  } catch {
    return true;
  }
}
