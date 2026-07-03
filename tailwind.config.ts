import type { Config } from "tailwindcss";

/* Trippa design tokens — values are final, ported from the reference kft.css */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#2563EB",
        "accent-3": "#6E9BFF",
        bg: "#FFFFFF",
        "bg-2": "#F7F9FC",
        surface: "#F7F9FC",
        "surface-2": "#EEF2F7",
        "surface-solid": "#FFFFFF",
        border: "#EEF2F7",
        "border-2": "#E2E8F0",
        ink: "#0B1220",
        "ink-2": "#5B6472",
        "ink-3": "#9AA3B2",
        green: "#16A34A",
        purple: "#7C5CFF",
        pink: "#DB2777",
        yellow: "#CA8A04",
      },
      borderRadius: {
        lg2: "28px",
        md2: "22px",
        sm2: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,18,32,.04),0 8px 24px -12px rgba(11,18,32,.10),0 24px 48px -24px rgba(11,18,32,.12)",
        "soft-sm": "0 1px 2px rgba(11,18,32,.04),0 6px 16px -10px rgba(11,18,32,.12)",
        "soft-lg": "0 2px 6px rgba(11,18,32,.05),0 18px 40px -16px rgba(11,18,32,.16),0 40px 80px -40px rgba(11,18,32,.18)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Inter'",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
