import fs from "fs";
import path from "path";
import sharp from "sharp";

// Brand Colors
const CRIMSON = "#7B1E2B";
const WARM_CREAM = "#F7F0E5";
const DARK_WINE = "#32171D";

// 64x64 master mark geometry from identity specifications:
// - Spine = 16 units, Open seam = 8 units
// - Path 1: M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z
// - Path 2: M 24 24 L 56 24 L 40 40 L 24 40 Z
const SYMBOL_PATH = "M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z";

// 1. Vector SVG Icon with Crimson background (Favicon spec: Cream on Crimson)
// In 16x16: 12px mark / 2px inset (inset = 12.5% of canvas)
// In 64x64 canvas: 48px mark (scale = 48/64 = 0.75), offset = 8px (0.125 * 64)
export function generateFaviconSvg(size = 64, rx = 8) {
  const markSize = size * 0.75;
  const inset = size * 0.125;
  const scale = markSize / 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${CRIMSON}"/>
  <g transform="translate(${inset}, ${inset}) scale(${scale})">
    <path d="${SYMBOL_PATH}" fill="${WARM_CREAM}" fill-rule="evenodd"/>
  </g>
</svg>`;
}

// 2. Pure Transparent Vector Symbol (64x64 source grid)
export function generateSymbolSvg(color = CRIMSON) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <path d="${SYMBOL_PATH}" fill="${color}" fill-rule="evenodd"/>
</svg>`;
}

// 3. Primary Horizontal Lockup SVG (as per 05 / Brand specifications):
// Mark height = h (64). Wordmark font size = 1.16h (74.24), tracking = 0.035h (2.24), gap = 0.5h (32).
// Symbol at (0, 0), wordmark at x = 64 + 32 = 96.
export function generateHorizontalLockupSvg() {
  const h = 64;
  const gap = 32;
  const fontSize = 74.24;
  const tracking = 2.24;
  const width = 460;
  const height = 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Standalone Symbol -->
  <g transform="translate(0, 0)">
    <path d="${SYMBOL_PATH}" fill="${CRIMSON}" fill-rule="evenodd"/>
  </g>
  <!-- Wordmark in Inter Extra Bold 800 -->
  <text x="${h + gap}" y="56" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="${tracking}" fill="${DARK_WINE}">FLIPPED</text>
</svg>`;
}

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");

  console.log("Generating brand vector assets...");

  // Save public/favicon.svg (Cream on Crimson)
  const faviconSvg = generateFaviconSvg(64, 8);
  fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg, "utf8");

  // Save public/logo-symbol.svg (Standalone symbol Crimson)
  const symbolSvg = generateSymbolSvg(CRIMSON);
  fs.writeFileSync(path.join(publicDir, "logo-symbol.svg"), symbolSvg, "utf8");

  // Save public/logo-symbol-cream.svg (Standalone symbol Cream)
  const symbolCreamSvg = generateSymbolSvg(WARM_CREAM);
  fs.writeFileSync(path.join(publicDir, "logo-symbol-cream.svg"), symbolCreamSvg, "utf8");

  // Save public/logo.svg (Horizontal Lockup)
  const lockupSvg = generateHorizontalLockupSvg();
  fs.writeFileSync(path.join(publicDir, "logo.svg"), lockupSvg, "utf8");

  console.log("Rasterizing favicons and app icons with sharp...");

  // Generate PNG favicons
  const sizes = [
    { name: "favicon-16x16.png", size: 16, rx: 2 },
    { name: "favicon-32x32.png", size: 32, rx: 4 },
    { name: "favicon-48x48.png", size: 48, rx: 6 },
    { name: "apple-touch-icon.png", size: 180, rx: 32 },
    { name: "icon-192.png", size: 192, rx: 36 },
    { name: "icon-512.png", size: 512, rx: 96 },
  ];

  const pngBuffers = {};

  for (const item of sizes) {
    const svgContent = generateFaviconSvg(item.size, item.rx);
    const buffer = await sharp(Buffer.from(svgContent))
      .resize(item.size, item.size)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, item.name), buffer);
    pngBuffers[item.size] = buffer;
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Create multi-size favicon.ico
  // A standard ICO file can wrap PNG images for 16, 32, 48
  // Simple ICO builder for PNGs:
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count of images

  let offset = 6 + count * 16;
  const entries = [];
  const imageBuffers = [];

  for (const s of icoSizes) {
    const buf = pngBuffers[s];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    imageBuffers.push(buf);
    offset += buf.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageBuffers]);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
  console.log("Generated favicon.ico with 16, 32, 48 sizes!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
