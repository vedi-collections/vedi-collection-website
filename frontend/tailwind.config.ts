import type { Config } from "tailwindcss";

// Colors are indirected through CSS variables (see app/globals.css), stored as
// space-separated RGB channels and wrapped with the <alpha-value> placeholder so
// Tailwind opacity modifiers work (e.g. bg-surface/95, text-primary-fg/75).
// Components only ever reference these semantic tokens (bg-primary, text-muted…)
// — never a raw hex — so the whole palette re-skins by editing globals.css alone.
const c = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("--color-bg"),
        framebg: c("--color-framebg"),
        info: c("--color-info"),
        surface: {
          DEFAULT: c("--color-surface"),
          alt: c("--color-surface-alt")
        },
        line: c("--color-border"),
        primary: {
          DEFAULT: c("--color-primary"),
          hover: c("--color-primary-hover"),
          dark: c("--color-primary-dark"),
          fg: c("--color-primary-fg")
        },
        accent: {
          DEFAULT: c("--color-accent"),
          light: c("--color-accent-light"),
          pale: c("--color-accent-pale")
        },
        heading: c("--color-heading"),
        ink: c("--color-text"),
        muted: {
          DEFAULT: c("--color-muted"),
          soft: c("--color-muted-soft"),
          strike: c("--color-muted-strike")
        },
        whatsapp: {
          DEFAULT: c("--color-whatsapp"),
          dark: c("--color-whatsapp-dark"),
          fg: c("--color-whatsapp-fg")
        },
        badge: {
          DEFAULT: c("--color-badge-bg"),
          fg: c("--color-badge-fg")
        }
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-karla)", "Arial", "sans-serif"]
      },
      maxWidth: {
        shell: "1280px"
      },
      keyframes: {
        up: {
          from: { transform: "translateY(28px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" }
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0.9" },
          to: { transform: "translateX(0)", opacity: "1" }
        }
      },
      animation: {
        up: "up 0.3s ease",
        fade: "fade 0.2s ease",
        "slide-in-right": "slide-in-right 0.25s ease"
      }
    }
  },
  plugins: []
};

export default config;
