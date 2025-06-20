import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  root: path.join(path.resolve(), "client"),
  envDir: ".",
  resolve: {
    alias: {
      "@": path.join(path.resolve(), "client", "src"),
    },
  },
  server: {
    host: true,
    https: {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.crt"),
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
