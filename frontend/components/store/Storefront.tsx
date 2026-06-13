"use client";

import { useEffect, useRef, useState } from "react";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/components/cart/CartProvider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Container } from "@/components/layout/Container";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { CategoryNav, SubChips } from "@/components/store/CategoryNav";
import { ComingSoonPanel } from "@/components/store/ComingSoonPanel";
import { ProductModal } from "@/components/store/ProductModal";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreHero } from "@/components/store/StoreHero";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { TrustStrip } from "@/components/store/TrustStrip";
import { useToast } from "@/components/ui/Toast";
import { filterProducts, sectionTitle, SUBS, type MainTab } from "@/lib/shop/catalog";
import type { Product } from "@/lib/shop/types";

/** Single-page WhatsApp catalog (design_ref): header, hero, in-page category
 *  filtering, product grid, modal detail, and bag drawer. */
export function Storefront({ products }: { products: Product[] }) {
  const { add, count, hydrated, openCart } = useCart();
  const { show } = useToast();

  const gridRef = useRef<HTMLElement | null>(null);
  const [main, setMain] = useState<MainTab>("All");
  const [sub, setSub] = useState<string | null>(null); // active sub-category label
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const subDefs = main === "All" ? [] : SUBS[main];
  const selectedSub = subDefs.find((s) => s.label === sub) ?? null;
  const showComing = Boolean(selectedSub?.soon);
  const activeSlug = selectedSub && !selectedSub.soon ? selectedSub.slug ?? null : null;
  const sectionSubLabel = activeSlug ? selectedSub?.label ?? null : null;

  // React Compiler memoizes this automatically — no manual useMemo needed.
  const filtered = filterProducts(products, main, activeSlug);
  const selectedProduct = products.find((p) => p.id === selectedId) ?? null;
  const showCount = hydrated && count > 0;

  function chooseMain(next: MainTab) {
    setMain(next);
    setSub(null);
  }
  function chooseSub(label: string) {
    setSub((cur) => (cur === label ? null : label));
  }
  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function navigate(nextMain: MainTab, subLabel?: string) {
    setMain(nextMain);
    setSub(subLabel ?? null);
    window.setTimeout(scrollToGrid, 30);
  }
  function addToCart(product: Product) {
    add(product);
    show(`${product.name} added to bag`);
  }

  // Scroll lock + ESC for the product modal (the cart handles its own).
  useEffect(() => {
    if (!selectedProduct) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    document.body.classList.add("is-locked");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedProduct]);

  return (
    <div className="bg-framebg">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-clip bg-bg shadow-[0_0_42px_rgba(62,15,30,0.12)] min-[900px]:max-w-none min-[900px]:overflow-visible min-[900px]:shadow-none">
        <AnnouncementBar />
        <StoreHeader main={main} onMain={chooseMain} count={count} showCount={showCount} onOpenCart={openCart} />

        <main>
          {products[0] && <StoreHero featured={products[0]} onShop={scrollToGrid} />}

          <CategoryNav main={main} onMain={chooseMain} subs={subDefs} activeSub={sub} onSub={chooseSub} />

          <section ref={gridRef} className="scroll-mt-20">
            <Container className="py-3.5 min-[900px]:py-10">
              <div className="mb-3.5 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Curated fabrics</p>
                  <h2 className="font-serif text-[22px] font-semibold leading-none text-heading min-[900px]:text-[32px]">
                    {showComing ? sub : sectionTitle(main, sectionSubLabel)}
                  </h2>
                </div>
                <span className="shrink-0 text-xs text-muted-soft">
                  {showComing ? "Soon" : `${filtered.length} items`}
                </span>
              </div>

              {subDefs.length > 0 && (
                <div className="mb-5 hidden min-[900px]:block">
                  <SubChips subs={subDefs} active={sub} onSelect={chooseSub} />
                </div>
              )}

              {showComing && sub ? (
                <ComingSoonPanel label={sub} />
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-[900px]:grid-cols-4 min-[900px]:gap-x-5 min-[900px]:gap-y-7">
                  {filtered.map((product) => (
                    <StoreProductCard
                      key={product.id}
                      product={product}
                      onOpen={() => setSelectedId(product.id)}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              )}
            </Container>
          </section>

          <TrustStrip />
        </main>

        <StoreFooter onNavigate={navigate} />
        <FloatingWhatsApp />

        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedId(null)} onAdd={addToCart} />
        )}
        <CartDrawer />
      </div>
    </div>
  );
}
