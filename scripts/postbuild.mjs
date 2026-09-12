// vite-plugin-singlefile inlines everything into dist/index.html.
// Copy that single file to the repo root under the name GitHub Pages
// (and the README link) already expect, so the deploy URL never changes.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "dist/index.html"), "utf8");
writeFileSync(join(root, "addition-game.html"), html);
console.log("Built dist/index.html -> addition-game.html");
