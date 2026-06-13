import Link from "next/link";

import { cn } from "@/lib/cn";

type BrandProps = {
  /** "light" inverts colours for dark backgrounds (footer). */
  tone?: "default" | "light";
  align?: "start" | "center";
  href?: string;
  className?: string;
};

/** The Vedi Collections wordmark, reused across header, footer and auth pages. */
export function Brand({ tone = "default", align = "start", href = "/", className }: BrandProps) {
  const content = (
    <span className={cn("flex flex-col leading-none", align === "center" ? "items-center" : "items-start")}>
      <span className={cn("font-serif text-2xl font-bold", tone === "light" ? "text-primary-fg" : "text-primary")}>
        Vedi
      </span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.34em] text-accent">Collections</span>
    </span>
  );

  return (
    <Link href={href} aria-label="Vedi Collections home" className={className}>
      {content}
    </Link>
  );
}
