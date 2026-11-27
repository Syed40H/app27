import type { ExerciseHistory, GhostSet } from '@/domain/recall';
import type { RecordCandidate } from '@/domain/records';
import { bestSet } from '@/domain/records';
import { dayKeyOf } from '@/domain/dayKey';
import type {
  Exercise,
  MuscleGroup,
  PersonalRecord,
  Session,
  SessionEntry,
  SessionExercise,
  SessionSummary,
  SetEntry,
} from '@/domain/types';
import { getDatabase, nameKey, uid } from './client';

/**
 * Every read and write in the app.
 *
 * Positions are never stored as fixed numbers — `sort_order` is a sort key, and
 * the position a user sees is the index of the row in the ordered result. That
 * is what makes deleting the 2nd exercise promote the 3rd for free.
 */

// ---------------------------------------------------------------- exercises

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  is_custom: number;
  photo_uri: string | null;
  last_used_at: number | null;
}

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group as MuscleGroup,
    isCustom: row.is_custom === 1,
    photoUri: row.photo_uri,
    lastUsedAt: row.last_used_at,
  };
}

/**
 * Every exercise, each with the start time of the most recent session it
 * appeared in. The picker uses `lastUsedAt` to build its "Recent" section —
 * people repeat the same lifts, so the right answer is usually one tap.
 */
export async function listExercises(): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT x.id, x.name, x.muscle_group, x.is_custom, x.photo_uri,
            MAX(s.started_at) AS last_used_at
       FROM exercises x
       LEFT JOIN entries e  ON e.exercise_id = x.id
       LEFT JOIN sessions s ON s.id = e.session_id
      GROUP BY x.id
      ORDER BY x.name COLLATE NOCASE;`,
  );
  return rows.map(toExercise);
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExerciseRow>(
    `SELECT x.id, x.name, x.muscle_group, x.is_custom, x.photo_uri,
            MAX(s.started_at) AS last_used_at
       FROM exercises x
       LEFT JOIN entries e  ON e.exercise_id = x.id
       LEFT JOIN sessions s ON s.id = e.session_id
      WHERE x.id = ?
      GROUP BY x.id;`,
    [id],
  );
  return row ? toExercise(row) : null;
}

/**
 * Look up an exercise by typed name, creating it only if nothing matches.
 *
 * Matching is case- and whitespace-insensitive, so typing "bench press" when
 * Bench Press already exists returns the built-in rather than making a second
 * copy of it. A genuinely new name is saved permanently and is available in the
 * picker from then on.
 */
export async function findOrCreateExercise(
  name: string,
  muscleGroup: MuscleGroup = 'Custom',
): Promise<Exercise> {
  const db = await getDatabase();
  const key = nameKey(name);

  const existing = await db.getFirstAsync<ExerciseRow>(
    `SELECT id, name, muscle_group, is_custom, photo_uri, NULL AS last_used_at
       FROM exercises WHERE name_key = ?;`,
    [key],
  );
  if (existing) return toExercise(existing);

  const id = uid();
  await db.runAsync(
    `INSERT INTO exercises (id, name, name_key, muscle_group, is_custom, photo_uri)
     VALUES (?, ?, ?, ?, 1, NULL);`,
    [id, name.trim(), key, muscleGroup],
  );
  return {
    id,
    name: name.trim(),
    muscleGroup,
    isCustom: true,
    photoUri: null,
    lastUsedAt: null,
  };
}

/**
 * Attach a photo to an exercise. Once set for a name the photo sticks to that
 * name forever, which is why it lives on the exercise and not on a session.
 */
export async function setExercisePhoto(id: string, photoUri: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE exercises SET photo_uri = ? WHERE id = ?;', [photoUri, id]);
}

/** Photo URIs still referenced by an exercise — used to clean up orphaned files. */
export async function listPhotoUris(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ photo_uri: string }>(
    'SELECT photo_uri FROM exercises WHERE photo_uri IS NOT NULL;',
  );
  return rows.map((r) => r.photo_uri);
}

// ----------------------------------------------------------------- sessions

interface SessionRow {
  id: string;
  day_key: string;
  started_at: number;
  finished_at: number | null;
  label: string | null;
}

/**
 * The session still in progress, if there is one. At most one can exist: the
 * plus button becomes Resume while it does.
 */
export async function getInProgressSessionId(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM sessions WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;',
  );
  return row?.id ?? null;
}

export async function createSession(label: string | null = null): Promise<string> {
  const db = await getDatabase();
  const id = uid();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO sessions (id, day_key, started_at, finished_at, label) VALUES (?, ?, ?, NULL, ?);',
    [id, dayKeyOf(new Date(now)), now, label],
  );
  return id;
}

/** A full session with its entries and sets, ordered as performed. */
export async function getSession(id: string): Promise<Session | null> {
  const db = await getDatabase();
  const session = await db.getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?;', [id]);
  if (!session) return null;

  const entryRows = await db.getAllAsync<{ id: string; exercise_id: string }>(
    'SELECT id, exercise_id FROM entries WHERE session_id = ? ORDER BY sort_order;',
    [id],
  );

  const setRows = await db.getAllAsync<{
    id: string;
    entry_id: string;
    weight_kg: number | null;
    reps: number;
  }>(
    `SELECT s.id, s.entry_id, s.weight_kg, s.reps
       FROM sets s
       JOIN entries e ON e.id = s.entry_id
      WHERE e.session_id = ?
      ORDER BY e.sort_order, s.sort_order;`,
    [id],
  );

  const setsByEntry = new Map<string, SetEntry[]>();
  for (const row of setRows) {
    const list = setsByEntry.get(row.entry_id) ?? [];
    list.push({
      id: row.id,
      entryId: row.entry_id,
      index: list.length,
      weightKg: row.weight_kg,
      reps: row.reps,
    });
    setsByEntry.set(row.entry_id, list);
  }

  const entries: SessionEntry[] = entryRows.map((row, index) => ({
    id: row.id,
    sessionId: id,
    exerciseId: row.exercise_id,
    index,
    sets: setsByEntry.get(row.id) ?? [],
  }));

  return {
    id: session.id,
    dayKey: session.day_key,
    startedAt: session.started_at,
    finishedAt: session.finished_at,
    label: session.label,
    entries,
  };
}

interface SummaryRow extends SessionRow {
  exercise_count: number;
  set_count: number;
}

const SUMMARY_SELECT = `
  SELECT s.id, s.day_key, s.started_at, s.finished_at, s.label,
         COUNT(DISTINCT e.id) AS exercise_count,
         (SELECT COUNT(*) FROM sets st
            JOIN entries e2 ON e2.id = st.entry_id
           WHERE e2.session_id = s.id) AS set_count
    FROM sessions s
    LEFT JOIN entries e ON e.session_id = s.id
