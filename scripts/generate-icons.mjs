/**
 * Draws the app icon and writes it out as PNG — no image library involved, so
 * `npm run icons` works anywhere Node does.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SS = 3; // supersampling factor

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));

const NIGHT = [10, 10, 20];
const NIGHT_2 = [24, 19, 38];
const GOLD = [232, 207, 154];
const GOLD_DEEP = [184, 147, 76];

/** Signed coverage of a disc, softened over one supersampled pixel. */
function disc(px, py, cx, cy, r) {
  const d = Math.hypot(px - cx, py - cy);
  return d <= r ? 1 : 0;
}

function ring(px, py, cx, cy, r, thickness) {
  const d = Math.abs(Math.hypot(px - cx, py - cy) - r);
  return d <= thickness / 2 ? 1 : 0;
}

function bar(px, py, cx, cy, halfW, halfH) {
  return Math.abs(px - cx) <= halfW && Math.abs(py - cy) <= halfH ? 1 : 0;
}

function render(size, { maskable = false } = {}) {
  const n = size * SS;
  const acc = new Float32Array(size * size * 4);

  // The rosary is drawn small on maskable icons so nothing is cropped by the
  // platform's mask.
  const scale = maskable ? 0.74 : 1;
  const cx = n / 2;
  const loopY = n * (maskable ? 0.44 : 0.42);
  const loopR = n * 0.3 * scale;
  const beadR = n * 0.026 * scale;
  const paterR = n * 0.037 * scale;

  const beads = [];
  const count = 22;
  const gap = 26; // degrees left open at the bottom for the pendant
  for (let i = 0; i < count; i++) {
    const angle = ((90 + gap / 2 + ((360 - gap) / count) * (i + 0.5)) * Math.PI) / 180;
    beads.push({
      x: cx + Math.cos(angle) * loopR,
      y: loopY + Math.sin(angle) * loopR,
      r: i % 6 === 0 ? paterR : beadR,
    });
  }

  const medalY = loopY + loopR + n * 0.045 * scale;
  const crossY = medalY + n * 0.15 * scale;
  const crossHalfH = n * 0.088 * scale;
  const crossHalfW = n * 0.058 * scale;
  const crossBar = n * 0.019 * scale;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = x / n;
      const v = y / n;

      // Background: night, warmed by a glow behind the loop.
      let colour = mix(NIGHT, NIGHT_2, v * 0.9 + 0.1);
      const glow = Math.max(
        0,
        1 - Math.hypot((x - cx) / (n * 0.55), (y - loopY) / (n * 0.55)),
      );
      colour = mix(colour, GOLD_DEEP, glow * glow * 0.22);

      let ink = 0;

      // Chain.
      ink = Math.max(ink, ring(x, y, cx, loopY, loopR, n * 0.0035) * 0.5);

      for (const bead of beads) ink = Math.max(ink, disc(x, y, bead.x, bead.y, bead.r));

      // Medal and pendant chain.
      ink = Math.max(ink, disc(x, y, cx, medalY, n * 0.032 * scale));
      ink = Math.max(
        ink,
        bar(x, y, cx, (medalY + crossY - crossHalfH) / 2, n * 0.0035, (crossY - crossHalfH - medalY) / 2) * 0.6,
      );

      // Crucifix.
      ink = Math.max(ink, bar(x, y, cx, crossY, crossBar / 2, crossHalfH));
      ink = Math.max(ink, bar(x, y, cx, crossY - crossHalfH * 0.28, crossHalfW, crossBar / 2));

      if (ink > 0) colour = mix(colour, GOLD, ink);

      // Accumulate into the output pixel.
      const ox = Math.floor(x / SS);
      const oy = Math.floor(y / SS);
      const at = (oy * size + ox) * 4;
      acc[at] += colour[0];
      acc[at + 1] += colour[1];
      acc[at + 2] += colour[2];
      acc[at + 3] += 255;
      void u;
    }
  }

  const rgba = Buffer.alloc(size * size * 4);
  const samples = SS * SS;
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = Math.round(acc[i * 4] / samples);
    rgba[i * 4 + 1] = Math.round(acc[i * 4 + 1] / samples);
    rgba[i * 4 + 2] = Math.round(acc[i * 4 + 2] / samples);
    rgba[i * 4 + 3] = Math.round(acc[i * 4 + 3] / samples);
  }
  return encodePng(size, size, rgba);
}

const outputs = [
  ['public/icons/icon-192.png', render(192)],
  ['public/icons/icon-512.png', render(512)],
  ['public/icons/icon-maskable-512.png', render(512, { maskable: true })],
  ['public/icons/apple-touch-icon.png', render(180)],
];

for (const [path, buffer] of outputs) {
  const target = resolve(ROOT, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buffer);
  console.log(`wrote ${path} (${(buffer.length / 1024).toFixed(1)} kB)`);
}
