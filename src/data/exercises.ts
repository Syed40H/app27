import type { MuscleGroup } from '@/domain/types';

/**
 * The built-in exercise list.
 *
 * `id` values are stable slugs and are referenced by every stored session, so
 * **never renumber or reuse an id** once shipped — change the `name` if the
 * wording needs work, but leave the id alone or history loses its exercises.
 *
 * Deliberately excluded: holds and carries measured in time or distance (plank,
 * farmer's walk, dead hang). Every set here is weight-and-reps, and logging a
 * 45-second plank as "45 reps" would be a lie in the data. Users who want them
 * can still add them as custom exercises.
 */

export interface SeedExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

/** Picker section order. Pushing movements first, then pulling, then legs. */
export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Full body',
  'Custom',
];

export const SEED_EXERCISES: SeedExercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: 'incline-bench-press', name: 'Incline Bench Press', muscleGroup: 'Chest' },
  { id: 'decline-bench-press', name: 'Decline Bench Press', muscleGroup: 'Chest' },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'chest-press-machine', name: 'Chest Press Machine', muscleGroup: 'Chest' },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'Chest' },
  { id: 'pec-deck', name: 'Pec Deck', muscleGroup: 'Chest' },
  { id: 'push-ups', name: 'Push-Ups', muscleGroup: 'Chest' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Chest' },

  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },
  { id: 'rack-pull', name: 'Rack Pull', muscleGroup: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'Back' },
  { id: 't-bar-row', name: 'T-Bar Row', muscleGroup: 'Back' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'pull-ups', name: 'Pull-Ups', muscleGroup: 'Back' },
  { id: 'chin-ups', name: 'Chin-Ups', muscleGroup: 'Back' },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', muscleGroup: 'Back' },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'Back' },
  { id: 'back-extension', name: 'Back Extension', muscleGroup: 'Back' },

  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { id: 'landmine-press', name: 'Landmine Press', muscleGroup: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', muscleGroup: 'Shoulders' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { id: 'upright-row', name: 'Upright Row', muscleGroup: 'Shoulders' },
  { id: 'shrug', name: 'Shrug', muscleGroup: 'Shoulders' },

  // Arms
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'Arms' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'Arms' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Arms' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'Arms' },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'Arms' },
  { id: 'concentration-curl', name: 'Concentration Curl', muscleGroup: 'Arms' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Arms' },
  { id: 'skull-crushers', name: 'Skull Crushers', muscleGroup: 'Arms' },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', muscleGroup: 'Arms' },
  { id: 'close-grip-bench-press', name: 'Close-Grip Bench Press', muscleGroup: 'Arms' },
  { id: 'tricep-kickback', name: 'Tricep Kickback', muscleGroup: 'Arms' },
  { id: 'wrist-curl', name: 'Wrist Curl', muscleGroup: 'Arms' },

  // Legs
  { id: 'back-squat', name: 'Back Squat', muscleGroup: 'Legs' },
  { id: 'front-squat', name: 'Front Squat', muscleGroup: 'Legs' },
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Legs' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroup: 'Legs' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Legs' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { id: 'lunge', name: 'Lunge', muscleGroup: 'Legs' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroup: 'Legs' },
  { id: 'step-up', name: 'Step-Up', muscleGroup: 'Legs' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Legs' },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Legs' },
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Legs' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'Legs' },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Legs' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'Legs' },

  // Core
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core' },
  { id: 'sit-ups', name: 'Sit-Ups', muscleGroup: 'Core' },
  { id: 'decline-sit-up', name: 'Decline Sit-Up', muscleGroup: 'Core' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core' },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
  { id: 'cable-woodchop', name: 'Cable Woodchop', muscleGroup: 'Core' },

  // Full body
  { id: 'clean-and-press', name: 'Clean and Press', muscleGroup: 'Full body' },
  { id: 'power-clean', name: 'Power Clean', muscleGroup: 'Full body' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroup: 'Full body' },
  { id: 'thruster', name: 'Thruster', muscleGroup: 'Full body' },
  { id: 'burpees', name: 'Burpees', muscleGroup: 'Full body' },
];

/** Common splits offered in the session label dropdown. Purely a label. */
export const SESSION_LABELS = [
  'Push',
  'Pull',
  'Legs',
  'Upper',
  'Lower',
  'Full body',
  'Chest & Triceps',
  'Back & Biceps',
  'Shoulders & Arms',
  'Arnold Split',
];
