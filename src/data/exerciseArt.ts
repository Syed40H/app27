import type { MuscleGroup } from '@/domain/types';
import type { PictogramName } from './pictograms';

/**
 * Which pictogram stands for which exercise.
 *
 * Built-ins are mapped explicitly by id so the picture matches the movement
 * rather than just the muscle. Anything unmapped — including every custom
 * exercise a user types — falls back to a keyword match on the name, then to
 * its muscle group, and finally to a plain dumbbell, so the icon slot is never
 * empty.
 */
export const BY_EXERCISE_ID: Record<string, PictogramName> = {
  // Chest
  'bench-press': 'benchPress',
  'incline-bench-press': 'benchPress',
  'decline-bench-press': 'benchPress',
  'dumbbell-bench-press': 'benchPress',
  'incline-dumbbell-press': 'benchPress',
  'chest-press-machine': 'benchPress',
  'cable-fly': 'chestFly',
  'pec-deck': 'chestFly',
  'push-ups': 'pushUp',
  dips: 'dip',

  // Back
  deadlift: 'deadlift',
  'rack-pull': 'deadlift',
  'barbell-row': 'row',
  'dumbbell-row': 'row',
  't-bar-row': 'row',
  'seated-cable-row': 'row',
  'lat-pulldown': 'pulldown',
  'straight-arm-pulldown': 'pulldown',
  'pull-ups': 'pullUp',
  'chin-ups': 'pullUp',
  'face-pull': 'cable',
  'back-extension': 'hipThrust',

  // Shoulders
  'overhead-press': 'overheadPress',
  'dumbbell-shoulder-press': 'overheadPress',
  'arnold-press': 'overheadPress',
  'landmine-press': 'overheadPress',
  'lateral-raise': 'lateralRaise',
  'front-raise': 'lateralRaise',
  'rear-delt-fly': 'chestFly',
  'upright-row': 'shrug',
  shrug: 'shrug',

  // Arms
  'barbell-curl': 'curl',
  'dumbbell-curl': 'curl',
  'hammer-curl': 'curl',
  'preacher-curl': 'curl',
  'cable-curl': 'curl',
  'concentration-curl': 'curl',
  'tricep-pushdown': 'cable',
  'skull-crushers': 'benchPress',
  'overhead-tricep-extension': 'overheadPress',
  'close-grip-bench-press': 'benchPress',
  'tricep-kickback': 'dumbbell',
  'wrist-curl': 'dumbbell',

  // Legs
  'back-squat': 'squat',
  'front-squat': 'squat',
  'goblet-squat': 'squat',
  'hack-squat': 'squat',
  lunge: 'squat',
  'bulgarian-split-squat': 'squat',
  'step-up': 'squat',
  'leg-press': 'legPress',
  'romanian-deadlift': 'deadlift',
  'leg-extension': 'legMachine',
  'leg-curl': 'legMachine',
  'hip-thrust': 'hipThrust',
  'glute-bridge': 'hipThrust',
  'calf-raise': 'calfRaise',
  'seated-calf-raise': 'calfRaise',

  // Core
  'hanging-leg-raise': 'core',
  'sit-ups': 'core',
  'decline-sit-up': 'core',
  'russian-twist': 'core',
  'ab-wheel-rollout': 'pushUp',
  'cable-crunch': 'cable',
  'cable-woodchop': 'cable',

  // Full body
  'clean-and-press': 'overheadPress',
  'power-clean': 'deadlift',
  'kettlebell-swing': 'kettlebell',
  thruster: 'overheadPress',
  burpees: 'pushUp',
};

const BY_MUSCLE_GROUP: Record<MuscleGroup, PictogramName> = {
  Chest: 'benchPress',
  Back: 'row',
  Shoulders: 'overheadPress',
  Arms: 'curl',
  Legs: 'squat',
  Core: 'core',
  'Full body': 'kettlebell',
  Custom: 'dumbbell',
};

/**
 * Keywords that let a typed custom name still get a fitting picture.
 *
 * **Order matters: specific patterns must come before generic ones.** The first
 * match wins, so a bare "press" above "leg press" would send "Leg Press" to the
 * overhead-press drawing, and "curl" above "leg curl" would send a hamstring
 * curl to the biceps one.
 */
const BY_KEYWORD: [RegExp, PictogramName][] = [
  // Compound equipment names, ahead of the bare movement words below.
  [/bench|chest press/, 'benchPress'],
  [/leg press/, 'legPress'],
  [/leg extension|leg curl|hamstring|quad extension/, 'legMachine'],
  [/calf/, 'calfRaise'],
  [/hip thrust|glute|bridge|hyperextension|back extension/, 'hipThrust'],
  [/pulldown|pull down/, 'pulldown'],
  [/pullup|pull up|pull-up|chinup|chin up|chin-up/, 'pullUp'],
  [/pushup|push up|push-up|pressup|press up/, 'pushUp'],

  // Movement words.
  [/fly|flye|pec deck/, 'chestFly'],
  [/(^|[^a-z])dips?([^a-z]|$)/, 'dip'],
  [/deadlift|rack pull|(^|[^a-z])clean([^a-z]|$)|snatch|good morning/, 'deadlift'],
  [/(^|[^a-z])rows?([^a-z]|$)/, 'row'],
  [/lateral|side raise|front raise|rear delt|face pull/, 'lateralRaise'],
  [/shrug|(^|[^a-z])traps?([^a-z]|$)/, 'shrug'],
  [/curl/, 'curl'],
  [/squat|lunge|split|stepup|step up|step-up/, 'squat'],
  [/(^|[^a-z])abs?([^a-z]|$)|core|plank|situp|sit up|sit-up|crunch|leg raise|oblique|twist/, 'core'],
  [/kettlebell|swing|burpee|thruster|carry|farmer/, 'kettlebell'],
  [/cable|pushdown|tricep|extension/, 'cable'],

  // The greedy one, deliberately last.
  [/overhead|shoulder press|military|press/, 'overheadPress'],
];

/**
 * The pictogram for an exercise. Always returns something — the icon slot is
 * never allowed to be empty once an exercise has a name.
 */
export function pictogramFor(
  exerciseId: string,
  name: string,
  muscleGroup: MuscleGroup,
): PictogramName {
  const byId = BY_EXERCISE_ID[exerciseId];
  if (byId) return byId;

  const haystack = name.trim().toLowerCase();
  for (const [pattern, pictogram] of BY_KEYWORD) {
    if (pattern.test(haystack)) return pictogram;
  }

  return BY_MUSCLE_GROUP[muscleGroup] ?? 'dumbbell';
}
