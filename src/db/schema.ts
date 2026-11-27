import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schema versioning.
 *
 * The schema is versioned from v1 and upgraded with migrations — never by
 * dropping and recreating tables. A user's history has to survive every app
 * update, and there is no backup anywhere else: all data is on-device.
 *
 * To add a migration: append to `MIGRATIONS` with the next version number and
 * leave every earlier entry untouched.
 */

interface Migration {
  version: number;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE exercises (
        id           TEXT PRIMARY KEY NOT NULL,
        name         TEXT NOT NULL,
        -- Lowercased, whitespace-collapsed name. UNIQUE, so a typed custom name
        -- that matches an existing exercise can never create a duplicate entry.
        name_key     TEXT NOT NULL UNIQUE,
        muscle_group TEXT NOT NULL,
        is_custom    INTEGER NOT NULL DEFAULT 0,
        -- Local file URI. Once a photo is set for a name it sticks to that name.
        photo_uri    TEXT
      );

      CREATE TABLE sessions (
        id          TEXT PRIMARY KEY NOT NULL,
        -- Local day key, YYYY-MM-DD, computed in the device's timezone.
        day_key     TEXT NOT NULL,
        started_at  INTEGER NOT NULL,
        -- NULL while the session is still in progress.
        finished_at INTEGER,
        label       TEXT
      );
      CREATE INDEX idx_sessions_started ON sessions (started_at DESC);
      CREATE INDEX idx_sessions_finished ON sessions (finished_at, started_at DESC);

      CREATE TABLE entries (
        id          TEXT PRIMARY KEY NOT NULL,
        session_id  TEXT NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
        -- Sort key only. The position a user sees is derived from this ordering
        -- at read time, so deleting the 2nd exercise makes the 3rd the 2nd
        -- without any renumbering here.
        sort_order  INTEGER NOT NULL
      );
      CREATE INDEX idx_entries_session ON entries (session_id, sort_order);
      CREATE INDEX idx_entries_exercise ON entries (exercise_id);

      CREATE TABLE sets (
        id         TEXT PRIMARY KEY NOT NULL,
        entry_id   TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        -- Canonical kilograms. NULL means bodyweight; it is never 0, because 0
        -- is a weight someone might genuinely mean.
        weight_kg  REAL,
        reps       INTEGER NOT NULL
      );
      CREATE INDEX idx_sets_entry ON sets (entry_id, sort_order);

      CREATE TABLE settings (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.version;

/**
 * Bring the database up to `LATEST_SCHEMA_VERSION`.
 *
 * Each migration runs in its own transaction and bumps `user_version`, so an
 * interrupted upgrade resumes from where it stopped rather than half-applying.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
      // PRAGMA does not accept bound parameters, and `version` is a hardcoded
      // number from the list above, never user input.
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
    current = migration.version;
  }
}
