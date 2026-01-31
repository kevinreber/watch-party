import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      "convex/_generated": path.resolve(__dirname, "./convex/_generated"),
    },
  },
  server: {
    port: 3000,
  },
});
