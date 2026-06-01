import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages Project-Site liegt unter /<repo>/ – daher der Base-Path.
// Lokal (dev/preview) wird "/" verwendet.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Kundenportal/" : "/",
  plugins: [react()],
}));
