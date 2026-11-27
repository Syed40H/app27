/** Core domain types. Weights are always canonical kilograms — see `units.ts`. */

export type Unit = 'lb' | 'kg';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Full body'
  /**
   * Where user-created exercises land. Typing a name at a machine should not
   * also demand a taxonomy decision, so nothing asks which muscle it trains.
   */
  | 'Custom';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Built-ins ship with the app; custom ones are created by the user. */
  isCustom: boolean;
  /**
   * Local file URI for a user photo. Once a photo is set for a name it sticks to
   * that name forever, so this lives on the exercise, not on any one session.
   */
  photoUri: string | null;
  /** Millis since epoch of the most recent session this exercise appeared in. */
  lastUsedAt: number | null;
}

export interface SetEntry {
  id: string;
  entryId: string;
  /** Ordinal within the entry, 0-based. Derived from order at read time. */
  index: number;
  /** Canonical kilograms. `null` means bodyweight — never store 0 for "no weight". */
  weightKg: number | null;
  /** Always required. */
  reps: number;
}

export interface SessionEntry {
  id: string;
  sessionId: string;
  exerciseId: string;
  /** Ordinal within the session, 0-based. Derived from stored order at read time. */
  index: number;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  /** Local day key, `YYYY-MM-DD`, computed in the device's timezone. */
  dayKey: string;
  /** Millis since epoch — orders two sessions logged on the same day. */
  startedAt: number;
  finishedAt: number | null;
  label: string | null;
  entries: SessionEntry[];
}

/** Just enough of an exercise to draw its tile on a session card. */
export interface SessionExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  photoUri: string | null;
}

/** A session row without its entries, for list screens. */
export interface SessionSummary {
  id: string;
  dayKey: string;
  startedAt: number;
  finishedAt: number | null;
  label: string | null;
  exerciseCount: number;
  setCount: number;
  /** Exercises in performed order, for the card's pictogram strip. */
  exercises: SessionExercise[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  photoUri: string | null;
  /** `null` for a bodyweight best, where `reps` alone is the record. */
  weightKg: number | null;
  reps: number;
  /** Local day key of the first session that hit this best. */
  dayKey: string;
}
