import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const { build: BUILD_VERSION } = JSON.parse(readFileSync(join(root, "version.json"), "utf8"));

export default defineConfig({
  plugins: [viteSingleFile()],
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION)
  },
  build: {
    cssCodeSplit: false
  }
});
