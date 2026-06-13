// Catalog navigation for the single-page storefront (per design_ref):
// main tabs (All / Ladies / Gents) + sub-categories, some "coming soon".
// Filtering is in-page and client-side over the full product list.

import type { Audience, Product } from "./types";

export type MainTab = "All" | "Ladies" | "Gents";

export const MAIN_TABS: MainTab[] = ["All", "Ladies", "Gents"];

export type SubDef = {
  label: string;
  /** Category slug for live subs; absent for coming-soon ones. */
  slug?: string;
  soon?: boolean;
};

export const SUBS: Record<Exclude<MainTab, "All">, SubDef[]> = {
  Ladies: [
    { label: "Suits", slug: "suits" },
    { label: "Sarees", soon: true },
    { label: "Haryanvi Dress", soon: true }
  ],
  Gents: [
    { label: "Pant-Shirt Cloth", slug: "pant-shirt-cloth" },
    { label: "Safari Cloth", slug: "safari-cloth" }
  ]
};

const AUDIENCE_OF: Record<Exclude<MainTab, "All">, Audience> = {
  Ladies: "ladies",
  Gents: "gents"
};

/** Filter products by the active main tab + sub-category slug. */
export function filterProducts(products: Product[], main: MainTab, subSlug: string | null): Product[] {
  return products.filter((p) => {
    if (main !== "All" && p.audience !== AUDIENCE_OF[main]) return false;
    if (subSlug && p.categorySlug !== subSlug) return false;
    return true;
  });
}

/** Section heading for the grid given the current filter. */
export function sectionTitle(main: MainTab, subLabel: string | null): string {
  if (subLabel) return subLabel;
  if (main === "Ladies") return "Ladies collection";
  if (main === "Gents") return "Gents fabric";
  return "The collection";
}
