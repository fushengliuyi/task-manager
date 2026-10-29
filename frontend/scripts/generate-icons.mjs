// 生成 PWA 图标（纯色 indigo 方块），零依赖。
// 用法: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// indigo #6366f1 -> 圆角由 alpha 模拟：四角透明
function makeIcon(size) {
  const r = Math.floor(size * 0.22); // 圆角半径
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); // filter byte + pixels
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const ox = x < r ? r - x : x >= size - r ? x - (size - r) + 1 : 0;
      const oy = y < r ? r - y : y >= size - r ? y - (size - r) + 1 : 0;
      const inside = ox * ox + oy * oy <= r * r;
      const idx = 1 + x * 4;
      row[idx] = 0x63; // R
      row[idx + 1] = 0x66; // G
      row[idx + 2] = 0xf1; // B
      row[idx + 3] = inside ? 255 : 0; // A
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(Buffer.concat(rows));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(join(outDir, "pwa-192.png"), makeIcon(192));
writeFileSync(join(outDir, "pwa-512.png"), makeIcon(512));
console.log("已生成 public/pwa-192.png 和 public/pwa-512.png");
