"use client";

// Client cart state + persistence. Mounted once in the root layout above the
// server-rendered pages. Lines persist to localStorage (price frozen at add
// time); the drawer open/close state also lives here so the header button and
// the drawer share it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import type { CartLine, Product } from "@/lib/shop/types";

const STORAGE_KEY = "vedi.cart";

/** Identity of a cart line = product + selected size. */
export function lineKey(productId: string, size?: string): string {
  return size ? `${productId}::${size}` : productId;
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalMinor: number;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (product: Product, opts?: { size?: string; qty?: number }) => void;
  changeQty: (key: string, delta: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate from localStorage on mount (guarded for SSR). Reading a persisted
  // external store on first mount legitimately requires setState in the effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist after hydration so we never clobber stored data with the empty init.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((product: Product, opts?: { size?: string; qty?: number }) => {
    const size = opts?.size;
    const qty = opts?.qty ?? 1;
    const stock = product.stock ?? Infinity;
    if (stock <= 0) return; // out of stock — nothing to add
    const key = lineKey(product.id, size);
    setLines((current) => {
      const existing = current.find((l) => lineKey(l.product.id, l.size) === key);
      if (existing) {
        // Never let the ordered quantity exceed what is in stock.
        return current.map((l) =>
          lineKey(l.product.id, l.size) === key
            ? { ...l, qty: Math.min(l.qty + qty, stock) }
            : l
        );
      }
      return [...current, { product, qty: Math.min(qty, stock), size }];
    });
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    setLines((current) =>
      current
        .map((l) =>
          lineKey(l.product.id, l.size) === key
            ? { ...l, qty: Math.min(l.qty + delta, l.product.stock ?? Infinity) }
            : l
        )
        .filter((l) => l.qty > 0)
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((current) => current.filter((l) => lineKey(l.product.id, l.size) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotalMinor = lines.reduce((sum, l) => sum + l.qty * l.product.priceMinor, 0);
    return {
      lines,
      count,
      subtotalMinor,
      hydrated,
      isOpen,
      openCart,
      closeCart,
      add,
      changeQty,
      remove,
      clear
    };
  }, [lines, hydrated, isOpen, openCart, closeCart, add, changeQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