`;

/**
 * Exercises for a batch of sessions, in performed order.
 *
 * Done as its own query rather than a `group_concat` inside the summary select:
 * SQLite only honours `ORDER BY` within `group_concat` on newer versions, and a
 * card listing someone's exercises in the wrong order is worse than one extra
 * query per screen. It also carries the muscle group and photo, which the card's
 * pictogram strip needs.
 */
async function exercisesBySession(
  sessionIds: string[],
): Promise<Map<string, SessionExercise[]>> {
  const found = new Map<string, SessionExercise[]>();
  if (sessionIds.length === 0) return found;

  const db = await getDatabase();
  const placeholders = sessionIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{
    session_id: string;
    id: string;
    name: string;
    muscle_group: string;
    photo_uri: string | null;
  }>(
    `SELECT e.session_id, x.id, x.name, x.muscle_group, x.photo_uri
       FROM entries e
       JOIN exercises x ON x.id = e.exercise_id
      WHERE e.session_id IN (${placeholders})
      ORDER BY e.session_id, e.sort_order;`,
    sessionIds,
  );

  for (const row of rows) {
    const exercise: SessionExercise = {
      id: row.id,
      name: row.name,
      muscleGroup: row.muscle_group as MuscleGroup,
      photoUri: row.photo_uri,
    };
    const list = found.get(row.session_id);
    if (list) list.push(exercise);
    else found.set(row.session_id, [exercise]);
  }
  return found;
}

async function toSummaries(rows: SummaryRow[]): Promise<SessionSummary[]> {
  const exercises = await exercisesBySession(rows.map((r) => r.id));
  return rows.map((row) => ({
    id: row.id,
    dayKey: row.day_key,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    label: row.label,
    exerciseCount: row.exercise_count,
    setCount: row.set_count,
    exercises: exercises.get(row.id) ?? [],
  }));
}

/** Completed sessions, newest first. */
export async function listFinishedSessions(
  limit: number,
  offset = 0,
): Promise<SessionSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SummaryRow>(
    `${SUMMARY_SELECT}
      WHERE s.finished_at IS NOT NULL
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT ? OFFSET ?;`,
    [limit, offset],
  );
  return toSummaries(rows);
}

export async function countFinishedSessions(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM sessions WHERE finished_at IS NOT NULL;',
  );
  return row?.n ?? 0;
}

/**
 * The local day of every finished workout, newest first.
 *
 * Feeds the week strip and the streak. Even years of daily training is only a
 * few thousand short strings, so this is cheaper than trying to compute the
 * streak in SQL across week boundaries.
 */
export async function listTrainedDayKeys(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day_key: string }>(
    `SELECT DISTINCT day_key FROM sessions
      WHERE finished_at IS NOT NULL
      ORDER BY day_key DESC;`,
  );
  return rows.map((r) => r.day_key);
}

export async function getSessionSummary(id: string): Promise<SessionSummary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SummaryRow>(
    `${SUMMARY_SELECT} WHERE s.id = ? GROUP BY s.id;`,
    [id],
  );
  if (!row) return null;
  const [summary] = await toSummaries([row]);
  return summary ?? null;
}

export async function setSessionLabel(id: string, label: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sessions SET label = ? WHERE id = ?;', [label, id]);
}

/**
 * Close a session.
 *
 * A session with no sets logged is **discarded**, not saved: an empty record
 * should never become the "previous session" card. Returns what happened so the
 * caller can word its message honestly.
 */
export async function finishSession(id: string): Promise<'saved' | 'discarded'> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sets st
       JOIN entries e ON e.id = st.entry_id
      WHERE e.session_id = ?;`,
    [id],
  );

  if ((row?.n ?? 0) === 0) {
    await deleteSession(id);
    return 'discarded';
  }

  await db.runAsync('UPDATE sessions SET finished_at = ? WHERE id = ?;', [Date.now(), id]);
  return 'saved';
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM sets WHERE entry_id IN (SELECT id FROM entries WHERE session_id = ?);',
      [id],
    );
    await db.runAsync('DELETE FROM entries WHERE session_id = ?;', [id]);
    await db.runAsync('DELETE FROM sessions WHERE id = ?;', [id]);
  });
}

