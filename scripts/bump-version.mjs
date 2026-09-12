// Increments the build counter in version.json. Run once per production
// build (not on `npm run dev`) so the number shown in-game only changes
// when a new build is actually shipped.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const versionFile = join(root, "version.json");

const data = JSON.parse(readFileSync(versionFile, "utf8"));
data.build += 1;
writeFileSync(versionFile, JSON.stringify(data, null, 2) + "\n");

console.log(`Build version bumped to ${data.build}`);
