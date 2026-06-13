import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Centered max-width wrapper with responsive page padding. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-shell px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
