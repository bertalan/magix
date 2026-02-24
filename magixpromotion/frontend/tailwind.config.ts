import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          bg: "var(--bg-color)",
          "bg-secondary": "var(--bg-secondary)",
          text: "var(--text-main)",
          muted: "var(--text-muted)",
          accent: "var(--accent)",
          "accent-secondary": "var(--accent-secondary)",
        },
      },
      boxShadow: {
        card: "var(--card-shadow)",
      },
      keyframes: {
        "image-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "image-fade-in 600ms ease-in-out forwards",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
