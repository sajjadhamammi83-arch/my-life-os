import fs from 'node:fs';
import path from 'node:path';

const iconFiles = [
  'icon.svg',
  'apple-touch-icon.png',
  'icon-192x192.png',
  'icon-maskable-192x192.png',
  'icon-512x512.png',
  'icon-maskable-512x512.png',
];

const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const results = {};

for (const name of iconFiles) {
  const p = path.resolve('public/icons', name);
  if (!fs.existsSync(p)) {
    results[name] = { exists: false };
    continue;
  }
  const stat = fs.statSync(p);
  const buf = fs.readFileSync(p);
  const isPng = name.endsWith('.png');
  const validMagic = isPng ? buf.subarray(0, 8).equals(pngMagic) : buf.toString().includes('<svg');
  
  let width = null, height = null;
  if (isPng && validMagic && buf.length >= 24) {
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  }

  results[name] = {
    exists: true,
    size: stat.size,
    validMagic,
    width,
    height
  };
}

console.log(JSON.stringify(results, null, 2));
