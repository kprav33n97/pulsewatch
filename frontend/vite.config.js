import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api calls are forwarded to the backend on port 4000.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy: { "/api": process.env.API_URL || "http://localhost:4000" } },
});
