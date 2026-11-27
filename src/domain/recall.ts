/**
 * Exercise recall — the reason this app exists.
 *
 * Every competitor shows you what you lifted last time. None of them tell you
 * *where in the session* those numbers came from, so you cannot tell whether you
 * were fresh or already four exercises deep. That is what the position badge is
 * for, and it is a headline feature, not a detail.
 */

export interface GhostSet {
  /** Canonical kg, or `null` if that set was logged as bodyweight. */
  weightKg: number | null;
  reps: number;
}

/** What the last session that contained this exercise looked like. */
export interface ExerciseHistory {
  sessionId: string;
  dayKey: string;
  /** 1-based position of the exercise's **first** occurrence in that session. */
  position: number;
  /** How many exercises that session held in total, for the tooltip. */
  totalExercises: number;
  /** The sets of that first occurrence, in order. */
  sets: GhostSet[];
}

/**
 * Which previous set a given set today should ghost.
 *
 * Set 1 ghosts last time's set 1, set 2 ghosts set 2, and so on. Log more sets
 * today than last time and every extra one ghosts last time's **final** set —
 * that is the closest honest comparison available. Log fewer and the surplus is
 * simply unused.
 *
 * @param setIndex 0-based index of today's set.
 */
export function ghostForSet(
  history: ExerciseHistory | null,
  setIndex: number,
): GhostSet | null {
  if (!history || history.sets.length === 0) return null;
  if (setIndex < 0) return null;
  const mapped = Math.min(setIndex, history.sets.length - 1);
  return history.sets[mapped] ?? null;
}

/**
 * The number to show in the position badge, or `null` to show no badge at all.
 *
 * The badge appears **only when today's position differs from last time's**.
 * People run the same order week after week, so an always-on badge would show
 * the same number forever and stop being read. Silence when it matches is
 * exactly what makes it mean something when it appears.
 *
 * An exercise with no history has no badge either: blank inputs, no placeholder.
 *
 * @param currentPosition 1-based position of this exercise in today's session.
 */
export function positionBadge(
  history: ExerciseHistory | null,
  currentPosition: number,
): number | null {
  if (!history) return null;
  if (history.position === currentPosition) return null;
  return history.position;
}

/** The tooltip behind the badge: what the number actually means. */
export function describePosition(
  history: ExerciseHistory,
  currentPosition: number,
): string {
  const before = history.position - 1;
  const lastTime =
    before === 0
      ? 'Last time this was your first exercise'
      : `Last time you did ${before} ${before === 1 ? 'exercise' : 'exercises'} before this one`;

  const nowBefore = currentPosition - 1;
  const now =
    nowBefore === 0
      ? 'today it is your first'
      : `today it is your ${ordinal(currentPosition)}`;

  const fresher = currentPosition < history.position;
  const tail = fresher
    ? 'so you should be fresher than last time.'
    : 'so you are deeper into the session than last time.';

  return `${lastTime} — ${now}, ${tail}`;
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * 1-based position of an exercise's **first** occurrence in an ordered list of
 * entries, or `null` if it is not there.
 *
 * The same exercise twice in one session is allowed — bench early and again at
 * the end. Both the badge and the ghosts reference the first occurrence, so the
 * comparison stays stable rather than flipping to whichever copy was read last.
 *
 * Positions are always derived from stored order at read time, never stored as
 * fixed numbers, so deleting the 2nd exercise makes the 3rd the 2nd for free.
 */
export function firstOccurrencePosition(
  entries: { exerciseId: string }[],
  exerciseId: string,
): number | null {
  const index = entries.findIndex((e) => e.exerciseId === exerciseId);
  return index === -1 ? null : index + 1;
}
