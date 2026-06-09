import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      quoteStyle: "double",
      semicolons: true,
      autoCodeSplitting: true,
    }),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    port: 8081,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          router: ["@tanstack/react-router", "@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
          ui: ["lucide-react", "sonner", "zod"],
        },
      },
    },
  },
});
