// Pixel-diff two PNG screenshots and report the bands that differ, so visual
// QA can be driven by data instead of eyeballing giant full-page captures.
//
// Usage: node scripts/diff-images.mjs <a.png> <b.png> [--out=diff.png] [--crop=dir]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* --------------------------- minimal PNG codec --------------------------- */

function readPng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  let palette = null;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error(`unsupported color type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      switch (filter) {
        case 0:
          break;
        case 1:
          v = (v + a) & 0xff;
          break;
        case 2:
          v = (v + b) & 0xff;
          break;
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pred) & 0xff;
          break;
        }
        default:
          throw new Error(`bad filter ${filter}`);
      }
      cur[x] = v;
    }
  }

  // Normalise to RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (channels === 4) {
      rgba[i * 4] = out[i * 4];
      rgba[i * 4 + 1] = out[i * 4 + 1];
      rgba[i * 4 + 2] = out[i * 4 + 2];
      rgba[i * 4 + 3] = out[i * 4 + 3];
    } else if (channels === 3) {
      rgba[i * 4] = out[i * 3];
      rgba[i * 4 + 1] = out[i * 3 + 1];
      rgba[i * 4 + 2] = out[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    } else if (channels === 1) {
      rgba[i * 4] = out[i];
      rgba[i * 4 + 1] = out[i];
      rgba[i * 4 + 2] = out[i];
      rgba[i * 4 + 3] = 255;
    } else if (colorType === 3 && palette) {
      const idx = out[i];
      rgba[i * 4] = palette[idx * 3];
      rgba[i * 4 + 1] = palette[idx * 3 + 1];
      rgba[i * 4 + 2] = palette[idx * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
  }
  return { width, height, data: rgba };
}

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = buildTable());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
  function buildTable() {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(file, width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

/* -------------------------------- diff --------------------------------- */

const [fileA, fileB] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const outArg = process.argv.slice(2).find((a) => a.startsWith("--out="));

const a = readPng(fileA);
const b = readPng(fileB);
console.log(`A ${fileA}: ${a.width}x${a.height}`);
console.log(`B ${fileB}: ${b.width}x${b.height}`);

const width = Math.min(a.width, b.width);
const height = Math.min(a.height, b.height);

const BAND = 40;
const diff = new Uint8Array(width * height);
let totalDiff = 0;
let sumDelta = 0;
const thresholds = [8, 24, 64, 128];
const counts = new Array(thresholds.length).fill(0);
const bands = [];
for (let y0 = 0; y0 < height; y0 += BAND) {
  const y1 = Math.min(height, y0 + BAND);
  let bandPixels = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const d =
        Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2]);
      sumDelta += d;
      for (let t = 0; t < thresholds.length; t++) {
        if (d > thresholds[t]) counts[t] += 1;
      }
      if (d > 64) {
        diff[y * width + x] = 1;
        bandPixels += 1;
        totalDiff += 1;
      }
    }
  }
  bands.push({ y0, y1, pixels: bandPixels, pct: (bandPixels / ((y1 - y0) * width)) * 100 });
}

console.log(
  `\nmean abs delta per pixel: ${(sumDelta / (width * height) / 3).toFixed(3)}`
);
console.log(
  `threshold counts: ${thresholds.map((t, i) => `>${t}: ${counts[i]}`).join("  ")}`
);
console.log(`\ndiffering pixels (>64): ${totalDiff} (${((totalDiff / (width * height)) * 100).toFixed(3)}%)`);
console.log("\nbands with >1% differing pixels:");
for (const band of bands) {
  if (band.pct > 1) {
    console.log(`  y=${band.y0}-${band.y1}  ${band.pct.toFixed(2)}%`);
  }
}

if (outArg) {
  const outFile = outArg.split("=")[1];
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const d = diff[y * width + x];
      if (d) {
        rgba[i] = 255;
        rgba[i + 1] = 0;
        rgba[i + 2] = 0;
        rgba[i + 3] = 255;
      } else {
        const gray = (a.data[i] * 0.299 + a.data[i + 1] * 0.587 + a.data[i + 2] * 0.114) | 0;
        rgba[i] = gray;
        rgba[i + 1] = gray;
        rgba[i + 2] = gray;
        rgba[i + 3] = 255;
      }
    }
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  writePng(outFile, width, height, rgba);
  console.log(`\nwrote diff mask: ${outFile}`);
}