import type { MuscleGroup } from './types';

/**
 * A colour for each workout, so a wall of cards is readable at a glance.
 *
 * The colour is **meaningful, not decorative**: it comes from the workout's
 * label, so a Push day is always the same colour and you learn to spot your
 * split without reading. An unlabelled workout borrows the colour of its first
 * exercise's muscle group, which is the next most honest signal available.
 *
 * None of these are the burnt-orange accent. That stays reserved for the active
 * set, Finish Workout, and a new personal record.
 */

export const WORKOUT_COLORS = [
  '#3B6FD4', // blue
  '#0E8C82', // teal
  '#7A4FD6', // violet
  '#3E8A3A', // green
  '#B03A76', // magenta
  '#6F7A1F', // olive
  '#4A6572', // slate
] as const;

/**
 * The built-in splits get fixed colours rather than hashed ones, so the three
 * that matter most — Push, Pull, Legs — are guaranteed to differ from each
 * other rather than colliding by chance.
 */
const BY_LABEL: Record<string, string> = {
  push: WORKOUT_COLORS[0],
  pull: WORKOUT_COLORS[1],
  legs: WORKOUT_COLORS[2],
  upper: WORKOUT_COLORS[3],
  lower: WORKOUT_COLORS[4],
  'full body': WORKOUT_COLORS[5],
  'chest & triceps': WORKOUT_COLORS[0],
  'back & biceps': WORKOUT_COLORS[1],
  'shoulders & arms': WORKOUT_COLORS[3],
  'arnold split': WORKOUT_COLORS[6],
};

const BY_MUSCLE_GROUP: Record<MuscleGroup, string> = {
  Chest: WORKOUT_COLORS[0],
  Back: WORKOUT_COLORS[1],
  Legs: WORKOUT_COLORS[2],
  Shoulders: WORKOUT_COLORS[3],
  Arms: WORKOUT_COLORS[4],
  'Full body': WORKOUT_COLORS[5],
  Core: WORKOUT_COLORS[6],
  Custom: WORKOUT_COLORS[6],
};

/** FNV-1a, so a custom label keeps its colour forever. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function workoutColor(
  label: string | null,
  firstMuscleGroup?: MuscleGroup | null,
): string {
  if (label !== null && label.trim() !== '') {
    const key = label.trim().toLowerCase().replace(/\s+/g, ' ');
    return BY_LABEL[key] ?? WORKOUT_COLORS[hash(key) % WORKOUT_COLORS.length]!;
  }

  if (firstMuscleGroup) return BY_MUSCLE_GROUP[firstMuscleGroup] ?? WORKOUT_COLORS[6]!;
  return WORKOUT_COLORS[6]!;
}
