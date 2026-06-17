"use client";

import { type ReactNode, useState } from "react";

import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/cn";
import { isVideoUrl, productMedia } from "@/lib/shop/media";
import type { Product } from "@/lib/shop/types";

type ProductGalleryProps = {
  product: Product;
  /** Sizing/rounding for the whole gallery (matches the old image pane). */
  className?: string;
  motifClassName?: string;
  /** Overlay rendered on the main media (e.g. the close button). */
  children?: ReactNode;
};

/** Product media gallery: a vertical thumbnail rail on the left and a fixed
 *  square main viewer on the right, so every product shows at identical
 *  dimensions (images are squared at upload; videos are letterboxed on black). */
export function ProductGallery({ product, className, motifClassName, children }: ProductGalleryProps) {
  const media = productMedia(product);
  const [active, setActive] = useState(0);
  const current = media[active] ?? null;
  const seed = product.variants[0];
  const alt = `${product.name} — ${product.shade}`;

  return (
    <div className={cn("flex bg-bg", className)}>
      {media.length > 1 && (
        <div className="flex shrink-0 flex-col gap-2 overflow-y-auto border-r border-line bg-surface p-2 min-[900px]:p-2.5">
          {media.map((url, i) => {
            const isActive = i === active;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View media ${i + 1} of ${media.length}`}
                aria-current={isActive}
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-alt transition",
                  isActive ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                {isVideoUrl(url) ? (
                  <>
                    <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-primary-dark/30 text-xs text-white">
                      ▶
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- storage URLs; next/image remote config not warranted for the modal
                  <img src={url} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative aspect-square min-w-0 flex-1 self-start bg-primary-dark">
        {current && isVideoUrl(current) ? (
          <video
            key={current}
            src={current}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <div className="absolute inset-0">
            <ProductImage seed={seed} imageUrl={current} alt={alt} className="h-full w-full" motifClassName={motifClassName} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
