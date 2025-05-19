import { defineConfig } from "vite";
import path from "path";

console.log("outDir", path.join(path.resolve(), "server", "public"));

export default defineConfig({
  root: path.join(path.resolve(), "client"),
  envDir: ".",
  build: {
    outDir: path.join(path.resolve(), "server", "public"),
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
