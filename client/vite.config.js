import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative Pfade, damit die gebaute Seite auch in einem Unterordner
  // (z.B. https://<user>.github.io/<repo>/) korrekt funktioniert.
  base: "./",
  server: {
    host: true, // im Entwicklungsmodus auch aus dem lokalen Netzwerk erreichbar
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    outDir: "../server/public",
    emptyOutDir: true,
  },
});
