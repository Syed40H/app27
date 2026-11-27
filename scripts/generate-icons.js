/**
 * Generates the placeholder app icon and splash mark.
 *
 * The proposed final icon is a bold monogram "R" in the burnt-orange accent on
 * the app's paper background, matching the in-app monogram tiles. This script
 * draws exactly that from primitives so the project has real, intentional art
 * to build with — replace `assets/images/icon.png` with a designed 1024x1024
 * before shipping if you want something more crafted.
 *
 * No dependencies: PNG is written by hand with the built-in zlib.
 *
 *   node scripts/generate-icons.js
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PAPER = [0xfa, 0xf8, 0xf5];
const ACCENT = [0xe8, 0x55, 0x2d];

// ---------------------------------------------------------------- geometry

/** Distance from a point to a line segment, for drawing thick strokes. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Coverage of the letterform at a point, in a 1024x1024 co-ordinate space.
 * Returns true when the point is inside the glyph.
 *
 * The R is built from three primitives: a vertical stem, an annular bowl
 * clipped to the right of the stem, and a diagonal leg drawn as a capsule.
 */
function insideR(x, y) {
  // Stem.
  if (x >= 330 && x <= 412 && y >= 270 && y <= 754) return true;

  // Bowl: a ring clipped to sit inside the stem's right edge, so the two
  // horizontal strokes run into the stem instead of stopping just short of it.
  if (x >= 400) {
    const ringDistance = Math.hypot(x - 520, y - 392);
    if (ringDistance <= 122 && ringDistance >= 52) return true;
  }

  // Leg. It starts within the bowl's stroke so the join reads as one shape,
  // and ends level with the foot of the stem.
  if (distanceToSegment(x, y, 440, 458, 660, 754) <= 42) return true;

  return false;
}

// -------------------------------------------------------------------- PNG

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
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** @param pixels RGB or RGBA bytes, row-major. */
function encodePng(width, height, pixels, hasAlpha) {
  const channels = hasAlpha ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = hasAlpha ? 6 : 2; // colour type: RGBA or RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ render

/**
 * @param size          output size in pixels
 * @param transparent   true for the splash mark, false for the App Store icon
 *                      (which must have no alpha channel at all)
 */
function renderMark(size, transparent) {
  const samples = 3; // supersampling, for smooth curves
  const channels = transparent ? 4 : 3;
  const pixels = Buffer.alloc(size * size * channels);
  const scale = 1024 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const gx = (x + (sx + 0.5) / samples) * scale;
          const gy = (y + (sy + 0.5) / samples) * scale;
          if (insideR(gx, gy)) hits++;
        }
      }

      const coverage = hits / (samples * samples);
      const offset = (y * size + x) * channels;

      if (transparent) {
        pixels[offset] = ACCENT[0];
        pixels[offset + 1] = ACCENT[1];
        pixels[offset + 2] = ACCENT[2];
        pixels[offset + 3] = Math.round(coverage * 255);
      } else {
        for (let c = 0; c < 3; c++) {
          pixels[offset + c] = Math.round(PAPER[c] * (1 - coverage) + ACCENT[c] * coverage);
        }
      }
    }
  }

  return encodePng(size, size, pixels, transparent);
}

const outputDirectory = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(outputDirectory, { recursive: true });

// App Store icon: 1024x1024, no transparency, no rounded corners (Apple adds
// the mask itself).
fs.writeFileSync(path.join(outputDirectory, 'icon.png'), renderMark(1024, false));

// Splash mark sits on the splash background colour, so it keeps its alpha.
fs.writeFileSync(path.join(outputDirectory, 'splash-icon.png'), renderMark(256, true));

console.log('Wrote assets/images/icon.png (1024, opaque)');
console.log('Wrote assets/images/splash-icon.png (256, alpha)');
