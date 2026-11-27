/**
 * Personal bests.
 *
 * "Best" is the heaviest weight lifted, shown with the reps achieved at that
 * weight — literal and honest, not an estimated 1RM.
 *
 * Records are always **derived** from the sets that currently exist, never
 * stored. That is what makes deleting the session that held a best recompute
 * the best from what is left, with no orphaned row pointing at deleted data.
 */

export interface RecordCandidate {
  /** Canonical kg, or `null` for a set logged as bodyweight. */
  weightKg: number | null;
  reps: number;
  /** Local day key of the session the set belongs to. */
  dayKey: string;
}

/**
 * The best set from a list of candidates, or `null` if there are none.
 *
 * Tiebreak, in order: heaviest weight -> most reps at that weight -> earliest
 * date. The first time you hit it counts, not the most recent repeat.
 *
 * An exercise whose sets carry no weight at all — pull-ups, dips, push-ups —
 * has no "heaviest", so its best is the **most reps in a single set**, again
 * tiebroken by earliest date. If even one set of the exercise was loaded, the
 * weighted sets win and the bodyweight ones are ignored: a weighted pull-up is
 * strictly the better lift, so a 12-rep unweighted set should not outrank it.
 */
export function bestSet(candidates: RecordCandidate[]): RecordCandidate | null {
  if (candidates.length === 0) return null;

  const weighted = candidates.filter((c) => c.weightKg !== null);
  const pool = weighted.length > 0 ? weighted : candidates;

  return pool.reduce((best, candidate) => (beats(candidate, best) ? candidate : best));
}

/** Strict "is a better record than", using the documented tiebreak order. */
function beats(candidate: RecordCandidate, best: RecordCandidate): boolean {
  const a = candidate.weightKg;
  const b = best.weightKg;

  if (a !== null && b !== null) {
    if (a !== b) return a > b;
  }

  if (candidate.reps !== best.reps) return candidate.reps > best.reps;

  // Earliest date wins: the first time you hit it is the record.
  return candidate.dayKey < best.dayKey;
}
