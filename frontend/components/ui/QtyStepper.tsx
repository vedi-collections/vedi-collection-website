"use client";

import { cn } from "@/lib/cn";

type QtyStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  label?: string;
  className?: string;
};

/** Reusable −/＋ quantity control. */
export function QtyStepper({ value, onChange, min = 1, label = "quantity", className }: QtyStepperProps) {
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
        onClick={() => onChange(value + 1)}
        className="grid h-8 w-8 place-items-center text-primary"
      >
        +
      </button>
    </div>
  );
}
