/* Erzeugt die PWA-Icons (PNG) ohne externe Bibliotheken.
   Motiv: Akzent-Hintergrund mit drei aufsteigenden Balken (Fortschritt).
   Aufruf: node scripts/gen-icons.cjs */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
})();
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0, 0); return b; };
const chunk = (type, data) => {
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  return Buffer.concat([u32(data.length), td, u32(CRC(td))]);
};
function png(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const ACCENT = [181, 70, 15, 255];   // #B5460F
const PAPER = [244, 239, 230, 255];  // #F4EFE6

function draw(N) {
  const px = Buffer.alloc(N * N * 4);
  const set = (x, y, c) => { const i = (y * N + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3]; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, ACCENT);
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.max(0, y0 | 0); y < Math.min(N, y1 | 0); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(N, x1 | 0); x++) set(x, y, c); };
  // Drei aufsteigende Balken, im zentralen Sicherheitsbereich (maskable-tauglich).
  const baseline = 0.74 * N, bw = 0.12 * N, gap = 0.06 * N;
  const heights = [0.24, 0.34, 0.46].map((f) => f * N);
  let x = 0.26 * N;
  for (const hgt of heights) { rect(x, baseline - hgt, x + bw, baseline, PAPER); x += bw + gap; }
  return px;
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
  fs.writeFileSync(path.join(outDir, name), png(size, size, draw(size)));
  console.log("wrote", name);
}