// ------------------------------------------------------------------ entries

export async function addEntry(sessionId: string, exerciseId: string): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM entries WHERE session_id = ?;',
    [sessionId],
  );
  const id = uid();
  await db.runAsync(
    'INSERT INTO entries (id, session_id, exercise_id, sort_order) VALUES (?, ?, ?, ?);',
    [id, sessionId, exerciseId, row?.next ?? 0],
  );
  return id;
}

/** Deletes the exercise card and its sets. No confirmation, by design. */
export async function deleteEntry(entryId: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM sets WHERE entry_id = ?;', [entryId]);
    await db.runAsync('DELETE FROM entries WHERE id = ?;', [entryId]);
  });
}

// --------------------------------------------------------------------- sets

export async function addSet(
  entryId: string,
  weightKg: number | null,
  reps: number,
): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM sets WHERE entry_id = ?;',
    [entryId],
  );
  const id = uid();
  await db.runAsync(
    'INSERT INTO sets (id, entry_id, sort_order, weight_kg, reps) VALUES (?, ?, ?, ?, ?);',
    [id, entryId, row?.next ?? 0, weightKg, reps],
  );
  return id;
}

/** Sets save as they are typed — there is no confirm step to batch this behind. */
export async function updateSet(
  setId: string,
  weightKg: number | null,
  reps: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sets SET weight_kg = ?, reps = ? WHERE id = ?;', [
    weightKg,
    reps,
    setId,
  ]);
}

export async function deleteSet(setId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sets WHERE id = ?;', [setId]);
}

// ------------------------------------------------------------------- recall

/**
 * The last time this exercise was done, before the session being logged.
 *
 * Ghost numbers pull from the **single most recent** session containing the
 * exercise. The current session is excluded, so doing bench twice in one
 * session still compares the second one against last week rather than against
 * this morning's first occurrence.
 *
 * The position returned is the exercise's **first** occurrence in that session,
 * derived from stored order at read time.
 */
export async function getExerciseHistory(
  exerciseId: string,
  excludeSessionId: string | null,
): Promise<ExerciseHistory | null> {
  const db = await getDatabase();

  const head = await db.getFirstAsync<{ entry_id: string; session_id: string; day_key: string }>(
    `SELECT e.id AS entry_id, e.session_id, s.day_key
       FROM entries e
       JOIN sessions s ON s.id = e.session_id
      WHERE e.exercise_id = ?
        AND (? IS NULL OR e.session_id != ?)
      ORDER BY s.started_at DESC, e.sort_order ASC
      LIMIT 1;`,
    [exerciseId, excludeSessionId, excludeSessionId],
  );
  if (!head) return null;

  const siblings = await db.getAllAsync<{ exercise_id: string }>(
    'SELECT exercise_id FROM entries WHERE session_id = ? ORDER BY sort_order;',
    [head.session_id],
  );
  const position = siblings.findIndex((e) => e.exercise_id === exerciseId) + 1;

  const sets = await db.getAllAsync<{ weight_kg: number | null; reps: number }>(
    'SELECT weight_kg, reps FROM sets WHERE entry_id = ? ORDER BY sort_order;',
    [head.entry_id],
  );

  return {
    sessionId: head.session_id,
    dayKey: head.day_key,
    position,
    totalExercises: siblings.length,
    sets: sets.map<GhostSet>((s) => ({ weightKg: s.weight_kg, reps: s.reps })),
  };
}

