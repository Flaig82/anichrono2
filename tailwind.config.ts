import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── shadcn semantic colors (mapped to AURA tokens via CSS vars) ── */
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        /* ── AURA-specific colors ── */
        aura: {
          bg: "var(--aura-bg)",
          bg2: "var(--aura-bg2)",
          bg3: "var(--aura-bg3)",
          bg4: "var(--aura-bg4)",
          border: "var(--aura-border)",
          border2: "var(--aura-border2)",
          text: "var(--aura-text)",
          muted: "var(--aura-muted)",
          muted2: "var(--aura-muted2)",
          orange: "var(--aura-orange)",
          "orange-l": "var(--aura-orange-l)",
        },

        /* ── Six Aura types ── */
        pioneer: "var(--aura-pioneer)",
        scholar: "var(--aura-scholar)",
        oracle: "var(--aura-oracle)",
        sensei: "var(--aura-sensei)",
        veteran: "var(--aura-veteran)",
        archivist: "var(--aura-archivist)",

        /* ── Entry type colors ── */
        entry: {
          episodes: "var(--entry-episodes)",
          movie: "var(--entry-movie)",
          ova: "var(--entry-ova)",
          ona: "var(--entry-ona)",
          manga: "var(--entry-manga)",
          special: "var(--entry-special)",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
