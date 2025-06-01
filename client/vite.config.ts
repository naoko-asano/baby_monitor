import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.join(path.resolve(), "client"),
  envDir: ".",
  resolve: {
    alias: {
      "@": path.join(path.resolve(), "client", "src"),
    },
  },
  build: {
    outDir: path.join(path.resolve(), "dist", "client"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.join(path.resolve(), "client", "index.html"),
        broadcaster: path.join(
          path.resolve(),
          "client",
          "broadcaster",
          "index.html",
        ),
      },
    },
  },
});