// ------------------------------------------------------------------ records

interface CandidateRow {
  exercise_id: string;
  name: string;
  muscle_group: string;
  photo_uri: string | null;
  weight_kg: number | null;
  reps: number;
  day_key: string;
}

/**
 * Every exercise the user has logged, with its best lift.
 *
 * Bests are derived from the sets that currently exist rather than stored, so
 * deleting the session that held a record recomputes the record from what is
 * left instead of leaving a row pointing at deleted data.
 */
export async function listPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CandidateRow>(
    `SELECT x.id AS exercise_id, x.name, x.muscle_group, x.photo_uri,
            st.weight_kg, st.reps, s.day_key
       FROM sets st
       JOIN entries e   ON e.id = st.entry_id
       JOIN sessions s  ON s.id = e.session_id
       JOIN exercises x ON x.id = e.exercise_id
      WHERE s.finished_at IS NOT NULL;`,
  );

  const byExercise = new Map<string, CandidateRow[]>();
  for (const row of rows) {
    const list = byExercise.get(row.exercise_id);
    if (list) list.push(row);
    else byExercise.set(row.exercise_id, [row]);
  }

  const records: PersonalRecord[] = [];
  for (const [exerciseId, candidates] of byExercise) {
    const best = bestSet(
      candidates.map<RecordCandidate>((row) => ({
        weightKg: row.weight_kg,
        reps: row.reps,
        dayKey: row.day_key,
      })),
    );
    if (!best) continue;
    const meta = candidates[0]!;
    records.push({
      exerciseId,
      exerciseName: meta.name,
      muscleGroup: meta.muscle_group as MuscleGroup,
      photoUri: meta.photo_uri,
      weightKg: best.weightKg,
      reps: best.reps,
      dayKey: best.dayKey,
    });
  }

  return records.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

export interface ExerciseAppearance {
  sessionId: string;
  dayKey: string;
  /** 1-based position of this exercise's first occurrence in that session. */
  position: number;
  totalExercises: number;
  sets: GhostSet[];
}

/**
 * For the exercise detail screen: the all-time best plus the last 3 sessions
 * this exercise appeared in.
 *
 * The "last 3" rule is about what the recall UI surfaces, never about storage —
 * everything older still exists and is still reachable from History.
 */
export async function getExerciseDetail(exerciseId: string): Promise<{
  best: PersonalRecord | null;
  appearances: ExerciseAppearance[];
}> {
  const db = await getDatabase();

  const sessionRows = await db.getAllAsync<{ session_id: string; day_key: string }>(
    `SELECT DISTINCT e.session_id, s.day_key, s.started_at
       FROM entries e
       JOIN sessions s ON s.id = e.session_id
      WHERE e.exercise_id = ? AND s.finished_at IS NOT NULL
      ORDER BY s.started_at DESC
      LIMIT 3;`,
    [exerciseId],
  );

  const appearances: ExerciseAppearance[] = [];
  for (const row of sessionRows) {
    const siblings = await db.getAllAsync<{ id: string; exercise_id: string }>(
      'SELECT id, exercise_id FROM entries WHERE session_id = ? ORDER BY sort_order;',
      [row.session_id],
    );
    const index = siblings.findIndex((e) => e.exercise_id === exerciseId);
    if (index === -1) continue;

    const sets = await db.getAllAsync<{ weight_kg: number | null; reps: number }>(
      'SELECT weight_kg, reps FROM sets WHERE entry_id = ? ORDER BY sort_order;',
      [siblings[index]!.id],
    );

    appearances.push({
      sessionId: row.session_id,
      dayKey: row.day_key,
      position: index + 1,
      totalExercises: siblings.length,
      sets: sets.map<GhostSet>((s) => ({ weightKg: s.weight_kg, reps: s.reps })),
    });
  }

  const all = await listPersonalRecords();
  const best = all.find((r) => r.exerciseId === exerciseId) ?? null;

  return { best, appearances };
}

// ----------------------------------------------------------------- settings

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?;',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value;`,
    [key, value],
  );
}
