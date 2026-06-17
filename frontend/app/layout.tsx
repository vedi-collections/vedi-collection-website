import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Karla } from "next/font/google";

import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// Fonts loaded via next/font (self-hosted, no render-blocking @import) and
// exposed as CSS variables consumed by tailwind.config.ts fontFamily tokens.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap"
});

const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-karla",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Vedi Collections",
    template: "%s · Vedi Collections"
  },
  description: "WhatsApp-first Jaipur boutique — handpicked suits and gents fabric."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${karla.variable}`}>
      <body>
        {/* Client providers wrap server-rendered children: only the provider
            boundary is client; pages below stay server components. */}
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
