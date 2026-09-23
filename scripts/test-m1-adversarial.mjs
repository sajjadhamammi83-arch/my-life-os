/**
 * scripts/test-m1-adversarial.mjs
 * Comprehensive Adversarial Challenger Verification Suite for Milestone 1:
 * - W3C Web App Manifests schema & deep validation
 * - High-DPI Brand Icons & binary/vector integrity (PNG magic bytes, chunk layout, CRC32, zlib IDAT decompress, dimensions, colors, SVG schema)
 * - Service Worker syntax, lifecycle events (install, activate, fetch), 5 cache tiers, offline fallback simulation
 * - Precache asset accessibility on live server (port 3050)
 * - HTML Shell metadata, iOS Safari tags, and safe-area rules
 * - Port 3000 isolation verification
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ${ANSI.green}✓ PASS:${ANSI.reset} ${testName} ${detail ? ANSI.cyan + '(' + detail + ')' + ANSI.reset : ''}`);
  } else {
    failed++;
    failures.push({ testName, detail });
    console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} ${testName} -> ${ANSI.yellow}${detail}${ANSI.reset}`);
  }
}

// Global fetch wrapper with timeout
async function fetchWithTimeout(urlStr, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(urlStr, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: text,
      ok: res.ok,
      redirected: res.redirected,
      url: res.url,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      status: 'ERR',
      error: err.name === 'AbortError' ? 'TIMEOUT' : err.message,
      ok: false,
      body: '',
    };
  }
}

// CRC-32 helper for PNG chunk verification
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}
function calculateCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// =========================================================================
// TEST SUITE 1: Web App Manifests Deep Validation
// =========================================================================
async function testManifests() {
  console.log(`\n${ANSI.bold}=== SUITE 1: Manifest Schema & Specification Validation ===${ANSI.reset}`);

  const webmanifestPath = path.resolve('public/manifest.webmanifest');
  const jsonManifestPath = path.resolve('public/manifest.json');

  assert(fs.existsSync(webmanifestPath), 'manifest.webmanifest file exists on disk');
  assert(fs.existsSync(jsonManifestPath), 'manifest.json file exists on disk');

  let wm, jm;
  try {
    wm = JSON.parse(fs.readFileSync(webmanifestPath, 'utf-8'));
    assert(true, 'manifest.webmanifest is valid JSON');
  } catch (e) {
    assert(false, 'manifest.webmanifest is valid JSON', e.message);
  }

  try {
    jm = JSON.parse(fs.readFileSync(jsonManifestPath, 'utf-8'));
    assert(true, 'manifest.json is valid JSON');
  } catch (e) {
    assert(false, 'manifest.json is valid JSON', e.message);
  }

  if (!wm || !jm) return;

  // Schema properties
  assert(typeof wm.name === 'string' && wm.name.length > 0, 'Manifest name is non-empty string', wm.name);
  assert(typeof wm.short_name === 'string' && wm.short_name.length > 0, 'Manifest short_name is non-empty string', wm.short_name);
  assert(wm.start_url === '/today?source=pwa', 'Manifest start_url is /today?source=pwa', wm.start_url);
  assert(wm.display === 'standalone', 'Manifest display is standalone', wm.display);
  assert(Array.isArray(wm.display_override) && wm.display_override.includes('standalone'), 'display_override includes standalone');
  assert(wm.orientation === 'portrait', 'Manifest orientation is portrait', wm.orientation);
  assert(wm.theme_color?.toLowerCase() === '#ffffff', 'Manifest theme_color is #ffffff', wm.theme_color);
  assert(wm.background_color?.toLowerCase() === '#ffffff', 'Manifest background_color is #ffffff', wm.background_color);
  assert(wm.dir === 'rtl', 'Manifest dir is rtl', wm.dir);
  assert(wm.lang === 'fa-IR', 'Manifest lang is fa-IR', wm.lang);

  // Icons array in manifest
  assert(Array.isArray(wm.icons) && wm.icons.length >= 4, 'Manifest icons array contains at least 4 icon definitions', `${wm.icons.length} icons`);
  const has192 = wm.icons.some((i) => i.sizes === '192x192' && i.src.includes('192'));
  const has512 = wm.icons.some((i) => i.sizes === '512x512' && i.src.includes('512'));
  const hasMaskable = wm.icons.some((i) => i.purpose?.includes('maskable'));
  const hasAppleTouch = wm.icons.some((i) => i.src.includes('apple-touch-icon'));
  const hasSvg = wm.icons.some((i) => i.type === 'image/svg+xml');

  assert(has192, 'Manifest includes 192x192 icon');
  assert(has512, 'Manifest includes 512x512 icon');
  assert(hasMaskable, 'Manifest includes maskable icon');
  assert(hasAppleTouch, 'Manifest includes apple-touch-icon');
  assert(hasSvg, 'Manifest includes vector SVG icon');

  // Verify all declared icon files actually exist
  for (const icon of wm.icons) {
    const cleanSrc = icon.src.replace(/^\//, '');
    const fullPath = path.resolve('public', cleanSrc);
    assert(fs.existsSync(fullPath), `Icon file declared in manifest exists: ${icon.src}`, fullPath);
  }

  // Shortcuts
  assert(Array.isArray(wm.shortcuts) && wm.shortcuts.length === 4, 'Manifest has 4 shortcuts', `${wm.shortcuts?.length} shortcuts`);
  const shortcutUrls = wm.shortcuts.map((s) => s.url);
  assert(shortcutUrls.some((u) => u.startsWith('/today')), 'Shortcuts include /today');
  assert(shortcutUrls.some((u) => u.startsWith('/dashboard')), 'Shortcuts include /dashboard');
  assert(shortcutUrls.some((u) => u.startsWith('/finance')), 'Shortcuts include /finance');
  assert(shortcutUrls.some((u) => u.startsWith('/tasks')), 'Shortcuts include /tasks');

  // Parity between manifest.webmanifest and manifest.json
  assert(JSON.stringify(wm) === JSON.stringify(jm), 'manifest.webmanifest and manifest.json have 100% identical configuration');

  // HTTP Endpoint checks on port 3050
  const resWm = await fetchWithTimeout('http://127.0.0.1:3050/manifest.webmanifest');
  assert(resWm.status === 200, 'HTTP GET /manifest.webmanifest returns 200 OK', `status: ${resWm.status}`);
  assert(
    resWm.headers['content-type']?.includes('application/manifest+json') || resWm.headers['content-type']?.includes('application/json'),
    'HTTP GET /manifest.webmanifest returns manifest/json content-type',
    resWm.headers['content-type']
  );

  const resJm = await fetchWithTimeout('http://127.0.0.1:3050/manifest.json');
  assert(resJm.status === 200, 'HTTP GET /manifest.json returns 200 OK', `status: ${resJm.status}`);
}

// =========================================================================
// TEST SUITE 2: High-DPI Brand Icons & Deep Binary Verification
// =========================================================================
async function testIconsBinaryIntegrity() {
  console.log(`\n${ANSI.bold}=== SUITE 2: High-DPI Icons & Binary/Vector Signatures ===${ANSI.reset}`);

  // 1. Vector Master SVG Check
  const svgPath = path.resolve('public/icons/icon.svg');
  assert(fs.existsSync(svgPath), 'icon.svg exists on disk');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  assert(svgContent.includes('<svg') && svgContent.includes('</svg>'), 'icon.svg contains valid root svg element');
  assert(svgContent.includes('xmlns="http://www.w3.org/2000/svg"'), 'icon.svg specifies xmlns');
  assert(svgContent.includes('viewBox="0 0 512 512"'), 'icon.svg specifies viewBox 0 0 512 512');
  assert(svgContent.includes('polygon') && svgContent.includes('polyline'), 'icon.svg contains Layers geometric polygons/polylines');

  // 2. PNG Binary Deep Inspection
  const pngFiles = [
    { name: 'apple-touch-icon.png', expectedW: 180, expectedH: 180, minSize: 1000 },
    { name: 'icon-192x192.png', expectedW: 192, expectedH: 192, minSize: 1000 },
    { name: 'icon-maskable-192x192.png', expectedW: 192, expectedH: 192, minSize: 1000 },
    { name: 'icon-512x512.png', expectedW: 512, expectedH: 512, minSize: 3000 },
    { name: 'icon-maskable-512x512.png', expectedW: 512, expectedH: 512, minSize: 3000 },
  ];

  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  for (const item of pngFiles) {
    const fullPath = path.resolve('public/icons', item.name);
    assert(fs.existsSync(fullPath), `${item.name} exists on disk`);
    const buf = fs.readFileSync(fullPath);

    assert(buf.length >= item.minSize, `${item.name} file size is valid (${buf.length} bytes >= ${item.minSize})`);

    // Verify 8-byte PNG signature
    const sig = buf.subarray(0, 8);
    assert(sig.equals(PNG_MAGIC), `${item.name} has valid 8-byte PNG magic header [89 50 4E 47 0D 0A 1A 0A]`);

    // Parse PNG chunks
    let offset = 8;
    const chunks = [];
    let idatBuffers = [];

    while (offset < buf.length) {
      if (offset + 8 > buf.length) {
        assert(false, `${item.name} chunk header out of bounds at offset ${offset}`);
        break;
      }
      const length = buf.readUInt32BE(offset);
      const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
      const data = buf.subarray(offset + 8, offset + 8 + length);
      const fileCrc = buf.readUInt32BE(offset + 8 + length);

      // Verify CRC32
      const computedCrc = calculateCrc32(buf.subarray(offset + 4, offset + 8 + length));
      assert(computedCrc === fileCrc, `${item.name} chunk ${type} CRC32 checksum is valid (computed=${computedCrc.toString(16)}, file=${fileCrc.toString(16)})`);

      chunks.push({ type, length, data });
      if (type === 'IDAT') {
        idatBuffers.push(data);
      }
      offset += 12 + length;
    }

    assert(chunks[0].type === 'IHDR', `${item.name} first chunk is IHDR`);
    assert(chunks[chunks.length - 1].type === 'IEND', `${item.name} last chunk is IEND`);

    // Validate IHDR
    const ihdr = chunks[0].data;
    const width = ihdr.readUInt32BE(0);
    const height = ihdr.readUInt32BE(4);
    const bitDepth = ihdr[8];
    const colorType = ihdr[9];
    const compression = ihdr[10];
    const filter = ihdr[11];
    const interlace = ihdr[12];

    assert(width === item.expectedW && height === item.expectedH, `${item.name} dimensions match expected (${width}x${height} === ${item.expectedW}x${item.expectedH})`);
    assert(bitDepth === 8, `${item.name} bit depth is 8-bit`);
    assert(colorType === 6, `${item.name} color type is 6 (RGBA with alpha channel)`);
    assert(compression === 0, `${item.name} compression is standard Deflate`);
    assert(filter === 0, `${item.name} filter method is standard`);
    assert(interlace === 0, `${item.name} interlace is 0 (non-interlaced)`);

    // Decompress IDAT payload with zlib to ensure PNG rasterizer produced valid Deflate stream
    const combinedIdat = Buffer.concat(idatBuffers);
    let decompressed;
    try {
      decompressed = zlib.inflateSync(combinedIdat);
      assert(true, `${item.name} IDAT deflated payload decompressed cleanly without zlib error`);
    } catch (e) {
      assert(false, `${item.name} IDAT deflated payload decompressed cleanly without zlib error`, e.message);
    }

    if (decompressed) {
      const expectedRawBytes = height * (1 + width * 4);
      assert(
        decompressed.length === expectedRawBytes,
        `${item.name} decompressed size matches scanline specification (${decompressed.length} === ${expectedRawBytes} bytes)`
      );

      // Verify pixel color composition:
      // Corner should be pure white background #ffffff (255, 255, 255, 255)
      const cornerR = decompressed[1];
      const cornerG = decompressed[2];
      const cornerB = decompressed[3];
      const cornerA = decompressed[4];
      assert(
        cornerR === 255 && cornerG === 255 && cornerB === 255 && cornerA === 255,
        `${item.name} corner pixel is solid white #ffffff (r=${cornerR}, g=${cornerG}, b=${cornerB}, a=${cornerA})`
      );

      // Count pixels to ensure black badge and white emblem are both present
      let whiteBg = 0;
      let blackBadge = 0;
      let whiteEmblem = 0;
      const stride = 1 + width * 4;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * stride + 1 + x * 4;
          const r = decompressed[idx];
          const g = decompressed[idx + 1];
          const b = decompressed[idx + 2];
          const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
          if (r > 240 && g > 240 && b > 240) {
            if (distFromCenter < width * 0.3) whiteEmblem++;
            else whiteBg++;
          } else if (r < 25 && g < 25 && b < 25) {
            blackBadge++;
          }
        }
      }

      assert(whiteBg > width * height * 0.25, `${item.name} contains white background pixels (${whiteBg})`);
      assert(blackBadge > width * height * 0.25, `${item.name} contains black badge pixels (${blackBadge})`);
      assert(whiteEmblem > width * height * 0.01, `${item.name} contains white Layers emblem pixels (${whiteEmblem})`);
    }

    // Check HTTP serving on port 3050
    const res = await fetchWithTimeout(`http://127.0.0.1:3050/icons/${item.name}`);
    assert(res.status === 200, `HTTP GET /icons/${item.name} returns 200 OK`, `status: ${res.status}`);
    assert(res.headers['content-type'] === 'image/png', `HTTP GET /icons/${item.name} has image/png header`, res.headers['content-type']);
  }
}

// =========================================================================
// TEST SUITE 3: Service Worker Syntax, Architecture & Execution Simulation
// =========================================================================
async function testServiceWorker() {
  console.log(`\n${ANSI.bold}=== SUITE 3: Service Worker Verification & Event Simulation ===${ANSI.reset}`);

  const swPath = path.resolve('public/sw.js');
  assert(fs.existsSync(swPath), 'public/sw.js exists on disk');
  const swCode = fs.readFileSync(swPath, 'utf-8');

  // 1. Code syntax check via VM
  try {
    new vm.Script(swCode, { filename: 'sw.js' });
    assert(true, 'public/sw.js parses with zero JavaScript syntax errors');
  } catch (err) {
    assert(false, 'public/sw.js parses with zero JavaScript syntax errors', err.message);
  }

  // 2. Structural Analysis
  assert(swCode.includes("addEventListener('install'"), 'sw.js handles install event');
  assert(swCode.includes("addEventListener('activate'"), 'sw.js handles activate event');
  assert(swCode.includes("addEventListener('fetch'"), 'sw.js handles fetch event');
  assert(swCode.includes('skipWaiting()'), 'sw.js calls skipWaiting() on install');
  assert(swCode.includes('clients.claim()'), 'sw.js calls clients.claim() on activate');
  assert(swCode.includes('/offline.html'), 'sw.js specifies /offline.html fallback');
  assert(swCode.includes("request.method !== 'GET'"), 'sw.js passes mutations directly through without caching');

  // 3. Precache Assets Live Endpoint Reachability Check
  console.log('\n  Checking reachability of all PRECACHE_ASSETS on http://127.0.0.1:3050 ...');
  // Extract PRECACHE_ASSETS array from code
  const match = swCode.match(/const PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  assert(!!match, 'Found PRECACHE_ASSETS declaration in sw.js');
  if (match) {
    const assetLines = match[1]
      .split('\n')
      .map((l) => l.trim().replace(/[',]/g, ''))
      .filter((l) => l.length > 0 && !l.startsWith('//'));

    assert(assetLines.length >= 10, 'PRECACHE_ASSETS contains comprehensive shell list', `${assetLines.length} items`);

    for (const assetUrl of assetLines) {
      // In browser fetch, default redirect mode is 'follow'
      const res = await fetchWithTimeout(`http://127.0.0.1:3050${assetUrl}`);
      assert(res.ok && res.status === 200, `Precache asset accessible via fetch: ${assetUrl}`, `status: ${res.status}${res.redirected ? ' (followed redirect to ' + res.url + ')' : ''}`);
    }
  }

  // 4. Behavioral Simulation: Mock ServiceWorkerGlobalScope & Execution
  console.log('\n  Simulating Service Worker event handling in mock ServiceWorkerGlobalScope ...');

  const listeners = {};
  const mockCaches = new Map();

  class MockCache {
    constructor(name) {
      this.name = name;
      this.store = new Map();
    }
    async put(req, res) {
      const key = typeof req === 'string' ? req : req.url;
      this.store.set(key, res);
    }
    async match(req) {
      const key = typeof req === 'string' ? req : req.url;
      return this.store.get(key) || null;
    }
  }

  const mockCachesApi = {
    open: async (name) => {
      if (!mockCaches.has(name)) {
        mockCaches.set(name, new MockCache(name));
      }
      return mockCaches.get(name);
    },
    keys: async () => Array.from(mockCaches.keys()),
    delete: async (name) => mockCaches.delete(name),
  };

  let skippedWaiting = false;
  let claimedClients = false;

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    self: {
      addEventListener: (evt, fn) => {
        listeners[evt] = fn;
      },
      skipWaiting: () => {
        skippedWaiting = true;
      },
      clients: {
        claim: async () => {
          claimedClients = true;
        },
      },
    },
    caches: mockCachesApi,
    fetch: async (req, opts) => {
      const url = typeof req === 'string' ? req : req.url;
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        clone: function () {
          return { ...this };
        },
      };
    },
    Headers: class Headers {
      constructor(init = {}) {
        this.map = new Map(Object.entries(init));
      }
      set(k, v) {
        this.map.set(k, v);
      }
      get(k) {
        return this.map.get(k);
      }
    },
    Response: class Response {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.headers = init.headers || {};
      }
    },
    URL: URL,
    Promise: Promise,
  };

  vm.createContext(sandbox);
  vm.runInContext(swCode, sandbox);

  assert(typeof listeners['install'] === 'function', 'SW install listener registered');
  assert(typeof listeners['activate'] === 'function', 'SW activate listener registered');
  assert(typeof listeners['fetch'] === 'function', 'SW fetch listener registered');

  // Test Install Event
  let installWaitPromise = null;
  const mockInstallEvent = {
    waitUntil: (p) => {
      installWaitPromise = p;
    },
  };
  listeners['install'](mockInstallEvent);
  assert(skippedWaiting, 'SW skipWaiting() was executed during install');
  assert(installWaitPromise !== null, 'SW event.waitUntil was passed a promise during install');
  await installWaitPromise;
  const staticCache = mockCaches.get('life-os-static-v1.0.0');
  assert(staticCache && staticCache.store.size > 0, `SW precached ${staticCache?.store.size} assets into static cache`);

  // Test Activate Event
  // Insert an obsolete cache to test cleanup
  mockCaches.set('life-os-old-v0.9.0', new MockCache('life-os-old-v0.9.0'));
  let activateWaitPromise = null;
  const mockActivateEvent = {
    waitUntil: (p) => {
      activateWaitPromise = p;
    },
  };
  listeners['activate'](mockActivateEvent);
  await activateWaitPromise;
  assert(!mockCaches.has('life-os-old-v0.9.0'), 'SW activate purged obsolete cache life-os-old-v0.9.0');
  assert(claimedClients, 'SW activate executed clients.claim()');

  // Test Fetch Event: Mutation Passthrough
  let respondedWithPromise = null;
  const mockFetchMutationEvent = {
    request: {
      url: 'http://127.0.0.1:3050/api/tasks',
      method: 'POST',
    },
    respondWith: (p) => {
      respondedWithPromise = p;
    },
  };
  respondedWithPromise = null;
  listeners['fetch'](mockFetchMutationEvent);
  assert(respondedWithPromise === null, 'SW fetch does NOT call respondWith for POST mutation (clean passthrough)');

  // Test Fetch Event: Navigation Offline Fallback
  // When offline, fetch fails and cached page is missing -> must fallback to /offline.html
  sandbox.fetch = async () => {
    throw new Error('Failed to fetch: Network Offline');
  };
  // Pre-seed offline.html in static cache
  const offlineHtmlRes = new sandbox.Response('<html>Offline Fallback</html>', { status: 200 });
  await staticCache.put('/offline.html', offlineHtmlRes);

  let navRespondPromise = null;
  const mockNavEvent = {
    request: {
      url: 'http://127.0.0.1:3050/today',
      method: 'GET',
      mode: 'navigate',
    },
    respondWith: (p) => {
      navRespondPromise = p;
    },
  };
  listeners['fetch'](mockNavEvent);
  assert(navRespondPromise !== null, 'SW fetch intercepted navigation request');
  const navResponse = await navRespondPromise;
  assert(navResponse === offlineHtmlRes, 'SW fetch returned /offline.html fallback when offline and page uncached');

  // Test Fetch Event: API Offline Fallback
  let apiRespondPromise = null;
  const mockApiEvent = {
    request: {
      url: 'http://127.0.0.1:3050/api/tasks',
      method: 'GET',
      mode: 'cors',
    },
    respondWith: (p) => {
      apiRespondPromise = p;
    },
  };
  listeners['fetch'](mockApiEvent);
  assert(apiRespondPromise !== null, 'SW fetch intercepted API GET request');
  const apiResponse = await apiRespondPromise;
  const apiBody = JSON.parse(apiResponse.body);
  assert(apiBody.offline === true, 'SW fetch returned offline JSON fallback with offline:true when API offline and uncached');

  // Test Fetch Event: Non-http scheme passthrough (e.g. chrome-extension://)
  let nonHttpResponded = false;
  listeners['fetch']({
    request: {
      url: 'chrome-extension://abcdefgh/script.js',
      method: 'GET',
    },
    respondWith: () => {
      nonHttpResponded = true;
    },
  });
  assert(!nonHttpResponded, 'SW fetch safely ignores non-http schemes like chrome-extension://');
}

// =========================================================================
// TEST SUITE 4: HTML Shell, Layout & iOS Native Meta Tags
// =========================================================================
async function testHtmlShellAndIosIntegration() {
  console.log(`\n${ANSI.bold}=== SUITE 4: HTML Shell & iOS Native Meta Tags ===${ANSI.reset}`);

  // Fetch rendered HTML of /today
  const res = await fetchWithTimeout('http://127.0.0.1:3050/today');
  assert(res.status === 200, 'HTTP GET /today returns status 200 OK');
  const html = res.body;

  // Check required meta tags
  assert(html.includes('<link rel="manifest" href="/manifest.webmanifest"'), 'HTML includes <link rel="manifest" href="/manifest.webmanifest">');
  assert(html.includes('rel="apple-touch-icon"'), 'HTML includes apple-touch-icon link tag');
  assert(html.includes('content="/icons/apple-touch-icon.png"') || html.includes('href="/icons/apple-touch-icon.png"'), 'apple-touch-icon points to /icons/apple-touch-icon.png');
  assert(html.includes('<meta name="apple-mobile-web-app-capable" content="yes"'), 'HTML includes apple-mobile-web-app-capable: yes');
  assert(html.includes('<meta name="apple-mobile-web-app-status-bar-style" content="default"'), 'HTML includes apple-mobile-web-app-status-bar-style: default');
  assert(html.includes('name="theme-color" content="#ffffff"'), 'HTML includes theme-color #ffffff');
  assert(html.includes('viewport-fit=cover'), 'HTML includes viewport-fit=cover');
  assert(html.includes('user-scalable=no'), 'HTML includes user-scalable=no');
  assert(html.includes('lang="fa"'), 'HTML includes lang="fa"');
  assert(html.includes('dir="rtl"'), 'HTML includes dir="rtl"');

  // Verify ServiceWorkerRegister component is present in source
  const regPath = path.resolve('src/components/pwa/ServiceWorkerRegister.tsx');
  assert(fs.existsSync(regPath), 'ServiceWorkerRegister.tsx exists');
  const regCode = fs.readFileSync(regPath, 'utf-8');
  assert(regCode.includes('"use client"'), 'ServiceWorkerRegister is client component ("use client")');
  assert(regCode.includes('navigator.serviceWorker.register'), 'ServiceWorkerRegister registers service worker');
  assert(regCode.includes('/sw.js'), 'ServiceWorkerRegister registers /sw.js');

  // Verify Safe Area CSS in globals.css and Header.tsx
  const cssPath = path.resolve('src/app/globals.css');
  const css = fs.readFileSync(cssPath, 'utf-8');
  assert(css.includes('safe-area-inset-top'), 'globals.css defines safe-area-inset-top');

  const headerPath = path.resolve('src/components/layout/Header.tsx');
  const headerCode = fs.readFileSync(headerPath, 'utf-8');
  assert(headerCode.includes('safe-area-inset-top'), 'Header.tsx respects safe-area-inset-top for iOS notch compatibility');

  // Verify Offline Fallback Shell (public/offline.html)
  const offlineHtmlPath = path.resolve('public/offline.html');
  assert(fs.existsSync(offlineHtmlPath), 'public/offline.html exists');
  const offlineHtml = fs.readFileSync(offlineHtmlPath, 'utf-8');
  assert(offlineHtml.includes('<!DOCTYPE html>'), 'offline.html is standard HTML5 document');
  assert(offlineHtml.includes('dir="rtl"'), 'offline.html is RTL');
  assert(!offlineHtml.includes('<script src="http'), 'offline.html has NO external remote scripts (fully self-contained)');
  assert(!offlineHtml.includes('<link rel="stylesheet" href="http'), 'offline.html has NO external remote stylesheets (fully self-contained)');
  assert(offlineHtml.includes('window.location.reload()'), 'offline.html includes reload/retry mechanism');
}

// =========================================================================
// TEST SUITE 5: Port 3000 Isolation Verification
// =========================================================================
async function testPortIsolation() {
  console.log(`\n${ANSI.bold}=== SUITE 5: Port Isolation Strict Constraint ===${ANSI.reset}`);

  // Test port 3000 connection (read-only probe)
  const port3000Res = await fetchWithTimeout('http://127.0.0.1:3000', {}, 2000);
  assert(
    port3000Res.status === 'ERR' || port3000Res.error?.includes('ECONNREFUSED'),
    'Port 3000 is isolated, untouched, and uninvaded by Life OS server',
    port3000Res.error || port3000Res.status
  );

  // Test port 3050 connection
  const port3050Res = await fetchWithTimeout('http://127.0.0.1:3050/api/dashboard', {}, 15000);
  assert(
    port3050Res.status === 200,
    'Port 3050 is exclusively used and responding 200 OK to API calls',
    `status: ${port3050Res.status}`
  );
}

// =========================================================================
// RUN ALL SUITES
// =========================================================================
async function main() {
  console.log(`\n${ANSI.bold}===================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}🚀 STARTING EMPIRICAL ADVERSARIAL CHALLENGER SUITE (MILESTONE 1)${ANSI.reset}`);
  console.log(`${ANSI.bold}===================================================================${ANSI.reset}`);

  try {
    await testManifests();
    await testIconsBinaryIntegrity();
    await testServiceWorker();
    await testHtmlShellAndIosIntegration();
    await testPortIsolation();
  } catch (err) {
    console.error(`Unexpected test runner crash:`, err);
    failed++;
  }

  console.log(`\n${ANSI.bold}===================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}RESULTS: ${passed} PASSED, ${failed} FAILED${ANSI.reset}`);
  console.log(`${ANSI.bold}===================================================================${ANSI.reset}\n`);

  if (failed > 0) {
    console.error(`${ANSI.red}FAILURES:${ANSI.reset}`);
    for (const f of failures) {
      console.error(`  - ${f.testName}: ${f.detail}`);
    }
    process.exit(1);
  } else {
    console.log(`${ANSI.green}ALL EMPIRICAL TESTS PASSED WITH 100% SUCCESS.${ANSI.reset}`);
    process.exit(0);
  }
}

main();
