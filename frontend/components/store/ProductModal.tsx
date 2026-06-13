"use client";

import { buttonClasses } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { ProductImage } from "@/components/ui/ProductImage";
import { ArrowLeftIcon, WhatsAppIcon } from "@/components/ui/icons";
import { formatINR, savingsMinor } from "@/lib/shop/money";
import { waProductLink } from "@/lib/shop/whatsapp";
import type { Product } from "@/lib/shop/types";

type ProductModalProps = {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product) => void;
};

/** Product detail overlay: full-screen sheet on mobile, centred two-pane modal
 *  on desktop (design_ref). Scroll-lock + ESC are handled by the parent. */
export function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  const saving = savingsMinor(product.mrpMinor, product.priceMinor);
  const waHref = waProductLink(product);

  const specs: { label: string; value: string }[] = [
    { label: "Fabric", value: product.attributes.fabric },
    { label: "Includes", value: product.attributes.includes },
    { label: "Care", value: product.attributes.care }
  ];

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-40 flex animate-fade items-end justify-center bg-primary-dark/[0.48] min-[900px]:items-center"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-screen w-full max-w-[430px] animate-up flex-col overflow-hidden bg-bg min-[900px]:grid min-[900px]:max-h-[min(760px,calc(100vh-64px))] min-[900px]:w-[min(920px,calc(100vw-64px))] min-[900px]:grid-cols-2 min-[900px]:rounded-[20px] min-[900px]:shadow-[0_30px_80px_rgba(20,5,10,0.5)]"
      >
        <ProductImage
          seed={product.variants[0]}
          imageUrl={product.imageUrl}
          alt={`${product.name} — ${product.shade}`}
          className="h-[min(430px,48vh)] min-h-[300px] shrink-0 min-[900px]:h-auto min-[900px]:min-h-[620px]"
          motifClassName="text-[54px]"
        >
          <button
            type="button"
            aria-label="Close product detail"
            onClick={onClose}
            className="absolute left-4 top-4 z-[2] grid h-[38px] w-[38px] place-items-center rounded-full bg-surface/95 text-primary"
          >
            <ArrowLeftIcon className="h-[18px] w-[18px]" />
          </button>
        </ProductImage>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto p-5 min-[900px]:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {product.audience === "ladies" ? "Ladies" : "Gents"} · {product.category}
              {product.tag ? ` · ${product.tag}` : ""}
            </p>
            <h2 id="modal-title" className="mt-1.5 font-serif text-[27px] font-semibold leading-tight text-heading min-[900px]:text-[32px]">
              {product.name}
            </h2>
            <p className="mt-2 text-sm text-muted-soft">{product.shade}</p>

            <div className="mt-3.5 flex flex-wrap items-baseline gap-2.5">
              <PriceTag priceMinor={product.priceMinor} mrpMinor={product.mrpMinor} size="lg" />
              {saving > 0 && <span className="text-xs font-bold text-whatsapp">Save {formatINR(saving)}</span>}
            </div>

            <dl className="mt-5">
              {specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 border-t border-line py-3">
                  <dt className="text-xs text-muted-soft">{spec.label}</dt>
                  <dd className="text-[13px] font-bold leading-snug text-heading">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-xl bg-info p-3.5 text-[13px] leading-relaxed text-muted">
              Order is confirmed on WhatsApp after stock check.{" "}
              <a href={waHref} target="_blank" rel="noreferrer" className="font-bold text-whatsapp-dark">
                Ask availability now
              </a>
              .
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-line bg-surface/95 p-4 pb-[calc(12px+env(safe-area-inset-bottom))] min-[900px]:px-8">
            <button type="button" onClick={() => onAdd(product)} className={buttonClasses("primary", "lg")}>
              Add to bag
            </button>
            <a href={waHref} target="_blank" rel="noreferrer" className={buttonClasses("whatsapp", "lg")}>
              <WhatsAppIcon className="h-5 w-5" /> Order now
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
