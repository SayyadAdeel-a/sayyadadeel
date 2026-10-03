import fs from 'node:fs';

const css = fs.readFileSync('docs/research/relab-0c02b053/root-8a5edab2/webflow.css', 'utf8');
const urls = [];
let match;
const re = /url\(([^)]+)\)/g;
while ((match = re.exec(css)) !== null) {
  urls.push(match[1].replace(/['"]/g, ''));
}
console.log('Background URLs in webflow.css:', [...new Set(urls)]);
