import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Vite resolves workspace CJS named exports poorly; use SDK source in-monorepo.
      "@amkp/sdk-js": path.resolve(root, "../../packages/sdk-js/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
