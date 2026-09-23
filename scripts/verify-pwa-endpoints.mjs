import http from 'node:http';

const ENDPOINTS = [
  { path: '/manifest.webmanifest', expectedType: 'application/manifest+json' },
  { path: '/manifest.json', expectedType: 'application/json' },
  { path: '/sw.js', expectedType: 'application/javascript' },
  { path: '/offline.html', expectedType: 'text/html' },
  { path: '/icons/icon.svg', expectedType: 'image/svg+xml' },
  { path: '/icons/apple-touch-icon.png', expectedType: 'image/png' },
  { path: '/icons/icon-192x192.png', expectedType: 'image/png' },
  { path: '/icons/icon-maskable-192x192.png', expectedType: 'image/png' },
  { path: '/icons/icon-512x512.png', expectedType: 'image/png' },
  { path: '/icons/icon-maskable-512x512.png', expectedType: 'image/png' },
  { path: '/today', expectedType: 'text/html' },
];

async function checkEndpoint(item) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port: 3050,
        path: item.path,
        headers: { 'Accept': '*/*' },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          if (data.length < 500) data += chunk.toString();
        });
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          resolve({
            path: item.path,
            status: res.statusCode,
            contentType,
            ok: res.statusCode === 200,
            hasBody: data.length > 0,
          });
        });
      }
    );
    req.on('error', (err) => {
      resolve({
        path: item.path,
        status: 'ERROR',
        error: err.message,
        ok: false,
      });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ path: item.path, status: 'TIMEOUT', ok: false });
    });
  });
}

async function run() {
  console.log('Testing PWA HTTP endpoints on http://127.0.0.1:3050 ...\n');
  let allPassed = true;

  for (const item of ENDPOINTS) {
    const result = await checkEndpoint(item);
    const pass = result.ok;
    if (!pass) allPassed = false;
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} [${result.status}] ${item.path} (type: ${result.contentType || 'n/a'})`);
  }

  // Also check HTML response of /today for meta tags
  console.log('\nValidating iOS Safari & PWA meta tags in /today HTML response...');
  const todayResult = await new Promise((resolve) => {
    http.get('http://127.0.0.1:3050/today', (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk.toString(); });
      res.on('end', () => resolve(body));
    }).on('error', () => resolve(''));
  });

  const checks = [
    { name: 'manifest link', regex: /<link rel="manifest" href="\/manifest\.webmanifest"/ },
    { name: 'apple-touch-icon', regex: /<link rel="apple-touch-icon"/ },
    { name: 'apple-mobile-web-app-capable', regex: /<meta name="apple-mobile-web-app-capable" content="yes"/ },
    { name: 'apple-mobile-web-app-status-bar-style', regex: /<meta name="apple-mobile-web-app-status-bar-style" content="default"/ },
    { name: 'viewport-fit=cover', regex: /viewport-fit=cover/ },
    { name: 'theme-color #ffffff', regex: /<meta name="theme-color" content="#ffffff"/ },
  ];

  for (const check of checks) {
    const passed = check.regex.test(todayResult);
    if (!passed) allPassed = false;
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} Meta check: ${check.name}`);
  }

  if (allPassed) {
    console.log('\nAll PWA endpoints and iOS Safari meta tags verified successfully!');
    process.exit(0);
  } else {
    console.error('\nSome checks failed!');
    process.exit(1);
  }
}

run();
