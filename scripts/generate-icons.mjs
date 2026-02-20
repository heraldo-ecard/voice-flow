/**
 * Generates tray icon PNGs (32x32) from the SVG variants.
 * Run with: node scripts/generate-icons.mjs
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "src-tauri", "icons");

const variants = [
  { input: "tray-idle.svg",       output: "tray-idle.png"       },
  { input: "tray-recording.svg",  output: "tray-recording.png"  },
  { input: "tray-processing.svg", output: "tray-processing.png" },
];

for (const { input, output } of variants) {
  const svgPath = join(iconsDir, input);
  const pngPath = join(iconsDir, output);

  const svg = readFileSync(svgPath, "utf-8");
  const resvg = new Resvg(svg, { fitTo: { mode: "original" } });
  const png = resvg.render().asPng();
  writeFileSync(pngPath, png);

  console.log(`✓ ${output} (${resvg.width}x${resvg.height})`);
}

console.log("\nDone. Tray icon PNGs generated in src-tauri/icons/");
