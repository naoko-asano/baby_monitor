import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

const keyPath = path.resolve("server.key");
const certPath = path.resolve("server.crt");

const httpsOptions =
  fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    : undefined;

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
    https: httpsOptions,
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
