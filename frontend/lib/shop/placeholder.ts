// Gradient image placeholders. Until product images are mirrored from Meta into
// our storage (imageUrl is null), we render an elegant woven-fabric gradient
// seeded from each variant's colours. Kept from the original storefront.

import type { CSSProperties } from "react";

type PlaceholderSeed = { c1: string; c2: string; light?: boolean };

/** Inline style for a gradient fabric placeholder. Exposes `--motif` for the ✦. */
export function placeholderStyle(seed: PlaceholderSeed): CSSProperties {
  return {
    "--motif": seed.light ? "rgba(62,18,32,0.30)" : "rgba(250,241,220,0.40)",
    background: `linear-gradient(to top, rgba(185,138,60,0.92) 0%, rgba(185,138,60,0.92) 8%, rgba(0,0,0,0) 8.5%), repeating-linear-gradient(105deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 13px), linear-gradient(155deg, ${seed.c1} 12%, ${seed.c2} 90%)`
  } as CSSProperties;
}
