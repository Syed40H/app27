/**
 * Renders the exercise pictograms to a PNG contact sheet so the art can be
 * reviewed rather than imagined.
 *
 * This draws the *same data* the app renders with react-native-svg, so what you
 * see here is what ships.
 *
 *   npx tsc -p tsconfig.test.json
 *   node scripts/preview-pictograms.js
 *
 * Writes to the path given as argv[2], defaulting to pictograms.png in the
 * repo root. It is a review tool, not part of the app bundle.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const compiled = path.join(__dirname, '..', '.test-build', 'src', 'data', 'pictograms.js');
if (!fs.existsSync(compiled)) {
  console.error('Compile first:  npx tsc -p tsconfig.test.json');
  process.exit(1);
}

const { PICTOGRAMS, PICTOGRAM_BOX, PICTOGRAM_STROKE } = require(compiled);

const PAPER = [0xfa, 0xf8, 0xf5];
const TILE = [0xe9, 0xe5, 0xe0];
const INK = [0x1a, 0x1a, 0x1a];

const CELL = 96; // rendered size of one pictogram
const PAD = 14; // gap around each tile
const COLUMNS = 6;

// ------------------------------------------------------------------ geometry

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance from a point to the stroked outline of a primitive. */
function distanceToPrimitive(x, y, prim) {
  switch (prim.k) {
    case 'line':
      return distanceToSegment(x, y, prim.x1, prim.y1, prim.x2, prim.y2);
    case 'circle':
      return Math.abs(Math.hypot(x - prim.cx, y - prim.cy) - prim.r);
    case 'poly': {
      let best = Infinity;
      for (let i = 0; i + 3 < prim.pts.length; i += 2) {
        best = Math.min(
          best,
          distanceToSegment(x, y, prim.pts[i], prim.pts[i + 1], prim.pts[i + 2], prim.pts[i + 3]),
        );
      }
      return best;
    }
    default:
      return Infinity;
  }
}

/**
 * Stroke coverage at a point, for one pass of the extrusion.
 *
 * @param dx,dy  offset of this pass, in pictogram units
 * @param width  stroke width for this pass
 */
function coverageAt(x, y, prims, dx = 0, dy = 0, width = PICTOGRAM_STROKE) {
  let nearest = Infinity;
  for (const prim of prims) {
    nearest = Math.min(nearest, distanceToPrimitive(x - dx, y - dy, prim));
  }
  return Math.max(0, Math.min(1, (width / 2 + 0.5 - nearest) / 1.0));
}

/**
 * The three passes that give flat line art depth: a darker copy pushed
 * down-right to read as thickness, the ink itself, then a fine light pass on the
 * top-left edge to catch the light.
 */
const PASSES = [
  { dx: 1.15, dy: 1.45, width: PICTOGRAM_STROKE, shade: 'shadow' },
  { dx: 0, dy: 0, width: PICTOGRAM_STROKE, shade: 'ink' },
  { dx: -0.5, dy: -0.7, width: PICTOGRAM_STROKE * 0.38, shade: 'highlight' },
];

function mix(a, b, t) {
  return [0, 1, 2].map((c) => a[c] * (1 - t) + b[c] * t);
}

// ----------------------------------------------------------------------- PNG

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

function encodePng(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------------- render

const names = Object.keys(PICTOGRAMS);
const rows = Math.ceil(names.length / COLUMNS);
const cellOuter = CELL + PAD * 2;
const width = COLUMNS * cellOuter;
const height = rows * cellOuter;
const rgb = Buffer.alloc(width * height * 3);

for (let i = 0; i < width * height; i++) {
  rgb[i * 3] = PAPER[0];
  rgb[i * 3 + 1] = PAPER[1];
  rgb[i * 3 + 2] = PAPER[2];
}

const samples = 3;
const radius = CELL * 0.22; // rounded tile corner

names.forEach((name, index) => {
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const originX = col * cellOuter + PAD;
  const originY = row * cellOuter + PAD;
  const prims = PICTOGRAMS[name];

  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      // Rounded-rect tile behind the art.
      const dx = Math.max(radius - x, 0, x - (CELL - radius));
      const dy = Math.max(radius - y, 0, y - (CELL - radius));
      if (Math.hypot(dx, dy) > radius) continue;

      // Tile gradient: lighter at the top-left, deeper toward the bottom-right.
      const depth = (x / CELL) * 0.35 + (y / CELL) * 0.65;
      let pixel = mix(mix(TILE, [255, 255, 255], 0.55), mix(TILE, INK, 0.1), depth);

      for (const pass of PASSES) {
        let hits = 0;
        for (let sy = 0; sy < samples; sy++) {
          for (let sx = 0; sx < samples; sx++) {
            const gx = ((x + (sx + 0.5) / samples) / CELL) * PICTOGRAM_BOX;
            const gy = ((y + (sy + 0.5) / samples) / CELL) * PICTOGRAM_BOX;
            hits += coverageAt(gx, gy, prims, pass.dx, pass.dy, pass.width);
          }
        }
        let alpha = hits / (samples * samples);
        if (alpha <= 0) continue;

        let colour;
        if (pass.shade === 'shadow') {
          colour = mix(TILE, INK, 0.5);
          alpha *= 0.9;
        } else if (pass.shade === 'ink') {
          colour = INK;
        } else {
          colour = [255, 255, 255];
          alpha *= 0.75;
        }
        pixel = mix(pixel, colour, alpha);
      }

      const px = originX + x;
      const py = originY + y;
      const offset = (py * width + px) * 3;
      for (let c = 0; c < 3; c++) rgb[offset + c] = Math.round(pixel[c]);
    }
  }
});

const output = process.argv[2] ?? path.join(__dirname, '..', 'pictograms.png');
fs.writeFileSync(output, encodePng(width, height, rgb));
console.log(`Wrote ${output} — ${names.length} pictograms (${width}x${height})`);
console.log(names.join(', '));
