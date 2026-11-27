import type { Unit } from './types';

/**
 * Weight storage and display.
 *
 * Everything is stored in **canonical kilograms**. Conversion happens only at the
 * display and input boundary, never in storage — mixed units would break recall
 * and Records. Stored values are never rounded, so toggling lb/kg repeatedly
 * cannot drift a number.
 */

/** Exact, by definition of the international pound. */
export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Canonical kg -> the user's unit, unrounded. */
export function toUnit(weightKg: number, unit: Unit): number {
  return unit === 'kg' ? weightKg : kgToLb(weightKg);
}

/** A value in the user's unit -> canonical kg. */
export function toCanonical(weight: number, unit: Unit): number {
  return unit === 'kg' ? weight : lbToKg(weight);
}

/**
 * Display rounding: whole pounds, or kilograms to one decimal place.
 *
 * Standard plate maths lands on whole pounds anyway, and one decimal is what
 * keeps a converted value readable ("83.9 kg", never "83.91440 kg"). Display
 * only — the stored value is untouched.
 */
export function roundForDisplay(value: number, unit: Unit): number {
  if (unit === 'lb') return Math.round(value);
  return Math.round(value * 10) / 10;
}

/**
 * Canonical kg formatted for the user's unit, with a trailing `.0` trimmed so a
 * round number reads as "100", not "100.0". No unit suffix.
 */
export function formatWeight(weightKg: number, unit: Unit): string {
  const rounded = roundForDisplay(toUnit(weightKg, unit), unit);
  // `Number.toFixed` then trim, rather than raw toString, so 83.90000000001
  // cannot leak through as a long tail.
  const fixed = unit === 'kg' ? rounded.toFixed(1) : rounded.toFixed(0);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

export function formatWeightWithUnit(weightKg: number, unit: Unit): string {
  return `${formatWeight(weightKg, unit)} ${unit}`;
}

/**
 * Parse what the user typed into a weight input.
 *
 * Returns `null` for an empty or unparseable field — that is a real value
 * meaning "bodyweight", and is stored as null rather than as zero, because zero
 * is a weight someone might genuinely mean.
 */
export function parseWeightInput(text: string, unit: Unit): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return toCanonical(parsed, unit);
}

/** Parse a reps field. Reps are always required, so an unusable value is `null`. */
export function parseRepsInput(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) return null;
  return parsed;
}

/** "185 × 6", or "6 reps" when the set carried no weight. */
export function formatSet(weightKg: number | null, reps: number, unit: Unit): string {
  if (weightKg === null) return `${reps} ${reps === 1 ? 'rep' : 'reps'}`;
  return `${formatWeight(weightKg, unit)} ${unit} × ${reps}`;
}
