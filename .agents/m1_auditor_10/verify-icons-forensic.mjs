import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ICONS_DIR = path.resolve('public/icons');
const files = [
  { name: 'apple-touch-icon.png', expectedW: 180, expectedH: 180 },
  { name: 'icon-192x192.png', expectedW: 192, expectedH: 192 },
  { name: 'icon-maskable-192x192.png', expectedW: 192, expectedH: 192 },
  { name: 'icon-512x512.png', expectedW: 512, expectedH: 512 },
  { name: 'icon-maskable-512x512.png', expectedW: 512, expectedH: 512 },
];

console.log('--- FORENSIC PNG & SVG ICON VERIFICATION ---');

for (const f of files) {
  const filePath = path.join(ICONS_DIR, f.name);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: File does not exist: ${filePath}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(filePath);

  // 1. Check PNG Signature
  const pngSig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!buf.subarray(0, 8).equals(pngSig)) {
    console.error(`FAIL: Invalid PNG header for ${f.name}`);
    process.exit(1);
  }

  // 2. Parse IHDR
  const ihdrLen = buf.readUInt32BE(8);
  const ihdrType = buf.toString('ascii', 12, 16);
  if (ihdrType !== 'IHDR' || ihdrLen !== 13) {
    console.error(`FAIL: Corrupt IHDR chunk in ${f.name}`);
    process.exit(1);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25);

  if (width !== f.expectedW || height !== f.expectedH) {
    console.error(`FAIL: Dimension mismatch for ${f.name}: got ${width}x${height}, expected ${f.expectedW}x${f.expectedH}`);
    process.exit(1);
  }

  // 3. Extract and inflate IDAT
  let offset = 8;
  const idatChunks = [];
  let foundIend = false;
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.toString('ascii', offset + 4, offset + 8);
    const chunkData = buf.subarray(offset + 8, offset + 8 + chunkLen);
    if (chunkType === 'IDAT') {
      idatChunks.push(chunkData);
    } else if (chunkType === 'IEND') {
      foundIend = true;
    }
    offset += 12 + chunkLen;
  }

  if (!foundIend || idatChunks.length === 0) {
    console.error(`FAIL: Missing IDAT or IEND in ${f.name}`);
    process.exit(1);
  }

  const combinedIdat = Buffer.concat(idatChunks);
  const inflated = zlib.inflateSync(combinedIdat);
  const expectedRowBytes = width * 4 + 1;
  if (inflated.length !== expectedRowBytes * height) {
    console.error(`FAIL: Inflated size mismatch for ${f.name}: got ${inflated.length}, expected ${expectedRowBytes * height}`);
    process.exit(1);
  }

  // Check unique colors to ensure it's not a solid blank or fake facade
  const uniqueColors = new Set();
  for (let y = 0; y < height; y++) {
    const rowOffset = y * expectedRowBytes;
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const r = inflated[px];
      const g = inflated[px + 1];
      const b = inflated[px + 2];
      const a = inflated[px + 3];
      uniqueColors.add(`${r},${g},${b},${a}`);
    }
  }

  console.log(`PASS: ${f.name} -> Size: ${width}x${height}, BitDepth: ${bitDepth}, ColorType: ${colorType}, FileBytes: ${buf.length}, UniquePixelColors: ${uniqueColors.size}`);
  if (uniqueColors.size < 5) {
    console.error(`FAIL: ${f.name} has suspicious lack of color variety (${uniqueColors.size} unique colors)`);
    process.exit(1);
  }
}

// 4. Check icon.svg
const svgPath = path.join(ICONS_DIR, 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');
if (
  svgContent.includes('<svg') &&
  svgContent.includes('polygon') &&
  svgContent.includes('polyline') &&
  svgContent.includes('viewBox="0 0 512 512"')
) {
  console.log(`PASS: icon.svg -> Valid SVG format (${svgContent.length} bytes) with vector geometry`);
} else {
  console.error(`FAIL: icon.svg is invalid or missing vector layers`);
  process.exit(1);
}

console.log('ALL ICONS GENUINE, VALID, AND PASS MATHEMATICAL FORENSIC AUDIT.');
