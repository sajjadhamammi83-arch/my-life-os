import http from 'node:http';

http.get('http://127.0.0.1:3050/today', (res) => {
  let html = '';
  res.on('data', (c) => { html += c.toString(); });
  res.on('end', () => {
    const checks = {
      'viewport-fit': html.includes('viewport-fit=cover'),
      'theme-color': html.includes('content="#ffffff"'),
      'manifest': html.includes('href="/manifest.webmanifest"'),
      'apple-touch-icon': html.includes('apple-touch-icon'),
      'apple-capable': html.includes('name="apple-mobile-web-app-capable" content="yes"'),
      'status-bar-style': html.includes('name="apple-mobile-web-app-status-bar-style" content="default"')
    };
    console.log(JSON.stringify(checks, null, 2));
  });
}).on('error', (err) => {
  console.error('Error fetching /today:', err);
  process.exit(1);
});
