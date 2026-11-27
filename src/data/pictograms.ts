/**
 * Exercise pictograms.
 *
 * Original line art, drawn from primitives rather than sourced. Icon sets are
 * either licensed, attribution-encumbered, or copyright risk — and images
 * scraped from search results are grounds for App Store rejection. Drawing them
 * here sidesteps all of that and keeps the art in the app's own hand: single
 * stroke weight, rounded caps, ink on a soft tint, like a sketch in the margin
 * of a gym notebook.
 *
 * Each pictogram is plain data so it has exactly one definition. The app renders
 * it with react-native-svg; `scripts/preview-pictograms.js` rasterises the same
 * data to a PNG contact sheet, so the art can be looked at rather than guessed
 * at.
 *
 * Co-ordinates live in a 48x48 box.
 */

export type Primitive =
  /** A straight stroke. */
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number }
  /** A stroked (unfilled) circle. */
  | { k: 'circle'; cx: number; cy: number; r: number }
  /** A connected run of strokes: [x1, y1, x2, y2, ...]. */
  | { k: 'poly'; pts: number[] };

export const PICTOGRAM_BOX = 48;
export const PICTOGRAM_STROKE = 2.4;

const line = (x1: number, y1: number, x2: number, y2: number): Primitive => ({
  k: 'line',
  x1,
  y1,
  x2,
  y2,
});
const circle = (cx: number, cy: number, r: number): Primitive => ({ k: 'circle', cx, cy, r });
const poly = (...pts: number[]): Primitive => ({ k: 'poly', pts });

/** A loaded bar: the shaft plus a plate tick at each end. */
function barbell(x1: number, x2: number, y: number, plateHalf = 4): Primitive[] {
  const inset = 4;
  return [
    line(x1, y, x2, y),
    line(x1 + inset, y - plateHalf, x1 + inset, y + plateHalf),
    line(x2 - inset, y - plateHalf, x2 - inset, y + plateHalf),
  ];
}

