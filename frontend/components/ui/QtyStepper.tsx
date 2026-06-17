"use client";

import { cn } from "@/lib/cn";

type QtyStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** Upper bound (e.g. pieces in stock). The + button stops here. */
  max?: number;
  label?: string;
  className?: string;
};

/** Reusable −/＋ quantity control. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  label = "quantity",
  className
}: QtyStepperProps) {
  const atMax = value >= max;
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-line bg-surface",
        className
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center text-primary"
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-bold text-heading">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={atMax}
        className="grid h-8 w-8 place-items-center text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
