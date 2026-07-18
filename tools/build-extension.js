/**
 * build-extension.js — package the Chrome extension into an upload-ready zip.
 *
 *   node tools/build-extension.js
 *
 * Produces  dist/devtab-<version>.zip  with manifest.json at the archive root
 * (a Chrome Web Store requirement). Only runtime files are included — dev
 * tooling, git, editor cruft, and the marketing screenshot are excluded.
 *
 * Zero dependencies: the ZIP container is written by hand (deflate via the
 * built-in zlib), so this runs anywhere Node does with no `npm install`.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');

// What ships in the extension. Directories are copied recursively.
const INCLUDE = ['manifest.json', 'index.html', 'css', 'js', 'assets'];
// Paths (relative, forward-slash) to leave out even if inside an included dir.
const EXCLUDE = new Set([
  'assets/screenshot.png', // store listing art, not needed at runtime
  'assets/.DS_Store',
  '.DS_Store',
]);

function walk(rel, files) {
  const abs = path.join(ROOT, rel);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) {
      if (name === '.DS_Store') continue;
      walk(rel + '/' + name, files);
    }
  } else if (!EXCLUDE.has(rel)) {
    files.push(rel);
  }
  return files;
}

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── Minimal ZIP writer (deflate, no data descriptors) ──────────────────────
function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const comp = zlib.deflateRawSync(e.data, { level: 9 });
    const crc = crc32(e.data);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);   // local file header sig
    lh.writeUInt16LE(20, 4);           // version needed
    lh.writeUInt16LE(0, 6);            // flags
    lh.writeUInt16LE(8, 8);            // method: deflate
    lh.writeUInt16LE(0, 10);           // mod time
    lh.writeUInt16LE(0x21, 12);        // mod date (1980-01-01)
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);           // extra len
    locals.push(lh, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);   // central dir sig
    cd.writeUInt16LE(20, 4);           // version made by
    cd.writeUInt16LE(20, 6);           // version needed
    cd.writeUInt16LE(0, 8);            // flags
    cd.writeUInt16LE(8, 10);           // method
    cd.writeUInt16LE(0, 12);           // mod time
    cd.writeUInt16LE(0x21, 14);        // mod date
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);      // local header offset
    centrals.push(cd, nameBuf);

    offset += lh.length + nameBuf.length + comp.length;
  }

  const localPart = Buffer.concat(locals);
  const centralPart = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralPart.length, 12);
  eocd.writeUInt32LE(localPart.length, 16);
  return Buffer.concat([localPart, centralPart, eocd]);
}

// ── Run ────────────────────────────────────────────────────────────────────
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const files = [];
for (const item of INCLUDE) walk(item, files);
files.sort();

const entries = files.map((name) => ({ name, data: fs.readFileSync(path.join(ROOT, name)) }));
const zip = buildZip(entries);

fs.mkdirSync(OUT_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, `devtab-${manifest.version}.zip`);
fs.writeFileSync(outFile, zip);

const totalRaw = entries.reduce((s, e) => s + e.data.length, 0);
console.log(`Packaged ${entries.length} files (${(totalRaw / 1024).toFixed(0)} KB raw)`);
console.log(`→ ${path.relative(ROOT, outFile)} (${(zip.length / 1024).toFixed(0)} KB zipped)`);
