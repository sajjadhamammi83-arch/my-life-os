const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  });
  return results;
}

const files = getFiles('src');
const apiCalls = new Set();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /fetch\(\s*[`'"]([^`'"]*\/api\/[^`'"]*)[`'"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const cleaned = m[1].replace(/\$\{.*?\}/g, 'ID').split('?')[0];
    apiCalls.add(cleaned);
  }
});

console.log('Unique API fetch endpoints called in frontend:');
Array.from(apiCalls).sort().forEach(c => console.log(' -', c));
