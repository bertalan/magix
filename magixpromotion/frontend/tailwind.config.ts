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
    },
  },
  plugins: [],
} satisfies Config;
