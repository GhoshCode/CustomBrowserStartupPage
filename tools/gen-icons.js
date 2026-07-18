/**
 * gen-icons.js — reproducible generator for the extension icons.
 *
 * Draws the DevTab mark (a terminal ">_" prompt on a violet→cyan rounded
 * square, matching the app's accent palette) and writes PNGs at the three
 * sizes Chrome needs. No third-party deps — raw RGBA is encoded to PNG with
 * Node's built-in zlib. Edges are anti-aliased by rendering at 4× and
 * box-downsampling with premultiplied alpha.
 *
 *   node tools/gen-icons.js
 *
 * Outputs: assets/ext/icon16.png, icon48.png, icon128.png
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SS = 4; // supersample factor
const OUT_DIR = path.join(__dirname, '..', 'assets', 'ext');

// Accent palette (matches css --accent2 → --accent1)
const VIOLET = [139, 92, 246];  // #8b5cf6
const CYAN   = [34, 211, 238];  // #22d3ee
const INK    = [255, 255, 255]; // glyph

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

// distance from point p to segment ab
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = clamp01(t);
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// signed-distance-ish test: is (x,y) inside a rounded rect [0..W]?
function insideRoundRect(x, y, W, R) {
  const cx = Math.min(Math.max(x, R), W - R);
  const cy = Math.min(Math.max(y, R), W - R);
  // if within the straight bands, always inside
  if (x >= R && x <= W - R) return y >= 0 && y <= W;
  if (y >= R && y <= W - R) return x >= 0 && x <= W;
  return Math.hypot(x - cx, y - cy) <= R;
}

function renderHi(W) {
  const R = 0.22 * W;
  const hw = 0.05 * W; // glyph half-thickness
  // terminal ">_" prompt, in W-fractions
  const chevron = [
    [0.27 * W, 0.31 * W],
    [0.45 * W, 0.44 * W],
    [0.27 * W, 0.57 * W],
  ];
  const underscore = [[0.51 * W, 0.605 * W], [0.75 * W, 0.605 * W]];

  const buf = Buffer.alloc(W * W * 4); // RGBA
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!insideRoundRect(x + 0.5, y + 0.5, W, R)) {
        buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0;
        continue;
      }
      // diagonal gradient
      const t = clamp01((x + y) / (2 * W));
      let r = lerp(VIOLET[0], CYAN[0], t);
      let g = lerp(VIOLET[1], CYAN[1], t);
      let b = lerp(VIOLET[2], CYAN[2], t);
      // glyph strokes (round caps via distance test)
      const dGlyph = Math.min(
        distSeg(x + 0.5, y + 0.5, chevron[0][0], chevron[0][1], chevron[1][0], chevron[1][1]),
        distSeg(x + 0.5, y + 0.5, chevron[1][0], chevron[1][1], chevron[2][0], chevron[2][1]),
        distSeg(x + 0.5, y + 0.5, underscore[0][0], underscore[0][1], underscore[1][0], underscore[1][1])
      );
      if (dGlyph <= hw) { r = INK[0]; g = INK[1]; b = INK[2]; }
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
  return buf;
}

// box-downsample SS×SS with premultiplied alpha
function downsample(hi, HW, size) {
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let pr = 0, pg = 0, pb = 0, pa = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const hx = x * SS + sx, hy = y * SS + sy;
          const j = (hy * HW + hx) * 4;
          const a = hi[j + 3] / 255;
          pr += (hi[j] / 255) * a;
          pg += (hi[j + 1] / 255) * a;
          pb += (hi[j + 2] / 255) * a;
          pa += a;
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      const a = pa / n;
      if (a > 0) {
        out[o]     = Math.round((pr / pa) * 255);
        out[o + 1] = Math.round((pg / pa) * 255);
        out[o + 2] = Math.round((pb / pa) * 255);
      }
      out[o + 3] = Math.round(a * 255);
    }
  }
  return out;
}

// ── PNG encoding (RGBA, 8-bit, no palette) ─────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
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
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // filtered scanlines (filter byte 0 per row)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Run ────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
[16, 48, 128].forEach((size) => {
  const HW = size * SS;
  const hi = renderHi(HW);
  const small = downsample(hi, HW, size);
  const png = encodePNG(small, size);
  const file = path.join(OUT_DIR, `icon${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`wrote ${path.relative(path.join(__dirname, '..'), file)} (${png.length} bytes)`);
});
