import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem", lg: "2.5rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        // Adam Chellvan brand: classic luxury navy, gold and white
        navy: {
          950: "#0A1628",
          900: "#0F1F38",
          800: "#162A4A",
          700: "#1F3A63",
          600: "#2C4B7A",
        },
        // "ivory" tokens are kept as names but tuned close to white per the brand brief
        ivory: {
          50: "#FBFAF7",
          100: "#F5F2EB",
          200: "#EAE5DA",
          300: "#DAD2C1",
        },
        charcoal: {
          900: "#1E2126",
          700: "#3A3F47",
          500: "#5D636D",
          400: "#7A808A",
        },
        // Gold
        champagne: {
          300: "#E2C77E",
          400: "#C9A24A",
          500: "#B08A2E",
          // Text-safe gold on white (6.2:1)
          700: "#7A5C14",
        },
        success: "#2F6B4F",
        danger: "#9B2C2C",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5.5vw, 5rem)", { lineHeight: "1.04", letterSpacing: "-0.015em" }],
        "display-lg": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(1.75rem, 2.8vw, 2.5rem)", { lineHeight: "1.15" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,22,38,0.04), 0 8px 24px -12px rgba(12,22,38,0.12)",
        lift: "0 2px 4px rgba(12,22,38,0.05), 0 18px 40px -18px rgba(12,22,38,0.25)",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        rise: "rise 700ms cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
