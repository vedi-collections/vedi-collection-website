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

const AUDIENCE_OF: Record<Exclude<MainTab, "All">, Audience> = {
  Ladies: "ladies",
  Gents: "gents"
};

/** Sub-category chips for a tab, derived from the live products' sub-categories
 *  (so the storefront always matches what the admin created). Empty for the
 *  "All" tab. */
export function subsFor(products: Product[], main: MainTab): SubDef[] {
  if (main === "All") return [];
  const audience = AUDIENCE_OF[main];
  const bySlug = new Map<string, string>(); // slug -> first-seen label
  for (const p of products) {
    if (p.audience !== audience) continue;
    if (!p.categorySlug || p.categorySlug === "all") continue; // no real sub-category
    if (!bySlug.has(p.categorySlug)) bySlug.set(p.categorySlug, p.category);
  }
  return [...bySlug]
    .map(([slug, label]) => ({ label, slug }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Filter products by the active main tab + sub-category slug. The "All" tab
 *  shows every product. */
export function filterProducts(products: Product[], main: MainTab, subSlug: string | null): Product[] {
  return products.filter((p) => {
    if (main !== "All" && p.audience !== AUDIENCE_OF[main]) return false;
    if (subSlug && p.categorySlug !== subSlug) return false;
    return true;
  });
}

export type ShopLink = { label: string; main: MainTab; sub?: string };

/** Footer "Shop" links, derived from the live catalog so they match the nav and
 *  the admin sub-categories. One link per (tab, sub-category) that exists, plus
 *  an "All Products" catch-all. */
export function shopLinksFor(products: Product[]): ShopLink[] {
  const links: ShopLink[] = [];
  for (const main of ["Ladies", "Gents"] as const) {
    for (const s of subsFor(products, main)) {
      links.push({ label: `${main} ${s.label}`, main, sub: s.label });
    }
  }
  links.push({ label: "All Products", main: "All" });
  return links;
}

/** Section heading for the grid given the current filter. */
export function sectionTitle(main: MainTab, subLabel: string | null): string {
  if (subLabel) return subLabel;
  if (main === "Ladies") return "Ladies collection";
  if (main === "Gents") return "Gents fabric";
  return "The collection";
}
