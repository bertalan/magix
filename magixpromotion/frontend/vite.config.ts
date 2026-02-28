/// <reference types="vitest" />
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // In Docker, il backend Django è raggiungibile via nome servizio "django"
  const apiTarget = env.VITE_API_URL || "http://localhost:8000";
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/media": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/admin": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false, // no sourcemaps in production (saves 1.4 MB)
      cssCodeSplit: false, // single CSS file (already small at ~7 KB gzip)
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk — cached independently from app code
            vendor: ["react", "react-dom", "scheduler"],
            // i18n chunk — translations change rarely
            i18n: ["i18next", "react-i18next"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/__tests__/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      css: false,
    },
  };
});
