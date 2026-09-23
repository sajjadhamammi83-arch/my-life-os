import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Distance from point (px, py) to rounded rectangle centered at (cx, cy)
function distToRoundedRect(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const qx = Math.max(0, dx);
  const qy = Math.max(0, dy);
  const outsideDist = Math.hypot(qx, qy);
  const insideDist = Math.min(0, Math.max(dx, dy));
  return outsideDist + insideDist - radius;
}

// Clamp helper
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Alpha blend source (r1, g1, b1, a1) over destination (r0, g0, b0, a0)
function blendOver(r0, g0, b0, a0, r1, g1, b1, a1) {
  const outA = a1 + a0 * (1 - a1);
  if (outA === 0) return [0, 0, 0, 0];
  const outR = (r1 * a1 + r0 * a0 * (1 - a1)) / outA;
  const outG = (g1 * a1 + g0 * a0 * (1 - a1)) / outA;
  const outB = (b1 * a1 + b0 * a0 * (1 - a1)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), Math.round(outA * 255)];
}

// Pure Node.js PNG encoder using zlib
function encodePng(width, height, getPixelFn) {
  const rowBytes = width * 4 + 1; // 1 filter byte + RGBA pixels
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelFn(x, y);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  // CRC-32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Master icon renderer matching Life OS brand (Layers emblem on black squircle)
function renderLifeOsPixel(x, y, size, isMaskable = false, isAppleTouch = false) {
  const cx = size / 2;
  const cy = size / 2;

  // Maskable icons use tighter content margin to avoid clipping on Android circular masks
  const badgeScale = isMaskable ? 0.62 : (isAppleTouch ? 0.78 : 0.76);
  const badgeSize = size * badgeScale;
  const halfBadge = badgeSize / 2;
  const cornerRadius = badgeSize * 0.225; // standard smooth squircle curvature

  // Base background:
  // Apple Touch Icon: standard iOS renders black on transparency, so base is solid #ffffff
  const bgR = 255, bgG = 255, bgB = 255, bgA = 1.0;

  // 1. Evaluate Badge Distance
  const badgeDist = distToRoundedRect(x + 0.5, y + 0.5, cx, cy, halfBadge, halfBadge, cornerRadius);
  const badgeAlpha = clamp(0.5 - badgeDist, 0, 1);

  // Black badge color: #09090b
  let [r, g, b, a] = blendOver(bgR, bgG, bgB, bgA, 9, 9, 11, badgeAlpha);

  // 2. Evaluate Layers Motif inside badge
  if (badgeAlpha > 0.05) {
    // Lucide Layers coordinate system is 24x24
    // We place the emblem inside the badge with standard padding
    const iconScale = (badgeSize * 0.55) / 24;
    const strokeWidth = Math.max(1.8, 2.0 * iconScale);
    const halfStroke = strokeWidth / 2;

    // Transform from pixel coords to 24x24 local coords
    const localX = (x + 0.5 - (cx - 12 * iconScale)) / iconScale;
    const localY = (y + 0.5 - (cy - 12 * iconScale)) / iconScale;

    // Lucide Layers 8 segments in 24x24 box:
    // Top diamond (polygon 12 2, 22 7, 12 12, 2 7):
    // Segments:
    // (12, 2) -> (22, 7)
    // (22, 7) -> (12, 12)
    // (12, 12) -> (2, 7)
    // (2, 7) -> (12, 2)
    // Middle chevron (polyline 2 12, 12 17, 22 12):
    // (2, 12) -> (12, 17)
    // (12, 17) -> (22, 12)
    // Bottom chevron (polyline 2 17, 12 22, 22 17):
    // (2, 17) -> (12, 22)
    // (12, 22) -> (22, 17)

    const segments = [
      [12, 2, 22, 7],
      [22, 7, 12, 12],
      [12, 12, 2, 7],
      [2, 7, 12, 2],
      [2, 12, 12, 17],
      [12, 17, 22, 12],
      [2, 17, 12, 22],
      [12, 22, 22, 17],
    ];

    let minDist = Infinity;
    for (const [x1, y1, x2, y2] of segments) {
      // Calculate distance in pixel space
      const segDist = distToSegment(
        x + 0.5,
        y + 0.5,
        cx + (x1 - 12) * iconScale,
        cy + (y1 - 12) * iconScale,
        cx + (x2 - 12) * iconScale,
        cy + (y2 - 12) * iconScale
      );
      if (segDist < minDist) {
        minDist = segDist;
      }
    }

    const strokeAlpha = clamp((halfStroke + 0.5 - minDist), 0, 1) * badgeAlpha;
    if (strokeAlpha > 0) {
      [r, g, b, a] = blendOver(r, g, b, a / 255, 255, 255, 255, strokeAlpha);
    }
  }

  return [r, g, b, a];
}

// Master SVG representation
function generateMasterSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ffffff" />
  <rect x="64" y="64" width="384" height="384" rx="86" fill="#09090b" />
  <g transform="translate(136, 136) scale(10)" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </g>
</svg>
`;
}

// Run generator
async function main() {
  const iconsDir = path.resolve('public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`Created directory: ${iconsDir}`);
  }

  // 1. Write Vector Master SVG
  const svgPath = path.join(iconsDir, 'icon.svg');
  fs.writeFileSync(svgPath, generateMasterSvg(), 'utf-8');
  console.log(`Generated SVG: ${svgPath}`);

  // 2. Targets to render
  const targets = [
    { name: 'apple-touch-icon.png', size: 180, maskable: false, isAppleTouch: true },
    { name: 'icon-192x192.png', size: 192, maskable: false, isAppleTouch: false },
    { name: 'icon-maskable-192x192.png', size: 192, maskable: true, isAppleTouch: false },
    { name: 'icon-512x512.png', size: 512, maskable: false, isAppleTouch: false },
    { name: 'icon-maskable-512x512.png', size: 512, maskable: true, isAppleTouch: false },
  ];

  for (const t of targets) {
    const filePath = path.join(iconsDir, t.name);
    console.log(`Rendering ${t.name} (${t.size}x${t.size})...`);
    const pngBuffer = encodePng(t.size, t.size, (x, y) =>
      renderLifeOsPixel(x, y, t.size, t.maskable, t.isAppleTouch)
    );
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`Saved: ${filePath} (${pngBuffer.length} bytes)`);
  }

  console.log('All PWA and iOS icon assets generated successfully!');
}

main().catch((err) => {
  console.error('Error generating PWA icons:', err);
  process.exit(1);
});
