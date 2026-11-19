import type { DatabaseSync } from "node:sqlite";

const migrations = [
  {
    version: 1,
    sql: `ALTER TABLE matches ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
      CREATE TABLE guest_players (
        person_id TEXT PRIMARY KEY REFERENCES people(id),
        match_id TEXT NOT NULL REFERENCES matches(id)
      );`,
  },
];

/** Se ejecuta después de inicializar el esquema legado; nunca borra datos. */
export function applyMigrations(database: DatabaseSync): void {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL
  );`);
  for (const migration of migrations) {
    database.exec("BEGIN IMMEDIATE");
    try {
      const applied = database
        .prepare("SELECT 1 FROM schema_migrations WHERE version=?")
        .get(migration.version);
      if (!applied) {
        database.exec(migration.sql);
        database
          .prepare("INSERT INTO schema_migrations VALUES (?,?)")
          .run(migration.version, Date.now());
      }
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
}
