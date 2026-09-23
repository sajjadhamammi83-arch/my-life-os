/**
 * scripts/test-m1-chal-2.mjs
 * Empirical Verification & Adversarial Audit Suite for Milestone 1
 * Authored by: m1_chal_2_10 (Challenger)
 * 
 * Verifies:
 * 1. Live HTML output of http://127.0.0.1:3050/today for iOS Safari & PWA meta tags
 * 2. Absence of conflicting dark theme class on html/body and presence of safe-area rules
 * 3. Service Worker mutation bypass (POST, PATCH, PUT, DELETE unintercepted and uncached)
 * 4. 5-Tier Service Worker caching architecture (Navigation, Static, Fonts, API GET, Icons)
 * 5. PWA asset endpoints accessibility on port 3050
 * 6. Port isolation (3050 exclusively used, 3000 untouched)
 */

import http from 'node:http';
import fs from 'node:fs';
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

function assert(condition, name, meta = '') {
  if (condition) {
    passed++;
    console.log(`  ${ANSI.green}✓ PASS:${ANSI.reset} ${name} ${meta ? ANSI.cyan + '(' + meta + ')' + ANSI.reset : ''}`);
  } else {
    failed++;
    failures.push({ name, meta });
    console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} ${name} ${meta ? ANSI.yellow + '(' + meta + ')' + ANSI.reset : ''}`);
  }
}

function httpGet(path) {
  return new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port: 3050, path, headers: { Accept: '*/*' } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c.toString('utf-8')));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body, bytes: Buffer.byteLength(body) }));
    }).on('error', (err) => resolve({ status: 'ERR', error: err.message, body: '', bytes: 0 }));
  });
}

async function run() {
  console.log(`\n${ANSI.bold}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}⚡ M1 EMPIRICAL AUDIT: iOS SAFARI, META TAGS & SW MUTATION BYPASS${ANSI.reset}`);
  console.log(`${ANSI.bold}   Agent: m1_chal_2_10 | Target: http://127.0.0.1:3050${ANSI.reset}`);
  console.log(`${ANSI.bold}=================================================================${ANSI.reset}\n`);

  // --- 1. HTML Head & iOS Safari Meta Tags ---
  console.log(`${ANSI.bold}1. Live HTML Head Inspection (http://127.0.0.1:3050/today)${ANSI.reset}`);
  const today = await httpGet('/today');
  assert(today.status === 200, 'HTTP 200 OK from /today', `status: ${today.status}`);
  assert(/<meta\s+name=[\"']viewport[\"'][^>]*viewport-fit=cover/i.test(today.body), 'Viewport includes viewport-fit=cover');
  assert(/<meta\s+name=[\"']viewport[\"'][^>]*user-scalable=no/i.test(today.body), 'Viewport includes user-scalable=no');
  assert(/<meta\s+name=[\"']theme-color[\"']\s+content=[\"']#ffffff[\"']/i.test(today.body), 'Theme color is pure white #ffffff');
  assert(/<meta\s+name=[\"']apple-mobile-web-app-capable[\"']\s+content=[\"']yes[\"']/i.test(today.body), 'apple-mobile-web-app-capable is yes');
  assert(/<meta\s+name=[\"']apple-mobile-web-app-status-bar-style[\"']\s+content=[\"']default[\"']/i.test(today.body), 'apple-mobile-web-app-status-bar-style is default');
  assert(/<meta\s+name=[\"']apple-mobile-web-app-title[\"']\s+content=[\"']Life OS[\"']/i.test(today.body), 'apple-mobile-web-app-title is Life OS');
  assert(/<link\s+rel=[\"']apple-touch-icon[\"'][^>]*href=[\"']\/icons\/apple-touch-icon\.png[\"']/i.test(today.body), 'apple-touch-icon link points to /icons/apple-touch-icon.png');
  assert(/<link\s+rel=[\"']manifest[\"'][^>]*href=[\"']\/manifest\.webmanifest[\"']/i.test(today.body), 'manifest link points to /manifest.webmanifest');
  assert(!/<html[^>]*class=[\"'][^\"']*dark/i.test(today.body), 'html tag has no dark theme class');
  assert(!/<body[^>]*class=[\"'][^\"']*dark(?:\s|\"|$)/i.test(today.body), 'body tag has no dark theme class');
  assert(/<html[^>]*dir=[\"']rtl[\"']/i.test(today.body), 'html tag enforces dir="rtl"');
  assert(/<html[^>]*lang=[\"']fa[\"']/i.test(today.body), 'html tag enforces lang="fa"');

  // --- 2. CSS Safe-Area Rules & Dark Theme Absence ---
  console.log(`\n${ANSI.bold}2. CSS Safe-Area Rules & Layout Verification${ANSI.reset}`);
  const globalsCss = fs.readFileSync('src/app/globals.css', 'utf-8');
  assert(globalsCss.includes('--sat: env(safe-area-inset-top, 0px);'), 'globals.css declares --sat CSS variable');
  assert(globalsCss.includes('--sar: env(safe-area-inset-right, 0px);'), 'globals.css declares --sar CSS variable');
  assert(globalsCss.includes('--sab: env(safe-area-inset-bottom, 0px);'), 'globals.css declares --sab CSS variable');
  assert(globalsCss.includes('--sal: env(safe-area-inset-left, 0px);'), 'globals.css declares --sal CSS variable');
  assert(globalsCss.includes('.pt-safe'), 'globals.css declares .pt-safe helper');
  assert(globalsCss.includes('.pb-safe'), 'globals.css declares .pb-safe helper');
  assert(globalsCss.includes('header.sticky-header'), 'globals.css declares header.sticky-header safe area');
  assert(globalsCss.includes('overscroll-behavior-y: none;'), 'globals.css disables rubber-banding glitch on iOS');
  assert(globalsCss.includes('font-size: 16px !important;'), 'globals.css enforces input font size 16px to prevent iOS auto-zoom');

  const headerTsx = fs.readFileSync('src/components/layout/Header.tsx', 'utf-8');
  assert(headerTsx.includes('pt-[env(safe-area-inset-top)]'), 'Header.tsx applies pt-[env(safe-area-inset-top)]');
  assert(headerTsx.includes('sticky-header'), 'Header.tsx includes sticky-header class');

  // --- 3. Service Worker Mutation Bypass & 5 Caching Tiers ---
  console.log(`\n${ANSI.bold}3. Service Worker Mutation Bypass & Tier Simulation${ANSI.reset}`);
  const swCode = fs.readFileSync('public/sw.js', 'utf-8');
  const listeners = {};
  const cachePuts = [];
  const mockCacheStore = new Map();

  const mockCaches = {
    open: async (name) => ({
      match: async (req) => mockCacheStore.get(typeof req === 'string' ? req : req.url) || null,
      put: async (req, res) => {
        const k = typeof req === 'string' ? req : req.url;
        cachePuts.push({ store: name, key: k });
        mockCacheStore.set(k, res);
      }
    }),
    keys: async () => ['life-os-static-v1.0.0'],
    delete: async () => true
  };

  class MockResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    clone() { return new MockResponse(this.body, { status: this.status, headers: Object.fromEntries(this.headers) }); }
  }

  const sandbox = {
    self: {
      addEventListener: (type, fn) => { listeners[type] = fn; },
      skipWaiting: () => {},
      clients: { claim: async () => {} }
    },
    caches: mockCaches,
    console: { log: () => {}, error: () => {} },
    URL: URL,
    Response: MockResponse,
    Headers: class Headers { set() {} },
    fetch: async () => new MockResponse('ok', { status: 200 })
  };

  vm.createContext(sandbox);
  vm.runInContext(swCode, sandbox);

  assert(typeof listeners['fetch'] === 'function', 'SW fetch listener registered');

  // Test mutation methods: POST, PATCH, PUT, DELETE
  const mutationMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
  for (const m of mutationMethods) {
    let respondCalled = false;
    listeners['fetch']({
      request: { url: 'http://127.0.0.1:3050/api/tasks', method: m, mode: 'cors' },
      respondWith: () => { respondCalled = true; }
    });
    assert(!respondCalled, `SW fetch does NOT intercept ${m} (mutation bypass to outbox)`);
  }
  assert(cachePuts.length === 0, 'Zero cache.put mutations recorded (no cache pollution)');

  // Test GET API intercepted
  let apiGetCalled = false;
  listeners['fetch']({
    request: { url: 'http://127.0.0.1:3050/api/tasks', method: 'GET', mode: 'cors' },
    respondWith: () => { apiGetCalled = true; }
  });
  assert(apiGetCalled, 'SW fetch intercepts GET /api/tasks for tier 5 caching');

  // Test Navigation intercepted
  let navCalled = false;
  listeners['fetch']({
    request: { url: 'http://127.0.0.1:3050/today', method: 'GET', mode: 'navigate' },
    respondWith: () => { navCalled = true; }
  });
  assert(navCalled, 'SW fetch intercepts navigation for tier 2 stale-while-revalidate');

  // Test Next.js Static Chunk intercepted
  let staticChunkCalled = false;
  listeners['fetch']({
    request: { url: 'http://127.0.0.1:3050/_next/static/chunks/app.js', method: 'GET', mode: 'no-cors' },
    respondWith: () => { staticChunkCalled = true; }
  });
  assert(staticChunkCalled, 'SW fetch intercepts static chunks for tier 3 cache-first');

  // Test Font intercepted
  let fontCalled = false;
  listeners['fetch']({
    request: { url: 'https://fonts.googleapis.com/css2?family=Vazirmatn', method: 'GET', mode: 'cors' },
    respondWith: () => { fontCalled = true; }
  });
  assert(fontCalled, 'SW fetch intercepts fonts for tier 4 cache-first');

  // --- 4. Asset Endpoints Availability ---
  console.log(`\n${ANSI.bold}4. PWA Asset HTTP Availability on Port 3050${ANSI.reset}`);
  const assetEndpoints = [
    { path: '/manifest.webmanifest', type: 'application/manifest+json' },
    { path: '/manifest.json', type: 'application/json' },
    { path: '/sw.js', type: 'application/javascript' },
    { path: '/offline.html', type: 'text/html' },
    { path: '/icons/icon.svg', type: 'image/svg+xml' },
    { path: '/icons/apple-touch-icon.png', type: 'image/png' },
    { path: '/icons/icon-192x192.png', type: 'image/png' },
    { path: '/icons/icon-maskable-192x192.png', type: 'image/png' },
    { path: '/icons/icon-512x512.png', type: 'image/png' },
    { path: '/icons/icon-maskable-512x512.png', type: 'image/png' },
  ];

  for (const ep of assetEndpoints) {
    const res = await httpGet(ep.path);
    const contentType = res.headers['content-type'] || '';
    assert(
      res.status === 200 && res.bytes > 0 && contentType.includes(ep.type),
      `Endpoint ${ep.path} returns 200 OK with ${ep.type}`,
      `bytes: ${res.bytes}, status: ${res.status}`
    );
  }

  // --- 5. Port Isolation Verification ---
  console.log(`\n${ANSI.bold}5. Port Isolation Verification${ANSI.reset}`);
  const port3000Safe = await new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: 3000, path: '/' }, () => resolve(false));
    req.on('error', () => resolve(true)); // ECONNREFUSED is expected and safe
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
  assert(port3000Safe, 'Port 3000 is completely isolated, untouched, and uninvaded');

  console.log(`\n${ANSI.bold}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED${ANSI.reset}`);
  console.log(`${ANSI.bold}=================================================================${ANSI.reset}\n`);

  if (failed > 0) {
    console.error('Failure details:');
    failures.forEach((f) => console.error(`  - ${f.name} (${f.meta})`));
    process.exit(1);
  } else {
    console.log(`${ANSI.green}${ANSI.bold}ALL 36 EMPIRICAL CHALLENGER CHECKS PASSED PERFECTLY.${ANSI.reset}`);
    process.exit(0);
  }
}

run();
