import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

const researchDir = path.resolve('docs/research/relab-0c02b053/root-8a5edab2');
const assetDir = path.resolve('public/sites/relab-0c02b053/root-8a5edab2');
const rawAssetsPath = path.join(researchDir, 'raw-assets.json');

if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir, { recursive: true });
}

const rawData = JSON.parse(fs.readFileSync(rawAssetsPath, 'utf8'));

const allUrls = new Set();

// 1. images
for (const img of rawData.images || []) {
  if (img.src && img.src.startsWith('http')) {
    allUrls.add(img.src);
  }
}

// 2. background images
for (const bg of rawData.bgImages || []) {
  const match = bg.bg?.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
  if (match && match[1]) {
    allUrls.add(match[1]);
  }
}

// 3. videos
for (const v of rawData.videos || []) {
  if (v.src && v.src.startsWith('http')) {
    allUrls.add(v.src);
  }
}

// 4. Meta & static
const extra = [
  "https://cdn.prod.website-files.com/6a97e757adfa59f93a89009c/6aad1684503d1bf2692ca802_Thumbnail.jpg",
  "https://cdn.prod.website-files.com/6a97e757adfa59f93a89009c/6a97fefd59fd4ab25cf4dff3_Favicon.png",
  "https://cdn.prod.website-files.com/6a97e757adfa59f93a89009c/6a97fefd1db1932cf683d363_Favicon.png"
];
extra.forEach(u => allUrls.add(u));

console.log(`Found ${allUrls.size} unique assets to download.`);

const assetMap = {};

function downloadFile(urlStr, targetPath) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;

    const file = fs.createWriteStream(targetPath);
    const req = client.get(urlStr, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        downloadFile(res.headers.location, targetPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(targetPath, () => {});
        return reject(new Error(`Failed to get '${urlStr}' (${res.statusCode})`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(targetPath));
      });
    });

    req.on('error', (err) => {
      file.close();
      fs.unlink(targetPath, () => {});
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.abort();
      file.close();
      fs.unlink(targetPath, () => {});
      reject(new Error(`Timeout downloading '${urlStr}'`));
    });
  });
}

// Download queue
const queue = [...allUrls];
const CONCURRENCY = 6;
let completed = 0;
let failed = 0;

async function worker() {
  while (queue.length > 0) {
    const urlStr = queue.shift();
    try {
      const parsedUrl = new URL(urlStr);
      let filename = path.basename(parsedUrl.pathname);
      // decode filename
      try {
        filename = decodeURIComponent(filename);
      } catch (e) {}

      // sanitize filename
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!filename || filename === '_' || filename.length < 3) {
        filename = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      }

      const targetPath = path.join(assetDir, filename);
      const relativePublicPath = `/sites/relab-0c02b053/root-8a5edab2/${filename}`;

      if (!fs.existsSync(targetPath)) {
        await downloadFile(urlStr, targetPath);
      }

      assetMap[urlStr] = relativePublicPath;
      completed++;
      if (completed % 10 === 0 || completed === allUrls.size) {
        console.log(`Downloaded ${completed}/${allUrls.size}...`);
      }
    } catch (err) {
      console.error(`Error downloading ${urlStr}: ${err.message}`);
      failed++;
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const mapPath = path.join(researchDir, 'asset-map.json');
fs.writeFileSync(mapPath, JSON.stringify(assetMap, null, 2));
console.log(`All done! Completed: ${completed}, Failed: ${failed}. Map saved to: ${mapPath}`);
