// Crop a region out of a PNG and stack two images side by side for visual QA.
//
// Usage: node scripts/compare-crop.mjs <a.png> <b.png> <x> <y> <w> <h> [--out=file.png] [--scale=2]
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
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pred) & 0xff;
      }
      cur[x] = v;
    }
  }
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
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = out[i];
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
  const table = crc32.table ?? (crc32.table = buildTable());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
  function buildTable() {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
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
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
      chunk("IEND", Buffer.alloc(0)),
    ])
  );
}

function crop(img, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    const sy = y + row;
    if (sy < 0 || sy >= img.height) continue;
    for (let col = 0; col < w; col++) {
      const sx = x + col;
      if (sx < 0 || sx >= img.width) continue;
      const si = (sy * img.width + sx) * 4;
      const di = (row * w + col) * 4;
      out[di] = img.data[si];
      out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2];
      out[di + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

function scale(img, factor) {
  if (factor === 1) return img;
  const w = img.width * factor;
  const h = img.height * factor;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((y / factor | 0) * img.width + (x / factor | 0)) * 4;
      const di = (y * w + x) * 4;
      out[di] = img.data[si];
      out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2];
      out[di + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    })
);

const [fileA, fileB, xs, ys, ws, hs] = positional;
const x = Number(xs);
const y = Number(ys);
const w = Number(ws);
const h = Number(hs);
const factor = Number(flags.scale ?? 2);
const outFile = flags.out ?? "docs/design-references/crop.png";

const a = readPng(fileA);
const b = readPng(fileB);
const ca = scale(crop(a, x, y, w, h), factor);
const cb = scale(crop(b, x, y, w, h), factor);

const gap = 8;
const W = ca.width + cb.width + gap;
const H = Math.max(ca.height, cb.height);
const canvas = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  canvas[i * 4] = 255;
  canvas[i * 4 + 1] = 0;
  canvas[i * 4 + 2] = 255;
  canvas[i * 4 + 3] = 255;
}
console.log(
  `canvas ${W}x${H} len=${canvas.length} | left ${ca.width}x${ca.height} len=${ca.data.length} | right ${cb.width}x${cb.height} len=${cb.data.length}`
);
for (let row = 0; row < ca.height; row++) {
  canvas.set(
    ca.data.subarray(row * ca.width * 4, (row + 1) * ca.width * 4),
    row * W * 4
  );
}
for (let row = 0; row < cb.height; row++) {
  canvas.set(
    cb.data.subarray(row * cb.width * 4, (row + 1) * cb.width * 4),
    row * W * 4 + (ca.width + gap) * 4
  );
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
writePng(outFile, W, H, canvas);
console.log(`wrote ${outFile} (${W}x${H}) — left: ${path.basename(fileA)}, right: ${path.basename(fileB)}`);