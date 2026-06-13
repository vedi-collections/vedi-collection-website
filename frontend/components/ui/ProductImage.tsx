import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { placeholderStyle } from "@/lib/shop/placeholder";

type Seed = { c1: string; c2: string; light?: boolean };

type ProductImageProps = {
  imageUrl?: string | null;
  seed: Seed;
  alt: string;
  /** Container classes — control size, aspect ratio and rounding here. */
  className?: string;
  /** Show the woven-border + ✦ motif on the gradient placeholder. */
  motif?: boolean;
  motifClassName?: string;
  /** Overlays such as tags or quick-add buttons. */
  children?: ReactNode;
};

/**
 * Renders a product image. Uses our stored image when available, otherwise an
 * elegant gradient fabric placeholder seeded from the variant colours.
 */
export function ProductImage({
  imageUrl,
  seed,
  alt,
  className,
  motif = true,
  motifClassName = "text-3xl",
  children
}: ProductImageProps) {
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden", className)}
      style={imageUrl ? undefined : placeholderStyle(seed)}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- real images are mirrored to our storage later; URLs/domains TBD.
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        motif && (
          <>
            <span className="pointer-events-none absolute bottom-[16%] left-[12%] right-[12%] top-[16%] rounded-[999px_999px_20px_20px] border border-[color:var(--motif)]" />
            <span className={cn("font-serif italic text-[color:var(--motif)]", motifClassName)}>✦</span>
          </>
        )
      )}
      {children}
    </div>
  );
}
