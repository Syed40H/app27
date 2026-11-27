import * as SQLite from 'expo-sqlite';

import { SEED_EXERCISES } from '@/data/exercises';
import { migrate } from './schema';

/**
 * The single on-device database.
 *
 * There is no backend, no account and no sync — this file is the whole storage
 * layer. Opening is memoised so every screen shares one connection, and the
 * first caller does the migration while the rest await the same promise.
 */

const DATABASE_NAME = 'repa.db';

let opening: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  opening ??= open();
  return opening;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrate(db);
  await seedBuiltInExercises(db);
  return db;
}

/**
 * Insert any built-in exercises the database does not have yet.
 *
 * Runs on every launch so a later app version can ship new lifts. It only ever
 * inserts: a user's photo, or a name they have edited, is never overwritten,
 * and `ON CONFLICT DO NOTHING` covers the case where a user had already created
 * a custom exercise whose name collides with a new built-in.
 */
async function seedBuiltInExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const exercise of SEED_EXERCISES) {
      await db.runAsync(
        `INSERT INTO exercises (id, name, name_key, muscle_group, is_custom, photo_uri)
         VALUES (?, ?, ?, ?, 0, NULL)
         ON CONFLICT DO NOTHING;`,
        [exercise.id, exercise.name, nameKey(exercise.name), exercise.muscleGroup],
      );
    }
  });
}

/**
 * The collision key for an exercise name: case- and whitespace-insensitive.
 *
 * A typed custom name that matches an existing exercise must match to that
 * exercise, never create a second copy of it — so "  bench   press " and
 * "Bench Press" have to land on the same key.
 */
export function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Short, sortable, collision-resistant enough for a single-device database. */
export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Drop every row the user owns and reset to a fresh install.
 *
 * Built-in exercises are re-seeded afterwards, so the picker is not left empty.
 * This is the only bulk deletion in the app, and it is reachable only from
 * Settings behind a confirmation.
 */
export async function deleteAllData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    // sets and entries cascade from sessions, but they are cleared explicitly
    // so the wipe does not depend on foreign keys being enabled.
    await db.execAsync('DELETE FROM sets;');
    await db.execAsync('DELETE FROM entries;');
    await db.execAsync('DELETE FROM sessions;');
    await db.execAsync('DELETE FROM exercises;');
  });
  await seedBuiltInExercises(db);
}
