"use client";

import { useRouter } from "next/navigation";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/components/cart/CartProvider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/store/ProductGallery";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { buttonClasses } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { ArrowLeftIcon, WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { shopLinksFor } from "@/lib/shop/catalog";
import { formatINR, savingsMinor } from "@/lib/shop/money";
import { useAddToBag } from "@/lib/shop/use-add-to-bag";
import { waProductLink } from "@/lib/shop/whatsapp";
import type { Product } from "@/lib/shop/types";

/** Full product detail PAGE (own URL, /product/[id]) — replaces the old modal so
 *  every product opens like an Amazon product page: server-rendered for SEO and
 *  WhatsApp link previews, full storefront chrome, stacked on mobile and a
 *  two-pane layout on desktop. */
export function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const router = useRouter();
  const { count, hydrated, openCart } = useCart();
  const addToBag = useAddToBag();

  const saving = savingsMinor(product.mrpMinor, product.priceMinor);
  const waHref = waProductLink(product);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const showCount = hydrated && count > 0;

  // Category eyebrow from the real audience + sub-category.
  const audienceLabel = product.audience === "ladies" ? "Women" : "Men";
  const subcategoryLabel = product.category && product.category !== "Collection" ? product.category : null;
  const categoryLabel = [audienceLabel, subcategoryLabel].filter(Boolean).join(" · ");

  function goHome() {
    router.push("/");
  }
  function goBack() {
    // Return to wherever they came from; fall back to home on a direct deep-link.
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  }

  const actions = (
    <>
      <button
        type="button"
        onClick={() => addToBag(product)}
        disabled={outOfStock}
        className={buttonClasses("cta", "lg", "disabled:cursor-not-allowed disabled:opacity-50")}
      >
        {outOfStock ? "Out of stock" : "Add to bag"}
      </button>
      <a href={waHref} target="_blank" rel="noreferrer" className={buttonClasses("whatsapp", "lg")}>
        <WhatsAppIcon className="h-5 w-5" /> Order now
      </a>
    </>
  );

  return (
    <div className="bg-framebg">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-clip bg-bg shadow-[0_0_42px_rgba(62,15,30,0.12)] min-[900px]:max-w-none min-[900px]:overflow-visible min-[900px]:shadow-none">
        <AnnouncementBar />
        <StoreHeader main="All" onMain={goHome} count={count} showCount={showCount} onOpenCart={openCart} />

        <main className="pb-[96px] min-[900px]:pb-0">
          <Container className="py-0 min-[900px]:py-8">
            <button
              type="button"
              onClick={goBack}
              className="hidden items-center gap-2 py-5 text-sm font-bold text-muted hover:text-primary min-[900px]:inline-flex"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </button>

            <article className="min-[900px]:grid min-[900px]:grid-cols-[1fr_1.05fr] min-[900px]:items-start min-[900px]:gap-9">
              <ProductGallery
                product={product}
                className="w-full shrink-0 min-[900px]:sticky min-[900px]:top-24 min-[900px]:self-start min-[900px]:overflow-hidden min-[900px]:rounded-2xl min-[900px]:border min-[900px]:border-line"
                motifClassName="text-[54px]"
              >
                <button
                  type="button"
                  aria-label="Go back"
                  onClick={goBack}
                  className="absolute left-4 top-4 z-[2] grid h-[38px] w-[38px] place-items-center rounded-full bg-surface/95 text-primary shadow-[0_2px_8px_rgba(40,10,18,0.2)] min-[900px]:hidden"
                >
                  <ArrowLeftIcon className="h-[18px] w-[18px]" />
                </button>
              </ProductGallery>

              <div className="p-5 min-[900px]:p-0">
                {categoryLabel && (
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                    {categoryLabel}
                  </p>
                )}
                <h1
                  className={cn(
                    "font-serif text-[27px] font-semibold leading-tight text-heading min-[900px]:text-[34px]",
                    categoryLabel && "mt-1.5",
                  )}
                >
                  {product.name}
                </h1>

                <div className="mt-3.5 flex flex-wrap items-baseline gap-2.5">
                  <PriceTag priceMinor={product.priceMinor} mrpMinor={product.mrpMinor} size="lg" />
                  {saving > 0 && <span className="text-xs font-bold text-whatsapp">Save {formatINR(saving)}</span>}
                </div>

                {product.shade && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{product.shade}</p>
                )}

                <div className="mt-5 space-y-3.5">
                  {outOfStock ? (
                    <p className="text-[13px] font-bold text-accent">Out of stock</p>
                  ) : lowStock ? (
                    <p className="text-[13px] font-bold text-accent">Only {product.stock} left in stock</p>
                  ) : null}

                  <div className="rounded-xl bg-info p-3.5 text-[13px] leading-relaxed text-muted">
                    Order is confirmed on WhatsApp after stock check.{" "}
                    <a href={waHref} target="_blank" rel="noreferrer" className="font-bold text-whatsapp-dark">
                      Ask availability now
                    </a>
                    .
                  </div>
                </div>

                <div className="mt-7 hidden gap-2.5 min-[900px]:grid min-[900px]:grid-cols-2">{actions}</div>
              </div>
            </article>

            {related.length > 0 && (
              <section className="mt-12 px-5 pb-10 min-[900px]:mt-16 min-[900px]:px-0">
                <h2 className="font-serif text-[22px] font-semibold leading-none text-heading min-[900px]:text-[28px]">
                  You may also like
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 min-[900px]:mt-6 min-[900px]:grid-cols-4 min-[900px]:gap-x-5 min-[900px]:gap-y-7">
                  {related.map((p) => (
                    <StoreProductCard key={p.id} product={p} onAdd={addToBag} />
                  ))}
                </div>
              </section>
            )}
          </Container>
        </main>

        {/* Mobile sticky action bar (desktop shows the buttons inline above). */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur min-[900px]:hidden">
          <div className="mx-auto grid max-w-[430px] grid-cols-2 gap-2.5 p-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {actions}
          </div>
        </div>

        <StoreFooter onNavigate={goHome} links={shopLinksFor([product, ...related])} />
        <CartDrawer />
      </div>
    </div>
  );
}
