import { getDatabase, uid } from '@/db/client';
import { dayKeyOf } from '@/domain/dayKey';
import { lbToKg } from '@/domain/units';

/**
 * Sample workouts, for App Store screenshots and review material only.
 *
 * This exists **solely** so a reviewer or a screenshot never sees an empty app.
 * It is behind a build-time flag and is off in production, so it is never shown
 * to a real user and never mixed into their data.
 *
 * Build it with:  eas build --profile demo --platform ios
 * Run it locally: EXPO_PUBLIC_DEMO_SEED=1 npx expo start
 */

/**
 * Read at build time — Expo inlines `EXPO_PUBLIC_*` into the bundle, so a
 * production build has this as a literal `'0'` and the seeding code below is
 * unreachable.
 */
export const DEMO_SEED_ENABLED = process.env.EXPO_PUBLIC_DEMO_SEED === '1';

interface DemoSet {
  lb: number | null;
  reps: number;
}

interface DemoSession {
  /** Days before today. */
  daysAgo: number;
  label: string;
  exercises: { id: string; sets: DemoSet[] }[];
}

/**
 * Six sessions across two weeks.
 *
 * Deliberately shaped so the position badge has something to say: Bench Press
 * is the 1st exercise on day 12 and the 2nd on day 5, and Back Squat holds its
 * position between leg days so its badge correctly stays hidden.
 */
const DEMO_SESSIONS: DemoSession[] = [
  {
    daysAgo: 12,
    label: 'Push',
    exercises: [
      { id: 'bench-press', sets: [{ lb: 175, reps: 8 }, { lb: 185, reps: 6 }, { lb: 185, reps: 5 }] },
      { id: 'incline-dumbbell-press', sets: [{ lb: 60, reps: 10 }, { lb: 65, reps: 8 }] },
      { id: 'overhead-press', sets: [{ lb: 95, reps: 8 }, { lb: 105, reps: 6 }] },
      { id: 'tricep-pushdown', sets: [{ lb: 50, reps: 12 }, { lb: 55, reps: 10 }] },
    ],
  },
  {
    daysAgo: 10,
    label: 'Pull',
    exercises: [
      { id: 'deadlift', sets: [{ lb: 275, reps: 5 }, { lb: 295, reps: 3 }] },
      { id: 'barbell-row', sets: [{ lb: 135, reps: 10 }, { lb: 145, reps: 8 }] },
      { id: 'lat-pulldown', sets: [{ lb: 120, reps: 10 }, { lb: 130, reps: 8 }] },
      { id: 'barbell-curl', sets: [{ lb: 65, reps: 10 }, { lb: 65, reps: 9 }] },
    ],
  },
  {
    daysAgo: 8,
    label: 'Legs',
    exercises: [
      { id: 'back-squat', sets: [{ lb: 205, reps: 8 }, { lb: 225, reps: 5 }] },
      { id: 'romanian-deadlift', sets: [{ lb: 165, reps: 10 }, { lb: 175, reps: 8 }] },
      { id: 'leg-press', sets: [{ lb: 320, reps: 12 }, { lb: 360, reps: 10 }] },
      { id: 'calf-raise', sets: [{ lb: 140, reps: 15 }, { lb: 140, reps: 13 }] },
    ],
  },
  {
    daysAgo: 5,
    label: 'Push',
    exercises: [
      // Overhead press leads today, so bench lands 2nd — the badge shows "1".
      { id: 'overhead-press', sets: [{ lb: 105, reps: 7 }, { lb: 105, reps: 6 }] },
      { id: 'bench-press', sets: [{ lb: 185, reps: 7 }, { lb: 190, reps: 5 }, { lb: 185, reps: 5 }] },
      { id: 'cable-fly', sets: [{ lb: 40, reps: 12 }, { lb: 45, reps: 10 }] },
      { id: 'skull-crushers', sets: [{ lb: 70, reps: 10 }, { lb: 75, reps: 8 }] },
    ],
  },
  {
    daysAgo: 3,
    label: 'Pull',
    exercises: [
      // Bodyweight: no weight logged, so its record is "most reps in a set".
      { id: 'pull-ups', sets: [{ lb: null, reps: 12 }, { lb: null, reps: 10 }, { lb: null, reps: 8 }] },
      { id: 'barbell-row', sets: [{ lb: 145, reps: 10 }, { lb: 155, reps: 8 }] },
      { id: 'seated-cable-row', sets: [{ lb: 130, reps: 10 }, { lb: 140, reps: 9 }] },
      { id: 'hammer-curl', sets: [{ lb: 35, reps: 12 }, { lb: 40, reps: 10 }] },
    ],
  },
  {
    daysAgo: 1,
    label: 'Legs',
    exercises: [
      // Squat stays 1st, so its badge stays hidden — silence when it matches.
      { id: 'back-squat', sets: [{ lb: 225, reps: 6 }, { lb: 235, reps: 5 }] },
      { id: 'leg-press', sets: [{ lb: 360, reps: 12 }, { lb: 400, reps: 8 }] },
      { id: 'leg-curl', sets: [{ lb: 90, reps: 12 }, { lb: 100, reps: 10 }] },
      { id: 'hip-thrust', sets: [{ lb: 185, reps: 12 }, { lb: 205, reps: 10 }] },
    ],
  },
];

/**
 * Insert the sample sessions, but only into a database that has none of its
 * own. A real user's data is never touched.
 */
export async function seedDemoDataIfEnabled(): Promise<void> {
  if (!DEMO_SEED_ENABLED) return;

  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sessions;');
  if ((existing?.n ?? 0) > 0) return;

  for (const session of DEMO_SESSIONS) {
    const started = new Date();
    started.setDate(started.getDate() - session.daysAgo);
    started.setHours(18, 30, 0, 0);
    const startedAt = started.getTime();

    const sessionId = uid();
    await db.runAsync(
      'INSERT INTO sessions (id, day_key, started_at, finished_at, label) VALUES (?, ?, ?, ?, ?);',
      [sessionId, dayKeyOf(started), startedAt, startedAt + 62 * 60 * 1000, session.label],
    );

    for (let e = 0; e < session.exercises.length; e++) {
      const exercise = session.exercises[e]!;
      const entryId = uid();
      await db.runAsync(
        'INSERT INTO entries (id, session_id, exercise_id, sort_order) VALUES (?, ?, ?, ?);',
        [entryId, sessionId, exercise.id, e],
      );

      for (let s = 0; s < exercise.sets.length; s++) {
        const set = exercise.sets[s]!;
        await db.runAsync(
          'INSERT INTO sets (id, entry_id, sort_order, weight_kg, reps) VALUES (?, ?, ?, ?, ?);',
          [uid(), entryId, s, set.lb === null ? null : lbToKg(set.lb), set.reps],
        );
      }
    }
  }
}
