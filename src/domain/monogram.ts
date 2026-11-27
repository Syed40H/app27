/**
 * Tile tints, and the initials fallback.
 *
 * Every exercise sits on a soft tinted square whose colour is derived from its
 * name, so the same exercise is always the same colour and a list of tiles reads
 * as a set rather than a grid of identical squares. The drawn pictogram goes on
 * top — see `data/pictograms.ts`.
 *
 * `monogramInitials` is kept for anywhere a name has to stand in for a picture.
 */

/**
 * A closed set of soft, paper-friendly tints. A curated list rather than a
 * continuous hue so nothing ever lands close to the burnt-orange accent, which
 * is reserved for the active set, Finish Workout, and a new personal record.
 */
export const MONOGRAM_TINTS = [
  '#E4EAF2', // slate
  '#E7EFE6', // sage
  '#F1E9DC', // sand
  '#E9E5F0', // lilac
  '#DFEBEC', // mist
  '#F0E7E7', // clay
  '#E6EDE2', // moss
  '#EDE9E1', // linen
  '#E2E9EF', // stone blue
  '#EFE8EE', // mauve
] as const;

/** FNV-1a. Small, fast, and stable across runs — the tint must never move. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The tile colour for an exercise name. Same name, same colour, forever. */
export function monogramTint(name: string): string {
  const key = name.trim().toLowerCase();
  // The modulo keeps this in range; the fallback only satisfies the compiler.
  return MONOGRAM_TINTS[hash(key) % MONOGRAM_TINTS.length] ?? MONOGRAM_TINTS[0];
}

/**
 * The letters on the tile: one for a single-word name, two for anything longer.
 * Hyphens count as word breaks, so "Pull-Ups" reads as "PU".
 */
export function monogramInitials(name: string): string {
  const words = name
    .trim()
    .split(/[\s\-/]+/)
    .filter((w) => /[a-z0-9]/i.test(w));

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
}
