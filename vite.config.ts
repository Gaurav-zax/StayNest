import { defineConfig } from "vite";
import { supabaseAuthServer } from "./server/auth-server";

export default defineConfig({
  server: {
    port: 19040,
    middleware: [
      supabaseAuthServer(),
    ] as never,
  },
  publicDir: "public",
  appType: "custom",
  plugins: [],
  optimizeDeps: {
    exclude: [],
  },
});
