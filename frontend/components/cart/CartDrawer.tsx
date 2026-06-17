"use client";

import { useEffect } from "react";

import { lineKey, useCart } from "@/components/cart/CartProvider";
import { ProductImage } from "@/components/ui/ProductImage";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { buttonClasses } from "@/components/ui/Button";
import { WhatsAppIcon, CloseIcon, TrashIcon } from "@/components/ui/icons";
import { formatINR } from "@/lib/shop/money";
import { PROMO } from "@/lib/shop/promo-config";
import { waCartLink } from "@/lib/shop/whatsapp";

/** The bag: bottom sheet on mobile, right-side drawer on desktop (design_ref). */
export function CartDrawer() {
  const { lines, subtotalMinor, isOpen, closeCart, changeQty, remove } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }
    document.body.classList.add("is-locked");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const threshold = PROMO.freeShippingThresholdMinor;
  const left = Math.max(0, threshold - subtotalMinor);
  const pct = Math.min(100, Math.round((subtotalMinor / threshold) * 100));
  const shipMsg =
    subtotalMinor >= threshold
      ? "You have unlocked free shipping."
      : `Add ${formatINR(left)} for free shipping.`;

  return (
    <div
      role="presentation"
      onClick={closeCart}
      className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-primary-dark/50 min-[900px]:items-stretch min-[900px]:justify-end"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[84vh] w-full animate-up flex-col overflow-hidden rounded-t-[20px] bg-bg min-[900px]:h-screen min-[900px]:max-h-none min-[900px]:w-[min(440px,100vw)] min-[900px]:animate-slide-in-right min-[900px]:rounded-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-title" className="font-serif text-[23px] font-semibold text-heading">
            Your bag ({count})
          </h2>
          <button
            type="button"
            aria-label="Close bag"
            onClick={closeCart}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-primary"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-serif text-2xl font-semibold italic text-heading">Your bag is empty</h3>
            <p className="mx-auto mt-3 max-w-[30ch] text-sm leading-relaxed text-muted">
              Browse the edit and add the fabrics you would like us to confirm on WhatsApp.
            </p>
            <button type="button" onClick={closeCart} className={buttonClasses("primary", "md", "mt-5")}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {lines.map((line) => {
                const key = lineKey(line.product.id, line.size);
                return (
                  <div key={key} className="grid grid-cols-[58px_1fr_auto] items-center gap-3 border-b border-line py-4">
                    <ProductImage
                      seed={line.product.variants[0]}
                      imageUrl={line.product.imageUrl}
                      alt={line.product.name}
                      className="h-[74px] w-[58px] rounded-lg"
                      motifClassName="text-lg"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-bold text-heading">{line.product.name}</h3>
                      <p className="mb-2 mt-1 text-xs text-muted-soft">
                        {line.product.shade}
                        {line.size ? ` · ${line.size}` : ""} · {line.product.unit}
                      </p>
                      <div className="flex items-center gap-3">
                        <QtyStepper
                          value={line.qty}
                          max={line.product.stock}
                          onChange={(next) => changeQty(key, next - line.qty)}
                          label={line.product.name}
                        />
                        <button
                          type="button"
                          onClick={() => remove(key)}
                          aria-label={`Remove ${line.product.name} from bag`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-soft transition-colors hover:text-primary"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                      {line.qty >= line.product.stock && (
                        <p className="mt-1.5 text-[11px] font-medium text-accent">
                          Only {line.product.stock} in stock
                        </p>
                      )}
                    </div>
                    <strong className="self-start text-[13px] text-heading">
                      {formatINR(line.product.priceMinor * line.qty)}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line bg-surface/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3.5">
              <p className="text-xs text-muted-soft">{shipMsg}</p>
              <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3.5 flex items-center justify-between text-heading">
                <span className="font-bold">Subtotal</span>
                <strong className="text-[19px]">{formatINR(subtotalMinor)}</strong>
              </div>
              <a
                href={waCartLink(lines, subtotalMinor)}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses("whatsapp", "lg", "mt-3.5 w-full")}
              >
                <WhatsAppIcon className="h-5 w-5" /> Checkout on WhatsApp
              </a>
              <p className="mt-2.5 text-center text-xs text-muted-soft">
                Pay via UPI or Cash on Delivery after confirmation.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
