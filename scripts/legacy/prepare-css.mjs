import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync('docs/research/relab-0c02b053/root-8a5edab2/asset-map.json', 'utf8'));
let css = fs.readFileSync('docs/research/relab-0c02b053/root-8a5edab2/webflow.css', 'utf8');

for (const [remoteUrl, localPath] of Object.entries(map)) {
  css = css.replaceAll(remoteUrl, localPath);
}

fs.writeFileSync('app/webflow.css', css);
console.log('Saved app/webflow.css with local asset links!');
