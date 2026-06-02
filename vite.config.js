import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages Project-Site liegt unter /<repo>/ – daher der Base-Path.
// Einheitlich (dev/build/preview), damit Asset-/Bildpfade überall identisch sind.
export default defineConfig({
  base: "/Kundenportal/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Auftragsportal",
        short_name: "Auftragsportal",
        description: "Kunden-Auftrags- und Kalibrierportal",
        lang: "de",
        display: "standalone",
        theme_color: "#B5460F",
        background_color: "#F4EFE6",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,pdf,woff,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