export const PICTOGRAMS = {
  /** Lying on a bench, pressing a bar off the chest. */
  benchPress: [
    line(8, 33, 40, 33),
    line(13, 33, 13, 40),
    line(35, 33, 35, 40),
    circle(13, 28.5, 3),
    line(17, 29, 31, 29),
    line(22, 29, 20, 20),
    line(28, 29, 30, 20),
    ...barbell(11, 38, 18),
  ],

  /** Arms arcing wide, a dumbbell at each hand. */
  chestFly: [
    circle(24, 11, 3),
    line(24, 14, 24, 30),
    line(24, 18, 12, 24),
    line(24, 18, 36, 24),
    circle(9, 25, 2.6),
    circle(39, 25, 2.6),
    line(24, 30, 20, 40),
    line(24, 30, 28, 40),
  ],

  pushUp: [
    line(6, 40, 42, 40),
    line(12, 26, 32, 26),
    circle(36, 26, 3),
    line(29, 27, 29, 40),
    line(13, 26, 9, 40),
  ],

  /** Between parallel bars, arms locked at the sides. */
  dip: [
    line(6, 21, 14, 21),
    line(10, 21, 10, 40),
    line(34, 21, 42, 21),
    line(38, 21, 38, 40),
    circle(24, 13, 3),
    line(24, 16, 24, 30),
    line(24, 19, 13, 21),
    line(24, 19, 35, 21),
    line(24, 30, 21, 38),
    line(24, 30, 28, 38),
  ],

  /** A loaded bar resting on the floor. */
  deadlift: [
    circle(11, 30, 8),
    circle(37, 30, 8),
    line(11, 30, 37, 30),
  ],

  /** Hinged at the hips, pulling a bar to the torso. */
  row: [
    circle(11, 19, 3),
    line(14, 21, 29, 25),
    line(29, 25, 31, 40),
    line(21, 24, 21, 31),
    circle(13, 34, 4),
    circle(29, 34, 4),
    line(13, 34, 29, 34),
  ],

  /** Hanging from a fixed bar. */
  pullUp: [
    line(8, 10, 40, 10),
    line(18, 11, 20, 20),
    line(30, 11, 28, 20),
    circle(24, 22, 3),
    line(24, 25, 24, 34),
    line(24, 34, 20, 41),
    line(24, 34, 28, 41),
  ],

  /** Seated, pulling a bar down from overhead. */
  pulldown: [
    line(24, 6, 24, 13),
    line(12, 13, 36, 13),
    line(18, 14, 20, 22),
    line(30, 14, 28, 22),
    circle(24, 24, 3),
    line(24, 27, 24, 35),
    line(17, 35, 31, 35),
  ],

  /** Standing, bar locked out overhead. */
  overheadPress: [
    ...barbell(10, 38, 11),
    line(19, 12, 19, 21),
    line(29, 12, 29, 21),
    circle(24, 20, 3),
    line(24, 23, 24, 31),
    line(24, 31, 20, 41),
    line(24, 31, 28, 41),
  ],

  /** Arms raised to the sides, a dumbbell in each hand. */
  lateralRaise: [
    circle(24, 12, 3),
    line(24, 15, 24, 29),
    line(24, 19, 11, 19),
    line(24, 19, 37, 19),
    line(11, 15, 11, 23),
    line(37, 15, 37, 23),
    line(24, 29, 20, 40),
    line(24, 29, 28, 40),
  ],

  /** Shoulders lifted, arms hanging straight. */
  shrug: [
    circle(24, 10, 3),
    poly(17, 18, 24, 15, 31, 18),
    line(24, 18, 24, 30),
    line(17, 18, 15, 26),
    line(31, 18, 33, 26),
    circle(14, 29, 3.4),
    circle(34, 29, 3.4),
    line(24, 30, 21, 40),
    line(24, 30, 27, 40),
  ],

  /** A curled forearm holding a dumbbell. */
  curl: [
    circle(15, 11, 3),
    line(15, 14, 15, 31),
    line(15, 17, 17, 25),
    line(17, 25, 29, 20),
    circle(32, 19, 3.4),
    line(15, 31, 12, 40),
    line(15, 31, 18, 40),
  ],

  /** A cable stack with a high pulley and a handle. */
  cable: [
    line(12, 8, 12, 40),
    line(9, 40, 21, 40),
    line(12, 8, 31, 8),
    line(31, 8, 31, 20),
    line(25, 20, 37, 20),
    line(31, 20, 31, 24),
  ],

  /** Bar across the shoulders, knees bent. */
  squat: [
    ...barbell(10, 38, 14),
    circle(24, 8, 3),
    line(24, 17, 24, 26),
    line(24, 26, 17, 30),
    line(17, 30, 17, 40),
    line(24, 26, 31, 30),
    line(31, 30, 31, 40),
  ],

  /** Seated, driving a loaded platform away. */
  legPress: [
    line(6, 40, 40, 40),
    line(8, 18, 14, 32),
    line(8, 34, 22, 34),
    line(18, 32, 28, 26),
    line(28, 26, 34, 16),
    line(30, 12, 40, 20),
  ],

  /** A seated machine with a shin pad. */
  legMachine: [
    line(12, 12, 12, 28),
    line(12, 28, 24, 28),
    line(24, 28, 33, 28),
    line(33, 28, 38, 18),
    circle(38, 16, 3),
    line(10, 40, 38, 40),
    line(14, 28, 14, 40),
  ],

  /** Hips bridged off the floor under a bar. */
  hipThrust: [
    line(8, 40, 40, 40),
    circle(11, 36, 3),
    line(14, 37, 22, 29),
    line(22, 29, 31, 34),
    line(31, 34, 31, 40),
    line(14, 25, 30, 25),
    circle(14, 25, 3),
    circle(30, 25, 3),
  ],

  /** Heel raised on a step. */
  calfRaise: [
    line(8, 38, 40, 38),
    line(20, 9, 20, 30),
    line(20, 30, 28, 38),
    poly(17, 14, 15, 20, 17, 26),
  ],

  /** Hanging leg raise. */
  core: [
    line(10, 8, 38, 8),
    line(20, 9, 20, 18),
    line(28, 9, 28, 18),
    circle(24, 20, 3),
    line(24, 23, 24, 30),
    line(24, 30, 36, 30),
  ],

  /** A kettlebell, for whole-body movements. */
  kettlebell: [
    poly(18, 15, 18, 11, 24, 8, 30, 11, 30, 15),
    circle(24, 27, 10),
  ],

  /** The fallback: a plain dumbbell. */
  dumbbell: [
    line(14, 24, 34, 24),
    line(12, 18, 12, 30),
    line(17, 20, 17, 28),
    line(31, 20, 31, 28),
    line(36, 18, 36, 30),
  ],
} satisfies Record<string, Primitive[]>;

export type PictogramName = keyof typeof PICTOGRAMS;
