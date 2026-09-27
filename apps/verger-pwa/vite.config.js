import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let offlineAssets = [];
export default defineConfig({
  plugins: [wasm(), {
    name: "offline-build-assets",
    generateBundle(_options, bundle) {
      offlineAssets = Object.keys(bundle).filter((name) => /\.(js|css|wasm)$/.test(name)).map((name) => `./${name}`);
    },
    closeBundle() {
      const path = join("dist", "sw.js");
      const source = readFileSync(path, "utf8");
      writeFileSync(path, source.replace("[/* BUILD_ASSETS */]", JSON.stringify(offlineAssets)));
    },
  }],
  base: "./",
  server: {
    proxy: {
      "/api": "http://localhost:3030",
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
