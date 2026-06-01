import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages Project-Site liegt unter /<repo>/ – daher der Base-Path.
// Einheitlich (dev/build/preview), damit Asset-/Bildpfade überall identisch sind.
export default defineConfig({
  base: "/Kundenportal/",
  plugins: [react()],
});
